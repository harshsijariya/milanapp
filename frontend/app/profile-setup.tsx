import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileAPI } from '../utils/api';
import { useGuardedRouter } from '../utils/useGuardedRouter';
import { usePhotoUpload, MAX_PHOTOS } from '../utils/usePhotoUpload';
import PhotoCropper from '../components/PhotoCropper';
import SectionForm from '../components/SectionForm';
import { SECTIONS, SECTION_ORDER, buildPayload } from '../components/sectionSchema';
import { colors, font, radius, spacing, photoHeight } from '../components/theme';

/** Server returns either a list or a single image, depending on the endpoint. */
const readPhotos = (data: any): string[] =>
  data?.profileImages?.length ? data.profileImages : data?.profileImage ? [data.profileImage] : [];

/** Five schema-driven steps, then photos. */
const STEPS = [...SECTION_ORDER, 'photos'] as const;

/** Thumbnails share the photo shape, so the grid previews the real crop. */
const THUMB_W = 104;
const THUMB_H = photoHeight(THUMB_W);

/**
 * Guided "complete your profile" flow.
 *
 * Every field and option list comes from sectionSchema and /reference/options -
 * the same source the edit sheets use. This screen previously carried its own
 * copies of the height, rashi, nakshatra, education, income, state and city
 * arrays, so adding a city to the database did not add it here, and the two
 * screens could disagree about what a valid value even was.
 *
 * Each step saves as you advance rather than everything at the end, so someone
 * who abandons halfway keeps what they filled in, and the completion score
 * climbs as they go.
 */
export default function ProfileSetupScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, Record<string, any>>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refreshPhotos = useCallback(async () => {
    const me = await profileAPI.getMe();
    setPhotos(readPhotos(me.data));
  }, []);

  const { pick, uploading, cropperProps } = usePhotoUpload({
    count: photos.length,
    onUploaded: refreshPhotos,
  });


  const current = STEPS[step];
  const isPhotoStep = current === 'photos';
  const spec = isPhotoStep ? null : SECTIONS[current];

  // Load every section up front. Six small requests once beats a spinner
  // between each step of a flow the user is trying to get through.
  useEffect(() => {
    let alive = true;

    Promise.all(
      SECTION_ORDER.map((key) =>
        profileAPI[SECTIONS[key].get]()
          .then((res) => [key, res.data ?? {}] as const)
          .catch(() => [key, {}] as const)
      )
    )
      .then((entries) => alive && setValues(Object.fromEntries(entries)))
      .finally(() => alive && setLoading(false));

    profileAPI
      .getMe()
      .then((res) => alive && setPhotos(readPhotos(res.data)))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  const set = useCallback(
    (key: string, value: any) => {
      if (!spec) return;
      setValues((prev) => ({
        ...prev,
        [spec.key]: { ...(prev[spec.key] ?? {}), [key]: value },
      }));
    },
    [spec]
  );

  /** Persist the current section, then move on. */
  const next = async () => {
    if (spec) {
      setSaving(true);
      try {
        await profileAPI[spec.patch](buildPayload(spec, values[spec.key] ?? {}));
      } catch (error: any) {
        Alert.alert(
          'Could not save',
          error?.response?.data?.message || error?.response?.data?.detail || 'Please try again'
        );
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    if (step < STEPS.length - 1) setStep(step + 1);
    else router.back();
  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          hitSlop={12}
          onPress={() => (step > 0 ? setStep(step - 1) : router.back())}
          accessibilityLabel={step > 0 ? 'Back' : 'Close'}
        >
          <Ionicons name={step > 0 ? 'arrow-back' : 'close'} size={26} color={colors.heading} />
        </TouchableOpacity>
        <Text style={styles.stepCount}>
          Step {step + 1} of {STEPS.length}
        </Text>
      </View>

      {/* A filling bar reads as tangible movement; a bare counter does not. */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{spec ? spec.title : 'Your photos'}</Text>
        <Text style={styles.subtitle}>
          {spec ? spec.subtitle : 'Profiles with a photo get far more responses'}
        </Text>

        {spec ? (
          <SectionForm spec={spec} values={values[spec.key] ?? {}} onChange={set} />
        ) : (
          <View style={styles.photoGrid}>
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.photo} contentFit="cover" />
            ))}
            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity
                style={styles.addPhoto}
                onPress={pick}
                disabled={uploading}
                activeOpacity={0.7}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.accent} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={26} color={colors.accent} />
                    <Text style={styles.addPhotoText}>Add photo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Back sits beside Save rather than replacing it: the thumb is already
          down here, so stepping back costs one tap instead of a reach to the
          top-left corner. Icon-only and outlined, so it never competes with
          the primary action. */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.back}
            activeOpacity={0.7}
            onPress={() => setStep(step - 1)}
            disabled={saving}
            accessibilityLabel="Previous step"
          >
            <Ionicons name="arrow-back" size={22} color={colors.heading} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.save, saving && styles.saveDisabled]}
          activeOpacity={0.85}
          onPress={next}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveText}>
              {step === STEPS.length - 1 ? 'Done' : 'Save & continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <PhotoCropper {...cropperProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  stepCount: { fontSize: font.body, color: colors.fieldLabel, fontWeight: '600' },
  track: {
    height: 3,
    backgroundColor: colors.hairline,
    marginHorizontal: spacing.lg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: { height: 3, backgroundColor: colors.accentAlt },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.heading, marginBottom: 4 },
  subtitle: { fontSize: font.label, color: colors.fieldLabel, marginBottom: spacing.sm },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  photo: { width: THUMB_W, height: THUMB_H, borderRadius: 10, backgroundColor: colors.surface },
  addPhoto: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPhotoText: { fontSize: font.small, color: colors.accent, fontWeight: '600' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  back: {
    width: 54,
    height: 54,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  save: {
    flex: 1,
    height: 54,
    borderRadius: radius.sm,
    backgroundColor: colors.accentAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
});
