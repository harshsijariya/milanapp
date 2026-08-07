import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileAPI, likeAPI } from '../../utils/api';
import { useGuardedRouter } from '../../utils/useGuardedRouter';
import { usePhotoUpload } from '../../utils/usePhotoUpload';
import PhotoCropper from '../../components/PhotoCropper';
import { unregisterPush } from '../../utils/notifications';
import ConfirmSheet from '../../components/ConfirmSheet';
import CompletionRing, { ringLabel } from '../../components/CompletionRing';
import DetailCard from '../../components/DetailCard';
import { rowsFor } from '../../components/sectionRows';
import PhotoCarousel from '../../components/PhotoCarousel';
import { useReference } from '../../utils/useReference';
import {
  colors,
  font,
  radius,
  spacing,
  profileCode,
  profileName,
  photoHeight,
} from '../../components/theme';

const { width } = Dimensions.get('window');
// Derived from PHOTO_ASPECT so the header never re-crops what the user framed.
const HEADER_H = photoHeight(width);






export default function ProfileScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  // Profiles store codes ("VEG"); the cards show labels ("Vegetarian").
  const { label } = useReference();

  const [user, setUser] = useState<any>(null);
  const [sentCount, setSentCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [connectedCount, setConnectedCount] = useState(0);

  const photos: string[] = user?.profileImages?.length
    ? user.profileImages
    : user?.profileImage
      ? [user.profileImage]
      : [];

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [meRes, sentRes, receivedRes] = await Promise.all([
        profileAPI.getMe(),
        likeAPI.getSentLikes(),
        likeAPI.getReceivedLikes(),
      ]);
      setUser(meRes.data);

      const sent = sentRes.data || [];
      const received = receivedRes.data || [];
      setSentCount(sent.length);
      setReceivedCount(received.length);

      const isAccepted = (l: any) => (l.status || '').toLowerCase() === 'accepted';
      setConnectedCount(sent.filter(isAccepted).length + received.filter(isAccepted).length);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const { pick, uploading, cropperProps } = usePhotoUpload({
    count: photos.length,
    onUploaded: loadData,
  });

  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const doLogout = async () => {
    setConfirmingLogout(false);
    // Detach this device first, otherwise the next account to sign in here
    // keeps receiving the previous user's notifications.
    await unregisterPush();
    await AsyncStorage.clear();
    router.replace('/');
  };

  const completion = Number(user?.profileCompletion ?? 0);
  const openSection = (key: string) => router.push(`/edit-profile?section=${key}`);

  if (!user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {/* Same carousel as the public profile, so both screens behave alike
            when there is more than one photo. */}
        <PhotoCarousel
          photos={photos}
          height={HEADER_H}
          name={profileName(user)}
          code={profileCode(user)}
        />


        <View style={[styles.headerTop, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.headerBadges}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={pick}
              disabled={uploading}
              accessibilityLabel="Add photo"
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="camera-outline" size={18} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>

      </View>

      <View style={styles.body}>
        <View style={styles.completionCard}>
          <View style={styles.completionTop}>
            <CompletionRing percent={completion} size={58} />
            <View style={styles.completionText}>
              <Text style={styles.completionTitle}>{ringLabel(completion)}</Text>
              <Text style={styles.completionHint}>
                Add a few more details to make your profile rich
              </Text>
            </View>
          </View>

          {/* Goes to the full guided flow, not a single section - the point of
              this card is finishing everything that is missing. */}
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/profile-setup')}
          >
            <Text style={styles.primaryBtnText}>Complete your profile</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          <Stat label="Sent" value={sentCount} onPress={() => router.push('/(tabs)/likes')} />
          <View style={styles.statDivider} />
          <Stat label="Received" value={receivedCount} onPress={() => router.push('/(tabs)/likes')} />
          <View style={styles.statDivider} />
          <Stat label="Connected" value={connectedCount} />
        </View>

        <DetailCard
          title="Basic Details"
          subtitle="Brief outline of personal information"
          onEdit={() => openSection('basic')}
rows={rowsFor('basic', user, label)}
        />

        <DetailCard
          title="About Me"
          subtitle="Describe yourself in a few words"
          body={user.aboutMyself}
          onEdit={() => openSection('family')}
          emptyHint="Profiles with a short intro get noticeably more responses"
        />

        <DetailCard
          title="Education & Career"
          subtitle="What you studied and what you do"
          onEdit={() => openSection('education')}
rows={rowsFor('education', user, label)}
        />

        <DetailCard
          title="Religion & Astro"
          subtitle="Details families often look for"
          onEdit={() => openSection('religion')}
rows={rowsFor('religion', user, label)}
        />

        <DetailCard
          title="Family"
          subtitle="Your family background"
          onEdit={() => openSection('family')}
rows={rowsFor('family', user, label)}
        />

        <DetailCard
          title="Contact"
          subtitle="Only shared with profiles you connect with"
          onEdit={() => openSection('contact')}
rows={rowsFor('contact', user, label)}
        />

        <TouchableOpacity
          style={styles.logout}
          onPress={() => setConfirmingLogout(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </View>

      <ConfirmSheet
        visible={confirmingLogout}
        title="Are you sure you want to Sign out?"
        confirmLabel="Yes"
        cancelLabel="No"
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={doLogout}
      />

      <PhotoCropper {...cropperProps} />
    </ScrollView>
  );
}

function Stat({ label, value, onPress }: { label: string; value: number; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.stat} activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

  header: { height: HEADER_H, backgroundColor: colors.surface },
  headerTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  headerBadges: { flexDirection: 'row', gap: spacing.sm },
  circleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
  },

  body: { padding: spacing.md, gap: spacing.md, marginTop: -spacing.sm },

  completionCard: {
    backgroundColor: colors.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentSoft,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  completionTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  completionText: { flex: 1, gap: 3 },
  completionTitle: { fontSize: font.title, fontWeight: '600', color: colors.heading },
  completionHint: { fontSize: font.body, color: colors.textMuted, lineHeight: 18 },

  // Same treatment as the Save button on the edit sheets: flat crimson, small
  // radius. One primary action style across the app rather than a gradient pill
  // here and a flat button there.
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.accentAlt,
  },
  primaryBtnText: { color: colors.white, fontSize: font.title, fontWeight: 'bold' },

  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: font.small, color: colors.textMuted },
  statDivider: { width: 1, height: 28, backgroundColor: colors.hairline },



  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.bg,
    marginTop: spacing.sm,
  },
  logoutText: { color: colors.danger, fontSize: font.title, fontWeight: '600' },
});
