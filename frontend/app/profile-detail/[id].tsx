import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileAPI, shortlistAPI, viewsAPI } from '../../utils/api';
import { useGuardedRouter } from '../../utils/useGuardedRouter';
import { useReference } from '../../utils/useReference';
import { useConnections, connectionAction } from '../../utils/useConnections';
import PhotoCarousel from '../../components/PhotoCarousel';
import DetailCard from '../../components/DetailCard';
import KundaliMatchCard from '../../components/KundaliMatchCard';
import { rowsFor } from '../../components/sectionRows';
import {
  colors,
  font,
  radius,
  spacing,
  profileName,
  profileCode,
  profileAge,
} from '../../components/theme';





/**
 * Someone else's profile.
 *
 * Uses the same PhotoCarousel and DetailCard components as your own profile, so
 * the two screens read identically - only the pencil is absent and a connect
 * footer is added.
 *
 * Contact details are deliberately gated on an accepted connection. Publishing
 * phone numbers to anyone who opens a profile is the single biggest privacy
 * failure a matrimony app can ship.
 */
export default function ProfileDetailScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Profiles store codes ("H_66", "VEG"); every row must render the label.
  const { label } = useReference();
  const { stateOf, connect, withdraw, accept } = useConnections();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shortlisted, setShortlisted] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = id === 'me' ? await profileAPI.getMe() : await profileAPI.getProfile(id);
      setProfile(res.data);

      if (id !== 'me') {
        // Best-effort: a failed view log must not break the screen.
        viewsAPI.addView({ profileId: id }).catch(() => {});
      }
    } catch (error: any) {
      console.log('Failed to load profile:', error?.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleShortlist = async () => {
    if (!id) return;
    const was = shortlisted;
    setShortlisted(!was);
    try {
      if (was) await shortlistAPI.remove(id);
      else await shortlistAPI.add(id);
    } catch (error: any) {
      setShortlisted(was);
      Alert.alert('Error', error?.response?.data?.detail || 'Failed to update shortlist');
    }
  };

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const photos: string[] = profile.profileImages?.length
    ? profile.profileImages
    : profile.profileImage
      ? [profile.profileImage]
      : [];

  const isMine = id === 'me';
  const state = stateOf(id);
  const action = connectionAction(state);
  const connected = state === 'CONNECTED';
  const age = profileAge(profile);

  const onAction = () => {
    if (!id) return;
    if (state === 'SENT') withdraw(id);
    else if (state === 'RECEIVED') accept(id);
    else if (state !== 'CONNECTED') connect(id);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <PhotoCarousel
            photos={photos}
            name={profileName(profile)}
            age={age}
            code={profileCode(profile)}
          />

          <TouchableOpacity
            style={[styles.back, { top: insets.top + spacing.sm }]}
            onPress={() => router.back()}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>

        </View>

        <View style={styles.body}>
          <DetailCard
            title="Basic Details"
            subtitle="Brief outline of personal information"
rows={rowsFor('basic', profile, label)}
          />

          <DetailCard
            title="About Me"
            subtitle="In their own words"
            body={profile.aboutMyself}
          />

          <DetailCard
            title="Education & Career"
            subtitle="What they studied and what they do"
rows={rowsFor('education', profile, label)}
          />

          <DetailCard
            title="Religion & Astro"
            subtitle="Details families often look for"
rows={rowsFor('religion', profile, label)}
          />

          <DetailCard
            title="Family"
            subtitle="Their family background"
rows={rowsFor('family', profile, label)}
          />

          {/* Contact is only meaningful once both sides have agreed. */}
          {connected || isMine ? (
            <DetailCard
              title="Contact"
              subtitle="Shared because you are connected"
rows={rowsFor('contact', profile, label)}
            />
          ) : (
            <View style={styles.locked}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.fieldLabel} />
              <Text style={styles.lockedText}>
                Contact details are shared once your connection request is accepted
              </Text>
            </View>
          )}

          {/* Last, below every detail card, because it is the thing families
              reach for after reading the rest - and because it costs a Lambda
              round trip, so it stays a button until asked for. Not shown on
              your own profile: matching yourself is meaningless, and the
              backend refuses it anyway. */}
          {!isMine && !!id && <KundaliMatchCard profileId={id} name={profileName(profile)} />}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {!isMine && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity
            style={styles.shortlistBtn}
            activeOpacity={0.8}
            onPress={toggleShortlist}
          >
            <Ionicons
              name={shortlisted ? 'star' : 'star-outline'}
              size={22}
              color={shortlisted ? colors.star : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, action.variant === 'muted' && styles.actionMuted]}
            activeOpacity={0.85}
            onPress={onAction}
            disabled={action.disabled}
          >
            <Text
              style={[styles.actionText, action.variant === 'muted' && styles.actionTextMuted]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

  back: {
    position: 'absolute',
    left: spacing.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { padding: spacing.md, marginTop: -spacing.sm },

  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: 14,
    padding: spacing.lg,
  },
  lockedText: { flex: 1, fontSize: font.body, color: colors.textMuted, lineHeight: 19 },

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
  shortlistBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.accentAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMuted: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
  actionTextMuted: { color: colors.text },
});
