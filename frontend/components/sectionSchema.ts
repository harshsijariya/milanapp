/**
 * Declarative description of the five editable profile sections.
 *
 * The edit screen renders from this rather than hand-writing five near-identical
 * forms. Adding a field is one entry here; nothing else changes.
 *
 * `key` matches the DTO property the backend expects, so the payload is built by
 * picking these keys straight off the form state.
 * `lookup` names a category in the lookup_option table - the picker is fed from
 * /reference/options, never a hardcoded array.
 */

export type FieldKind =
  | 'select'
  | 'multiselect'
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  /** Clock wheel. Stored as "HH:mm:ss" to match the MySQL TIME column. */
  | 'time'
  | 'chips';

export type FieldSpec = {
  key: string;
  label: string;
  kind: FieldKind;
  /** lookup_option category, for select/multiselect/chips. */
  lookup?: string;
  placeholder?: string;
  /** Show the first N options as tappable chips under the field. */
  suggest?: number;
  keyboard?: 'default' | 'numeric' | 'phone-pad';
};

export type SectionSpec = {
  key: string;
  title: string;
  subtitle: string;
  /** profileAPI method names for load and save. */
  get: 'getBasicInfo' | 'getContactInfo' | 'getEducationInfo' | 'getReligionInfo' | 'getFamilyInfo';
  patch:
    | 'updateBasicInfo'
    | 'updateContactInfo'
    | 'updateEducationInfo'
    | 'updateReligionInfo'
    | 'updateFamilyInfo';
  fields: FieldSpec[];
};

