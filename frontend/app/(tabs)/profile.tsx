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
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileAPI, likeAPI } from '../../utils/api';
import { useGuardedRouter } from '../../utils/useGuardedRouter';
import AppDrawer from '../../components/AppDrawer';
import KundaliCard from '../../components/KundaliCard';
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

  const [menuOpen, setMenuOpen] = useState(false);

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
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu" size={20} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.headerBadges}>
            {/* Goes to the photo screen rather than straight to the picker.
                Adding was the only thing this button could do - there was no
                way to remove a photo or choose which one people see first. */}
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => router.push('/manage-photos')}
              accessibilityLabel="Manage photos"
            >
              <Ionicons name="camera-outline" size={18} color={colors.white} />
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

        {/* Below the detail cards, because it is derived from what is in them -
            specifically the birth date, time and place on the Religion & Astro
            card. Generated on demand rather than with the rest of the profile:
            it costs a Lambda round trip that can cold-start, and most visits
            here are not about the chart. */}
        <KundaliCard />

        {/* Hiding, deleting and logging out all moved to Account & Settings,
            reachable from the menu at the top. They were never part of the
            profile itself, and having a delete button at the end of a scroll
            you take to edit your details is a mis-tap waiting to happen. */}
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => router.push('/account-settings')}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-outline" size={18} color={colors.text} />
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Account &amp; Settings</Text>
            <Text style={styles.settingSubtitle}>
              Visibility, deleting your account, and support
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </View>

      <AppDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        name={user?.name}
        memberId={user?.id}
        avatarUrl={photos?.[0] ?? null}
        items={[
          { icon: 'images-outline', label: 'Photos', onPress: () => router.push('/manage-photos') },
          { icon: 'create-outline', label: 'Edit Profile', onPress: () => router.push('/edit-profile') },
          { icon: 'settings-outline', label: 'Account & Settings', onPress: () => router.push('/account-settings') },
          { icon: 'headset-outline', label: 'Help & Support', onPress: () => router.push('/help-support') },
        ]}
      />

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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.bg,
    marginTop: spacing.sm,
  },
  settingCopy: { flex: 1 },
  settingTitle: { color: colors.text, fontSize: font.title, fontWeight: '600' },
  settingSubtitle: { color: colors.textFaint, fontSize: font.small, marginTop: 2 },
  // No fill and no icon: delete should not look like a button you tap by
  // reflex on the way to logging out.
  deleteRow: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: spacing.xs,
  },
  deleteText: { color: colors.textFaint, fontSize: font.small, fontWeight: '600' },
});
