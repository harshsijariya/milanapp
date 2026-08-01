/**
 * Shared design tokens.
 *
 * The layout language is Instagram's - story rail, feed cards, flat rows with a
 * trailing action button - but on a light surface with the app's existing pink
 * accent instead of Instagram's blue, so these screens sit next to the
 * login/register screens without a jarring switch.
 */

export const colors = {
  // Surfaces
  bg: '#FFFFFF',
  surface: '#FAFAFA',
  elevated: '#FFFFFF',

  // Text
  text: '#262626',
  textMuted: '#8E8E8E',
  textFaint: '#C7C7C7',

  // Editor typography. The edit sheets use a slate heading and a cooler grey
  // for field labels than the feed does - matching the reference screens, where
  // form chrome reads as quieter than content.
  heading: '#2E3E4E',
  fieldLabel: '#7A8794',
  fieldValue: '#1F2933',

  // Lines
  border: '#DBDBDB',
  hairline: '#EFEFEF',

  // Accent - the pink used on the auth screens' primary buttons.
  accent: '#EC4899',
  accentAlt: '#F43F5E',
  accentSoft: '#FCE7F0',

  // Secondary action colour, used where Instagram uses blue.
  link: '#0095F6',

  // Status
  online: '#22C55E',
  star: '#F59E0B',
  danger: '#ED4956',
  white: '#FFFFFF',
} as const;

/** Story-ring sweep. Instagram runs warm; this leans into the app's pink. */
export const storyRing = ['#F59E0B', '#EC4899', '#8B5CF6'] as const;

/** Primary button sweep - identical to login/register so buttons match. */
export const accentGradient = ['#EC4899', '#F43F5E'] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 16,
  pill: 24,
} as const;

export const font = {
  caption: 11,
  small: 12,
  body: 13,
  label: 14,
  title: 15,
  heading: 18,
} as const;

/**
 * Profile records come back from several endpoints with slightly different
 * shapes (`/users` returns the profile flat, `/views` nests it under `profile`,
 * and image fields have been spelled both ways). These readers keep that mess
 * in one place instead of spread across every screen.
 */
export type Profile = Record<string, any>;

export const unwrapProfile = (item: Profile): Profile =>
  item?.profile ?? item?.user ?? item ?? {};

export const profileId = (item: Profile): string | number | undefined => {
  const p = unwrapProfile(item);
  return p.id ?? p.profileId ?? item?.id;
};

export const profileName = (item: Profile): string => {
  const p = unwrapProfile(item);
  return p.name || p.fullName || 'Anonymous';
};

/**
 * Display code shown under the name, e.g. GSJM00147.
 *
 * The API already returns ids in JM format ("JM00147") - UserProfileMapper runs
 * every id through CommonUtils.convertToJMFormat - and the UI prefixes "GS".
 * Padding again here would produce "GSJMJM00147", so only bare numeric ids get
 * formatted.
 */
export const profileCode = (item: Profile): string => {
  const p = unwrapProfile(item);
  if (p.code) return String(p.code);

  const id = profileId(item);
  if (id == null) return '';

  const raw = String(id);
  return raw.startsWith('JM') ? `GS${raw}` : `GSJM${raw.padStart(5, '0')}`;
};

export const profileImage = (item: Profile): string | null => {
  const p = unwrapProfile(item);
  return (
    p.profileImage ||
    p.profile_image ||
    p.imageUrl ||
    (Array.isArray(p.profileImages) ? p.profileImages[0] : null) ||
    null
  );
};

/**
 * Resolves a stored code to its display label.
 *
 * Pass the `label` function from useReference. Without it the raw value is
 * returned, which is why list rows showed "H_66" and "SOFTWARE_ENGINEER" -
 * profiles store codes, and only screens that looked the code up rendered
 * anything readable.
 */
export type LabelFn = (category: string, code?: string | null) => string;

const resolve = (label: LabelFn | undefined, category: string, value?: string | null): string => {
  if (!value) return '';
  return label ? label(category, value) || String(value) : String(value);
};

/** "Software Engineer · 5' 6" (168 cm)" - skipping anything missing. */
export const profileSubtitle = (item: Profile, label?: LabelFn): string => {
  const p = unwrapProfile(item);
  return [
    resolve(label, 'profession', p.profession),
    resolve(label, 'height', p.height),
  ]
    .filter(Boolean)
    .join(' · ');
};

export const profileLocation = (item: Profile): string => {
  const p = unwrapProfile(item);
  const parts = [p.city, p.state].filter(Boolean);
  return parts.length ? parts.join(', ') : '';
};

/** Years from date of birth, or null when it is missing or unparseable. */
export const profileAge = (item: Profile): number | null => {
  const p = unwrapProfile(item);
  const raw = p.dateOfBirth ?? p.dob;
  if (!raw) return null;

  const dob = new Date(raw);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  // Birthday not reached this year yet.
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;

  return age > 0 && age < 120 ? age : null;
};

/**
 * The summary lines shown on a feed card: profession, employer, education and
 * earnings, with codes resolved and anything missing dropped.
 *
 * Returned as an array rather than one joined string so the card can wrap onto
 * separate lines the way a matrimony listing reads, instead of one long run-on.
 */
export const profileHighlights = (item: Profile, label?: LabelFn): string[] => {
  const p = unwrapProfile(item);

  const work = [
    resolve(label, 'employed_in', p.employedIn),
    resolve(label, 'profession', p.profession),
  ]
    .filter(Boolean)
    .join(' - ');

  const company = p.organization || p.workCity || '';
  const earning = resolve(label, 'annual_income', p.annualIncome);
  const education = resolve(label, 'education', p.education);

  return [
    [work, company].filter(Boolean).join(' · '),
    [education, earning && `Earns ${earning}`].filter(Boolean).join(' · '),
  ].filter(Boolean);
};

/** "R B, 29 · 5' 6" · Chandigarh" style identity line. */
export const profileHeadline = (item: Profile, label?: LabelFn): string => {
  const p = unwrapProfile(item);
  const age = profileAge(item);

  return [
    age ? `${age} yrs` : '',
    resolve(label, 'height', p.height),
    profileLocation(item),
  ]
    .filter(Boolean)
    .join(' · ');
};

/** Relative time for "viewed 2h ago" style labels. */
export const timeAgo = (value?: string | number | Date): string => {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
};

/**
 * The one shape a profile photo is ever displayed at.
 *
 * Photos used to be cropped to 3:4 at upload but shown in a near-square header
 * (width x 1.05). `cover` then rescaled the tall image to fill the wider box and
 * trimmed the overflow off the top and bottom - roughly 130px on a normal phone,
 * taken from exactly where a face sits. People cropped their photo carefully and
 * still lost their forehead and chin.
 *
 * Every surface that renders a photo - crop frame, profile header, swipe card,
 * carousel - now derives its height from this, so what the user frames while
 * cropping is what everyone else sees. Changing this number moves all of them
 * together; hardcoding a height anywhere else reintroduces the bug.
 */
export const PHOTO_ASPECT = 3 / 4;

/** Display height for a photo of the given width. */
export const photoHeight = (width: number): number => Math.round(width / PHOTO_ASPECT);
