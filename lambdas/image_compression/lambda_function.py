"""
S3-triggered image compression for gahoi-milan-photos.

Shrinks profile photos hard while keeping them looking untouched at the size
they are actually viewed, and writes a thumbnail for list screens.

Why the settings below and not "quality=60"
-------------------------------------------
Two different levers reduce a photo's bytes, and only one of them causes the
blur people complain about:

  * Resolution. A modern phone camera produces 3000-4000px wide images. The app
    shows a profile photo in a view about 400pt wide - roughly 1200 physical
    pixels on a 3x screen. Every pixel beyond that is downloaded, decoded, and
    then thrown away by the scaler. Capping the long edge at MAX_EDGE is where
    most of the saving comes from and it is visually free, because those pixels
    were never displayed.

  * JPEG quality. This is the lever that blurs. Below about 75 the artifacts
    become visible on skin tones and flat backgrounds, which is exactly what a
    face shot is made of. QUALITY sits at 82: essentially indistinguishable
    from the original at viewing size, while still much smaller.

Doing most of the work with the first lever is what allows the second to stay
conservative. Typical result on a phone photo is 4-6 MB down to 200-400 KB,
around 90%, with no visible softening.

Recursion
---------
This function writes back to the same bucket it is triggered by. Objects here
live at the bucket root with UUID keys and usually no extension, so a prefix
filter on the trigger cannot separate input from output. Two guards instead:

  1. Every object this function writes carries the metadata marker
     `x-amz-meta-<MARKER_KEY>`. Anything arriving with it already set is
     skipped.
  2. Keys under THUMB_PREFIX are skipped outright.

Both are needed. The marker alone would still loop on thumbnails if the marker
write ever failed; the prefix alone does nothing for the in-place overwrite.

Deployment, the IAM policy, and the Pillow layer are in ../README.md.
"""

from __future__ import annotations

import io
import logging
import os
import urllib.parse

import boto3
from botocore.exceptions import ClientError
from PIL import Image, ImageOps

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")

# Long edge of the stored image, in pixels. 1600 covers a full-screen view on a
# 3x phone with room to spare; going to 2048 roughly doubles the bytes for
# detail no screen in the app ever shows.
MAX_EDGE = int(os.environ.get("MAX_EDGE", "1600"))

# Long edge of the thumbnail used by feed and list screens.
THUMB_EDGE = int(os.environ.get("THUMB_EDGE", "400"))

# See the module docstring: 82 is above the artifact threshold for faces.
QUALITY = int(os.environ.get("QUALITY", "82"))
THUMB_QUALITY = int(os.environ.get("THUMB_QUALITY", "78"))

# "JPEG" or "WEBP". WebP is about 25-30% smaller again at matched quality and
# every client here supports it (expo-image on both platforms, every current
# browser). It is not the default only because these objects are served by key
# with no extension, so switching format means the stored Content-Type is the
# single source of truth - worth doing deliberately, not by accident.
OUTPUT_FORMAT = os.environ.get("OUTPUT_FORMAT", "JPEG").upper()

THUMB_PREFIX = os.environ.get("THUMB_PREFIX", "thumbs/")

# Marker proving this function already handled an object. Stored without the
# "x-amz-meta-" prefix, which S3 adds and strips for us.
MARKER_KEY = "compressed"
MARKER_VALUE = "v1"

# Objects larger than this are left alone rather than risking an out-of-memory
# kill. Pillow needs roughly width x height x 4 bytes to decode, so a 50 MB
# upload can be several hundred MB decoded.
MAX_SOURCE_BYTES = int(os.environ.get("MAX_SOURCE_BYTES", str(40 * 1024 * 1024)))

# Below this, re-encoding usually costs more quality than it saves bytes.
MIN_SOURCE_BYTES = int(os.environ.get("MIN_SOURCE_BYTES", str(50 * 1024)))

CONTENT_TYPES = {"JPEG": "image/jpeg", "WEBP": "image/webp"}


def lambda_handler(event, context):
    """Entry point. One invocation may carry several S3 records."""
    results = []

    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        # S3 URL-encodes keys in event notifications; spaces arrive as '+'.
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])

        try:
            results.append(process_object(bucket, key))
        except Exception as exc:  # noqa: BLE001 - one bad object must not fail the batch
            # Logged and swallowed on purpose. Raising would make S3 retry the
            # whole notification, and a permanently undecodable object would
            # then retry forever. The original stays in place either way, so
            # the app keeps working with an uncompressed photo.
            logger.exception("Failed to process s3://%s/%s: %s", bucket, key, exc)
            results.append({"key": key, "status": "error", "reason": str(exc)})

    return {"processed": results}


