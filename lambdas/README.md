# Lambdas

Deployed by `.github/workflows/deploy-lambdas.yml` on merge to `main`, when
anything under `lambdas/**` changes. See [Automated deployment](#automated-deployment)
for the one-time setup that workflow needs.

| Folder | Trigger | What it does |
| --- | --- | --- |
| `image_compression/` | S3 `ObjectCreated:*` on `gahoi-milan-photos` | Shrinks a profile photo in place and writes a thumbnail |
| `kundali/` | Invoked from the backend | North Indian horoscope chart from birth date, time and place |

---

## Automated deployment

On merge to `main`, for each function the workflow builds its dependency layer
for `manylinux2014_aarch64`, publishes a new layer version, packages the
handler, then creates the function if it is missing or updates it if it is not.
The kundali function is then actually invoked, because "deployed" and "works"
are different claims - a layer built for the wrong architecture deploys
perfectly and fails on first import.

### One-time setup

**1. Create the execution role.** The workflow does not create IAM roles on
purpose: doing so needs permissions far wider than deploying code, and a CI key
that can mint roles is a much bigger problem than a CI key that can update a
function. Create it once:

- Trusted entity: AWS service → Lambda
- Attach `AWSLambdaBasicExecutionRole` (CloudWatch Logs)
- Add this inline policy so image_compression can read and write photos:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::gahoi-milan-photos/*"
  }]
}
```

**2. Add the role ARN as a GitHub secret** named `LAMBDA_EXECUTION_ROLE_ARN`.
The workflow fails fast with an explanation if it is missing, rather than
getting halfway and leaving a published layer with no function attached.

**3. Check the deploying key can actually deploy.** `AWS_ACCESS_KEY_ID` /
`AWS_SECRET_ACCESS_KEY` already exist for the backend deploy, but that key was
provisioned for S3 and SSM. It also needs:

```
lambda:GetFunction, lambda:CreateFunction, lambda:UpdateFunctionCode,
lambda:UpdateFunctionConfiguration, lambda:PublishLayerVersion,
lambda:InvokeFunction, iam:PassRole
```

`iam:PassRole` is the one people miss - creating a function means handing it the
execution role, and without that permission `create-function` fails with an
error that reads like the role is wrong rather than the caller.

### What the workflow deliberately does not do

- **Create the S3 trigger.** Set it up once by hand, and read the recursion
  section below first. This function writes back to the bucket that triggers
  it, and getting that wrong bills you for an infinite loop.
- **Manage environment variables.** Tuning (`QUALITY`, `MAX_EDGE`, and so on)
  stays in the console so it can be changed without a deploy.
- **Delete old layer versions.** Layer versions are immutable and accumulate.
  Prune occasionally; nothing breaks if you do not.

---

## image_compression

### What it achieves

Measured on a 6.6 MB 4032x3024 photo:

| Setting | Size | Saved | PSNR vs lossless resize |
| --- | --- | --- | --- |
| original | 6760 KB | - | - |
| 1600px, quality 95 | 613 KB | 90.9% | 37.9 dB |
| **1600px, quality 82** (default) | **278 KB** | **95.9%** | **36.7 dB** |
| 1600px, quality 60 | 174 KB | 97.4% | 35.7 dB |
| thumbnail 400px, quality 78 | 4 KB | 99.9% | - |

The important line is the first one. Capping the long edge at 1600px saves 91%
*before quality is touched at all*, because those pixels were being downloaded
and then discarded by the scaler - the app never displays a 4032px image. That
is why the default quality stays at a conservative 82 rather than being pushed
down: the size problem is already solved by resolution, and quality below ~75 is
where JPEG artifacts start showing on skin tones and flat backgrounds, which is
most of a face shot.

So: roughly 96% smaller, no visible softening at viewing size.

### Deploying

The runtime has no Pillow, so it needs a layer.

1. **Create the function**
   - Runtime: Python 3.12
   - Architecture: arm64 (cheaper per ms; make sure the layer matches)
   - Memory: **1024 MB**. Not for headroom - Lambda scales CPU with memory, and
     decoding a 12-megapixel JPEG at 512 MB takes long enough that the extra
     memory is cheaper than the extra duration.
   - Timeout: 30s
   - Handler: `lambda_function.lambda_handler`

2. **Add a Pillow layer.** Either the public
   [Klayers](https://github.com/keithrozario/Klayers) ARN for your region and
   Python version, or build your own:

   ```bash
   mkdir -p python && pip install --target python --platform manylinux2014_aarch64 --only-binary=:all: Pillow && zip -r pillow-layer.zip python
   ```

3. **Set the S3 trigger** on `gahoi-milan-photos`, event `s3:ObjectCreated:*`.
   Do **not** set a prefix or suffix filter - photos are stored at the bucket
   root with UUID keys and usually no file extension, so there is nothing to
   filter on. Recursion is prevented in code instead; see below.

4. **IAM policy** for the function's execution role:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:GetObject", "s3:PutObject", "s3:GetObjectTagging", "s3:PutObjectTagging"],
         "Resource": "arn:aws:s3:::gahoi-milan-photos/*"
       },
       {
         "Effect": "Allow",
         "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
         "Resource": "arn:aws:logs:*:*:*"
       }
     ]
   }
   ```

### The recursion trap

This function writes back to the bucket that triggers it. Left unguarded that is
an infinite loop that bills you for it, and it is the single most common way an
S3 image Lambda goes wrong.

Two independent guards:

1. Everything written carries `x-amz-meta-compressed: v1`. Any object arriving
   with that marker is skipped, so the function's own writes are inert.
2. Keys under `thumbs/` are skipped outright.

Both exist deliberately. The marker alone would still loop on thumbnails if a
marker write ever failed; the prefix alone does nothing for the in-place
overwrite of the original.

**Before enabling the trigger in production**, set a low reserved concurrency
(say 5) and watch the invocation count for a few minutes. If it climbs without
new uploads, the guard is not working and you can cap the damage.

### Tuning

All via environment variables:

| Variable | Default | Notes |
| --- | --- | --- |
| `MAX_EDGE` | `1600` | Long edge of the stored image |
| `THUMB_EDGE` | `400` | Long edge of the thumbnail |
| `QUALITY` | `82` | Don't go below 75 - that's where faces start showing artifacts |
| `THUMB_QUALITY` | `78` | Thumbnails are shown small; a little more loss is invisible |
| `OUTPUT_FORMAT` | `JPEG` | `WEBP` is another 25-30% smaller at matched quality |
| `MAX_SOURCE_BYTES` | `40 MB` | Above this the object is skipped rather than risking OOM |

**On WebP:** every client here supports it - expo-image on both platforms, and
every current browser. It is not the default only because these objects are
served by key with no file extension, so the stored `Content-Type` is the only
thing telling a client what the bytes are. Switching is a one-variable change,
worth making deliberately once you've confirmed nothing reads the extension.

### Backfilling existing photos

The trigger only fires on new uploads. For the photos already in the bucket,
copying each object onto itself re-fires `ObjectCreated`:

```bash
aws s3 cp s3://gahoi-milan-photos/ s3://gahoi-milan-photos/ --recursive --metadata-directive REPLACE --exclude "thumbs/*"
```

Do this **after** verifying the recursion guard on a handful of objects.

### Side effects worth knowing

- **EXIF is stripped.** That is deliberate: camera metadata is commonly 40-80 KB
  and includes GPS coordinates of where the photo was taken, which has no
  business being on a matrimony profile. Orientation is applied to the pixels
  first, so portrait photos do not end up sideways.
- **`Cache-Control: public, max-age=31536000, immutable`** is set on every
  write. Keys are UUIDs whose contents never change, so this is safe and it is
  what lets clients and any CDN stop re-fetching. See the caching notes below.

---

## kundali

Generates a north Indian birth chart from date, time and place of birth, and
returns both the data and a ready-to-render SVG.

### Request

```json
{ "date": "1995-08-15", "time": "09:30", "place": "Jhansi" }
```

or, for anywhere not in the built-in city list:

```json
{ "date": "1995-08-15", "time": "09:30", "latitude": 25.4484, "longitude": 78.5685, "tz_offset": 5.5 }
```

`time` is required and has no default on purpose. An hour of error moves the
ascendant by roughly a whole sign, changing every house placement, so guessing
noon would produce a chart that looks authoritative and is wrong throughout.

### Response

Chart data plus three fields that map straight onto columns already on
`user_profile` - so one call can populate them:

| Response field | Column |
| --- | --- |
| `moon_sign` | `zodiac` |
| `nakshatra` | `nakshatra` |
| `manglik` | `manglik` |

Also returns `ascendant`, `planets` (all nine grahas with sign, house,
nakshatra, pada and retrograde flag), `houses`, and `svg`.

### Conventions

Astrology has several mutually incompatible systems and the wrong one produces a
chart that is self-consistent but wrong for the user. This uses the north Indian
Vedic set:

- **Sidereal zodiac, Lahiri ayanamsa** - what Indian almanacs use. Tropical
  (western) coordinates would put nearly every planet a sign out.
- **Whole sign houses** - house 1 is always the top-centre diamond and the rashi
  numbers move. This is the opposite of a south Indian chart.
- **Rahu/Ketu as mean nodes**, exactly 180 degrees apart.
- **Moshier ephemeris**, so no 90 MB of data files in the layer. Sub-arcsecond,
  far beyond what chart interpretation uses.

Verified against Gandhi's published chart (2 Oct 1869, Porbandar): produces Tula
lagna and Moon in Kark, both matching. Internal checks confirm exact Rahu/Ketu
opposition, whole-sign house mapping, all nine grahas placed once, and a Lahiri
ayanamsa of 23.799 degrees for 1995.

### Deploying

- Runtime Python 3.12, arm64, 512 MB, 10s timeout
- Handler `lambda_function.lambda_handler`
- Layer containing `pyswisseph`, built on Linux for the matching architecture:

  ```bash
  mkdir -p python && pip install --target python --platform manylinux2014_aarch64 --only-binary=:all: pyswisseph && zip -r swisseph-layer.zip python
  ```

- No S3 or network access needed, so the execution role needs only the basic
  CloudWatch Logs permissions.

Invoke it from the backend rather than exposing it publicly - the inputs are
date of birth, exact time and birthplace, which is about as identifying as
personal data gets.

---

## Caching, and whether CloudFront saves money

Short answer: **yes, but the presigned URLs have to change first, and the bigger
win is the compression above.**

### The problem with the current setup

Photos are served through `generatePresignedUrl`, which mints a **new signed URL
every time a profile is fetched**. The query string differs on each call, so:

- every scroll past the same profile is a fresh S3 GET, billed again;
- no HTTP cache - client, CDN, or otherwise - can ever reuse a response, because
  the URL is never the same twice;
- a CDN in front of this would have a near-0% hit rate and would *add* cost.

That is the thing to fix, and it is worth more than the CDN decision.

### Order of impact

1. **Compress (done above).** 96% fewer bytes off every single request. Nothing
   else comes close, and it needs no architectural change.
2. **Serve thumbnails in lists.** A feed of 20 profiles currently pulls 20 full
   images; with `thumbs/` it pulls ~4 KB each instead of ~278 KB. That is a
   ~98% cut on the most-hit screen in the app.
3. **Make URLs stable and cacheable.** Either lengthen presign expiry to hours
   and cache the URL string server-side per attachment, or make the bucket
   private behind CloudFront with signed cookies / long-lived signed URLs. Only
   then can anything actually cache.
4. **Then** put CloudFront in front.

### Does CloudFront save money?

On raw transfer, modestly: S3 egress to internet is about \$0.109/GB in
ap-south-1; CloudFront to India is about \$0.109/GB too, so the per-GB rate is
roughly a wash. **The saving is in the origin requests, not the bytes** -
CloudFront serves repeat views from cache, so S3 GET charges and S3 egress drop
to near zero for popular profiles.

That only materialises with a decent hit rate, which requires step 3. With
per-request presigned URLs, CloudFront hit rate is ~0% and you pay for both.

Rough shape at 1,000 daily active users each viewing 50 photos:

| | Per month |
| --- | --- |
| Today: 1.5M requests x ~3 MB | ~4.5 TB, ~\$490 |
| After compression + thumbnails | ~120 GB, ~\$13 |
| After CloudFront with a 90% hit rate | ~\$8-10 |

Do steps 1 and 2 first. They are the difference between \$490 and \$13.
CloudFront is the difference between \$13 and \$9, and it costs you an
architectural change to get there - worth doing, but not first.

### Client-side caching

`expo-image` already caches to disk by default, keyed by URL. With per-request
presigned URLs that cache never hits, for the same reason CDNs cannot. Once URLs
are stable, set `cachePolicy="memory-disk"` on the profile images and the app
stops re-downloading photos the user has already seen this week.
