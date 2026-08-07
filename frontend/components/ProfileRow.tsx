import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useReference } from '../utils/useReference';
import {
  colors,
  font,
  radius,
  spacing,
  storyRing,
  profileName,
  profileCode,
  profileImage,
  profileSubtitle,
  type Profile,
} from './theme';

export type RowAction = {
  label: string;
  /** filled = crimson (primary), muted = grey chip, outline = bordered */
  variant?: 'filled' | 'muted' | 'outline';
  onPress?: () => void;
  disabled?: boolean;
};

type Props = {
  profile: Profile;
  action?: RowAction;
  /** Trailing X. Omit to hide it. */
  onDismiss?: () => void;
  dismissLabel?: string;
  /** Replaces the profession/height line when set, e.g. "Viewed 2h ago". */
  meta?: string;
  ringed?: boolean;
  onPress?: () => void;
};

const AVATAR = 56;

/**
 * The follower-list row from Instagram: ringed avatar, name over a muted
 * secondary line, a trailing action button and a dismiss X.
 *
 * Shared by likes, shortlist and recent visitors so the three list screens
 * cannot drift apart.
 */
export default function ProfileRow({
  profile,
  action,
  onDismiss,
  dismissLabel = 'Remove',
  meta,
  ringed = true,
  onPress,
}: Props) {
  // Profiles store codes; the secondary line must show labels.
  const { label } = useReference();

  const uri = profileImage(profile);
  const secondary = meta || profileSubtitle(profile, label) || profileCode(profile);

  const avatar = uri ? (
    <Image source={{ uri }} style={styles.avatar} />
  ) : (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Ionicons name="person" size={24} color={colors.textFaint} />
    </View>
  );

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={onPress}>
      {ringed ? (
        <LinearGradient
          colors={storyRing}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.ring}
        >
          <View style={styles.ringInner}>{avatar}</View>
        </LinearGradient>
      ) : (
        <View style={styles.plain}>{avatar}</View>
      )}

      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {profileName(profile)}
        </Text>
        {!!secondary && (
          <Text style={styles.secondary} numberOfLines={1}>
            {secondary}
          </Text>
        )}
      </View>

      {!!action && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={action.onPress}
          disabled={action.disabled}
          style={action.disabled ? styles.dimmed : undefined}
        >
          {action.variant === 'filled' ? (
            <View style={[styles.btn, styles.btnFilled]}>
              <Text style={styles.btnFilledText}>{action.label}</Text>
            </View>
          ) : (
            <View
              style={[
                styles.btn,
                action.variant === 'outline' ? styles.btnOutline : styles.btnMuted,
              ]}
            >
              <Text style={styles.btnMutedText}>{action.label}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {!!onDismiss && (
        <TouchableOpacity
          hitSlop={10}
          onPress={onDismiss}
          accessibilityLabel={dismissLabel}
          style={styles.dismiss}
        >
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    backgroundColor: colors.bg,
  },
  ring: {
    width: AVATAR + 5,
    height: AVATAR + 5,
    borderRadius: (AVATAR + 5) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: AVATAR + 1,
    height: AVATAR + 1,
    borderRadius: (AVATAR + 1) / 2,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plain: {
    width: AVATAR + 5,
    height: AVATAR + 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: AVATAR - 4,
    height: AVATAR - 4,
    borderRadius: (AVATAR - 4) / 2,
    backgroundColor: colors.surface,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: font.label,
    fontWeight: '600',
    color: colors.text,
  },
  secondary: {
    fontSize: font.body,
    color: colors.textMuted,
  },
  btn: {
    minWidth: 96,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Flat crimson, matching Save on the edit sheets.
  btnFilled: {
    backgroundColor: colors.accentAlt,
  },
  btnMuted: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnFilledText: {
    color: colors.white,
    fontSize: font.body,
    fontWeight: '600',
  },
  btnMutedText: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '600',
  },
  dimmed: {
    opacity: 0.55,
  },
  dismiss: {
    paddingLeft: spacing.xs,
  },
});