export const SECTIONS: Record<string, SectionSpec> = {
  basic: {
    key: 'basic',
    title: 'Basic details',
    subtitle: 'Update these details to get suitable matches',
    get: 'getBasicInfo',
    patch: 'updateBasicInfo',
    fields: [
      { key: 'name', label: 'Full name', kind: 'text', placeholder: 'Your name' },
      { key: 'gender', label: 'Gender', kind: 'chips', lookup: 'gender' },
      { key: 'dateOfBirth', label: 'Date of birth', kind: 'date' },
      { key: 'height', label: 'Height', kind: 'select', lookup: 'height' },
      { key: 'weight', label: 'Weight (kg)', kind: 'number', keyboard: 'numeric' },
      { key: 'maritalStatus', label: 'Marital status', kind: 'chips', lookup: 'marital_status' },
      { key: 'profileCreatedBy', label: 'Profile created by', kind: 'chips', lookup: 'profile_created_by' },
      { key: 'complexion', label: 'Complexion', kind: 'select', lookup: 'complexion' },
      { key: 'diet', label: 'Diet', kind: 'chips', lookup: 'diet' },
      { key: 'bloodGroup', label: 'Blood group', kind: 'select', lookup: 'blood_group' },
      { key: 'disability', label: 'Disability', kind: 'chips', lookup: 'disability' },
    ],
  },

  contact: {
    key: 'contact',
    title: 'Contact details',
    subtitle: 'Only shared with profiles you connect with',
    get: 'getContactInfo',
    patch: 'updateContactInfo',
    fields: [
      { key: 'mobileNo', label: 'Mobile number', kind: 'text', keyboard: 'phone-pad', placeholder: '10-digit number' },
      { key: 'whatsappNo', label: 'WhatsApp number', kind: 'text', keyboard: 'phone-pad' },
      // state/city are special-cased in the screen: city options depend on state.
      { key: 'state', label: 'State', kind: 'select' },
      { key: 'city', label: 'City', kind: 'select', suggest: 5 },
      { key: 'country', label: 'Country', kind: 'text', placeholder: 'India' },
      { key: 'presentAddress', label: 'Present address', kind: 'textarea' },
      { key: 'permanentAddress', label: 'Permanent address', kind: 'textarea' },
    ],
  },

  education: {
    key: 'education',
    title: "Education & occupation",
    subtitle: 'Update these details to get suitable matches',
    get: 'getEducationInfo',
    patch: 'updateEducationInfo',
    fields: [
      { key: 'education', label: 'Highest degree', kind: 'select', lookup: 'education', suggest: 5 },
      { key: 'educationDetails', label: 'College / university', kind: 'text' },
      { key: 'profession', label: 'Profession', kind: 'select', lookup: 'profession', suggest: 5 },
      { key: 'occupationDetails', label: 'Role details', kind: 'text' },
      { key: 'employedIn', label: 'Employed in', kind: 'chips', lookup: 'employed_in' },
      { key: 'organization', label: 'Organisation', kind: 'text' },
      { key: 'workCity', label: 'Work city', kind: 'text' },
      { key: 'annualIncome', label: 'Annual income', kind: 'select', lookup: 'annual_income' },
    ],
  },

  religion: {
    key: 'religion',
    title: 'Religion & astro',
    subtitle: 'Helps families match horoscopes',
    get: 'getReligionInfo',
    patch: 'updateReligionInfo',
    fields: [
      { key: 'gotra', label: 'Gotra', kind: 'text' },
      { key: 'aakna', label: 'Aakna', kind: 'text' },
      { key: 'motherTongue', label: 'Mother tongue', kind: 'select', lookup: 'mother_tongue' },
      { key: 'zodiac', label: 'Rashi', kind: 'select', lookup: 'rashi' },
      { key: 'nakshatra', label: 'Nakshatra', kind: 'select', lookup: 'nakshatra' },
      { key: 'manglik', label: 'Manglik', kind: 'chips', lookup: 'manglik' },
      { key: 'timeOfBirth', label: 'Time of birth', kind: 'time', placeholder: 'Select time' },
      { key: 'placeOfBirth', label: 'Place of birth', kind: 'text' },
    ],
  },

  family: {
    key: 'family',
    title: 'Family details',
    subtitle: 'Update these details to get suitable matches',
    get: 'getFamilyInfo',
    patch: 'updateFamilyInfo',
    fields: [
      { key: 'fathersName', label: "Father's name", kind: 'text' },
      { key: 'fathersOccupation', label: "Father's occupation", kind: 'select', lookup: 'profession' },
      { key: 'fathersContactNo', label: "Father's contact", kind: 'text', keyboard: 'phone-pad' },
      { key: 'mothersName', label: "Mother's name", kind: 'text' },
      { key: 'mothersOccupation', label: "Mother's occupation", kind: 'select', lookup: 'profession' },
      { key: 'marriedBrothers', label: 'Married brothers', kind: 'number', keyboard: 'numeric' },
      { key: 'unmarriedBrothers', label: 'Unmarried brothers', kind: 'number', keyboard: 'numeric' },
      { key: 'marriedSisters', label: 'Married sisters', kind: 'number', keyboard: 'numeric' },
      { key: 'unmarriedSisters', label: 'Unmarried sisters', kind: 'number', keyboard: 'numeric' },
      { key: 'maternalUnclesName', label: "Maternal uncle's name", kind: 'text' },
      { key: 'maternalUnclesAakna', label: "Maternal uncle's aakna", kind: 'text' },
      { key: 'houseStatus', label: 'House', kind: 'chips', lookup: 'house_status' },
      { key: 'carStatus', label: 'Car', kind: 'chips', lookup: 'car_status' },
      { key: 'aboutMyself', label: 'About me', kind: 'textarea', placeholder: 'A few lines about yourself' },
      { key: 'partnerPreferences', label: 'Partner preferences', kind: 'textarea' },
    ],
  },
};

export const SECTION_ORDER = ['basic', 'contact', 'education', 'religion', 'family'] as const;

/**
 * Builds the PATCH body for a section.
 *
 * Only that section's keys are sent. Posting the whole form state would either
 * be rejected or, worse, silently overwrite fields the user never opened -
 * the split endpoints exist precisely so each save is narrow.
 *
 * Numbers are coerced because TextInput always hands back a string, and an
 * empty one has to become null rather than 0.
 */
export function buildPayload(spec: SectionSpec, values: Record<string, any>) {
  const payload: Record<string, any> = {};

  for (const field of spec.fields) {
    const value = values[field.key];
    if (value === undefined) continue;

    if (field.kind === 'number') {
      payload[field.key] = value === '' || value === null ? null : Number(value);
    } else {
      payload[field.key] = value;
    }
  }

  return payload;
}
