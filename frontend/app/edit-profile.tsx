import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileAPI } from '../utils/api';
import { useGuardedRouter } from '../utils/useGuardedRouter';
import SectionForm from '../components/SectionForm';
import { SECTIONS, buildPayload } from '../components/sectionSchema';
import { colors, font, radius, spacing } from '../components/theme';

/**
 * Edits one profile section, chosen by ?section=.
 *
 * Field rendering lives in SectionForm, shared with the guided setup flow, so
 * the two screens cannot drift apart.
 */
export default function EditProfileScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { section } = useLocalSearchParams<{ section?: string }>();

  const spec = SECTIONS[section ?? 'basic'] ?? SECTIONS.basic;

  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    profileAPI[spec.get]()
      .then((res) => alive && setValues(res.data ?? {}))
      .catch((e: any) => console.log(`Failed to load ${spec.key}:`, e?.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [spec]);

  const set = useCallback((key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await profileAPI[spec.patch](buildPayload(spec, values));
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Could not save',
        error?.response?.data?.message || error?.response?.data?.detail || 'Please try again'
      );
    } finally {
      setSaving(false);
    }
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
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} accessibilityLabel="Close">
          <Ionicons name="close" size={26} color={colors.heading} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{spec.title}</Text>
        <Text style={styles.subtitle}>{spec.subtitle}</Text>

        <SectionForm spec={spec} values={values} onChange={set} />

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={[styles.save, saving && styles.saveDisabled]}
          activeOpacity={0.85}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.heading, marginBottom: 4 },
  subtitle: { fontSize: font.label, color: colors.fieldLabel, marginBottom: spacing.sm },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  save: {
    height: 54,
    borderRadius: radius.sm,
    backgroundColor: colors.accentAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
});