def process_object(bucket: str, key: str) -> dict:
    """Compress one object in place and write its thumbnail."""
    if key.startswith(THUMB_PREFIX):
        return {"key": key, "status": "skipped", "reason": "is a thumbnail"}

    try:
        head = s3.head_object(Bucket=bucket, Key=key)
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey"):
            # Deleted between the notification and now. Nothing to do.
            return {"key": key, "status": "skipped", "reason": "gone"}
        raise

    if head.get("Metadata", {}).get(MARKER_KEY) == MARKER_VALUE:
        return {"key": key, "status": "skipped", "reason": "already compressed"}

    size = head["ContentLength"]
    if size > MAX_SOURCE_BYTES:
        logger.warning("s3://%s/%s is %d bytes - too large to decode safely", bucket, key, size)
        return {"key": key, "status": "skipped", "reason": "too large"}

    original = s3.get_object(Bucket=bucket, Key=key)["Body"].read()

    try:
        image = Image.open(io.BytesIO(original))
        image.load()
    except Exception:
        # Not an image, or a format Pillow cannot read. Uploads are supposed to
        # be photos, but nothing stops a client PUTting something else at a
        # presigned URL.
        return {"key": key, "status": "skipped", "reason": "not a decodable image"}

    full = encode(image, MAX_EDGE, QUALITY)
    thumb = encode(image, THUMB_EDGE, THUMB_QUALITY)

    content_type = CONTENT_TYPES[OUTPUT_FORMAT]

    # Only replace the original when the result is actually smaller. An image
    # that is already small and well-compressed can come out larger after a
    # round trip, and overwriting it would mean spending quality for nothing.
    if len(full) < size and size >= MIN_SOURCE_BYTES:
        put(bucket, key, full, content_type)
        status = "compressed"
    else:
        # Still mark it, so the next notification for this key does not decode
        # it all over again to reach the same conclusion.
        mark_only(bucket, key, head, content_type)
        status = "kept original"

    put(bucket, f"{THUMB_PREFIX}{key}", thumb, content_type)

    logger.info(
        "s3://%s/%s %s: %d -> %d bytes (%.0f%% saved), thumb %d bytes",
        bucket, key, status, size, len(full),
        100 * (1 - len(full) / size) if size else 0, len(thumb),
    )

    return {
        "key": key,
        "status": status,
        "original_bytes": size,
        "compressed_bytes": len(full),
        "thumbnail_bytes": len(thumb),
    }


def encode(image: Image.Image, max_edge: int, quality: int) -> bytes:
    """Resize to fit `max_edge` and encode once."""
    # Applies the EXIF orientation tag as real pixel rotation. Skipping this is
    # the classic bug where a portrait photo appears sideways after processing:
    # the tag is dropped along with the rest of the metadata below, so the
    # rotation has to be baked in first.
    work = ImageOps.exif_transpose(image)

    # Alpha and palette modes cannot be written as JPEG. Flatten onto white
    # rather than black - a transparent PNG avatar on black looks broken.
    if OUTPUT_FORMAT == "JPEG" and work.mode not in ("RGB", "L"):
        if work.mode in ("RGBA", "LA", "PA") or "transparency" in work.info:
            background = Image.new("RGB", work.size, (255, 255, 255))
            rgba = work.convert("RGBA")
            background.paste(rgba, mask=rgba.split()[-1])
            work = background
        else:
            work = work.convert("RGB")
    elif OUTPUT_FORMAT == "WEBP" and work.mode == "P":
        work = work.convert("RGBA")

    # thumbnail() is in-place, keeps aspect ratio, and never upscales - a photo
    # already smaller than max_edge is left at its own size instead of being
    # blown up into a blurry larger one.
    work = work.copy()
    work.thumbnail((max_edge, max_edge), Image.LANCZOS)

    buffer = io.BytesIO()
    if OUTPUT_FORMAT == "JPEG":
        work.save(
            buffer,
            format="JPEG",
            quality=quality,
            # Rebuilds the Huffman tables for this specific image. A few percent
            # smaller, costs only CPU, and is mathematically lossless.
            optimize=True,
            # Renders coarse-to-fine, so a photo on a slow connection appears
            # immediately instead of painting top to bottom.
            progressive=True,
            # 4:2:0 chroma subsampling. The eye resolves brightness far better
            # than colour, so halving colour resolution is close to invisible on
            # photographs while removing a meaningful chunk of the data.
            subsampling="4:2:0",
        )
    else:
        work.save(buffer, format="WEBP", quality=quality, method=6)

    # No exif= or icc_profile= argument, so both are dropped. Camera metadata is
    # commonly 40-80 KB and, for a matrimony profile, includes GPS coordinates
    # of where the photo was taken - worth removing for its own sake.
    return buffer.getvalue()


def put(bucket: str, key: str, body: bytes, content_type: str) -> None:
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=body,
        ContentType=content_type,
        Metadata={MARKER_KEY: MARKER_VALUE},
        # A year, because these keys are UUIDs and their contents never change
        # once written. This is what stops the app re-downloading a photo it
        # already has - see the caching notes in ../README.md.
        CacheControl="public, max-age=31536000, immutable",
    )


def mark_only(bucket: str, key: str, head: dict, content_type: str) -> None:
    """Set the marker without touching the bytes."""
    metadata = dict(head.get("Metadata", {}))
    metadata[MARKER_KEY] = MARKER_VALUE

    s3.copy_object(
        Bucket=bucket,
        Key=key,
        CopySource={"Bucket": bucket, "Key": key},
        Metadata=metadata,
        MetadataDirective="REPLACE",
        ContentType=head.get("ContentType", content_type),
        CacheControl="public, max-age=31536000, immutable",
    )
