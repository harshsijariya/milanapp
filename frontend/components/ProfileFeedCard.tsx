import { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useReference } from '../utils/useReference';
import { connectionAction, type ConnectionState } from '../utils/useConnections';
import {
  colors,
  font,
  radius,
  spacing,
  storyRing,
  profileId,
  profileName,
  profileCode,
  profileImage,
  profileAge,
  profileHeadline,
  profileHighlights,
  profileLocation,
  photoHeight,
  type Profile,
} from './theme';

const { width, height: SCREEN_H } = Dimensions.get('window');

/**
 * Feed photos are a window onto the top of the picture, not the whole thing.
 *
 * A full 3:4 photo is taller than the phone once the header, action row and
 * caption are added, so one card filled the screen and the feed stopped looking
 * like a feed. Capping the window at half the screen keeps the caption and the
 * next card in view.
 *
 * The overflow is taken off the bottom rather than shared top-and-bottom,
 * because faces sit in the upper half of a portrait. Centre-cropping is what
 * cut the top of the head off in the first place.
 */
const PHOTO_FULL_H = photoHeight(width);
const PHOTO_WINDOW_H = Math.min(PHOTO_FULL_H, Math.round(SCREEN_H * 0.5));

type Props = {
  profile: Profile;
  /** Drives the button: Connect / Withdraw / Accept / Connected. */
  state?: ConnectionState;
  shortlisted?: boolean;
  onPress: (id: string | number) => void;
  onConnect: (id: string | number) => void;
  onShortlist: (id: string | number) => void;
};

/**
 * One profile rendered as an Instagram feed post: identity header, full-bleed
 * portrait image, action row, then a caption block. "Connect" replaces the like
 * button as the primary action, since sending interest is the thing that
 * matters here.
 */
function ProfileFeedCard({
  profile,
  state = 'NONE',
  shortlisted = false,
  onPress,
  onConnect,
  onShortlist,
}: Props) {
  // Profiles store codes ("H_66"); rows must show labels ("5' 6\"").
  const { label } = useReference();

  const id = profileId(profile);
  const uri = profileImage(profile);
  const location = profileLocation(profile);
  const age = profileAge(profile);
  const headline = profileHeadline(profile, label);
  const highlights = profileHighlights(profile, label);
  const action = connectionAction(state);
  const connected = state === 'SENT' || state === 'CONNECTED';

  const open = () => id != null && onPress(id);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} activeOpacity={0.8} onPress={open}>
          <LinearGradient
            colors={storyRing}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.avatarRing}
          >
            <View style={styles.avatarInner}>
              {uri ? (
                <Image source={{ uri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={16} color={colors.textFaint} />
                </View>
              )}
            </View>
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.username} numberOfLines={1}>
              {profileName(profile)}
            </Text>
            {!!location && (
              <Text style={styles.headerMeta} numberOfLines={1}>
                {location}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity hitSlop={8} accessibilityLabel="More options">
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.95} onPress={open} style={styles.photoWindow}>
        {uri ? (
          // Laid out at full height and pinned to the top of the window, so the
          // clipping happens below the subject instead of around it.
          <Image source={{ uri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Ionicons name="person" size={64} color={colors.textFaint} />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            hitSlop={8}
            onPress={() => id != null && onConnect(id)}
            accessibilityLabel="Connect"
          >
            <Ionicons
              name={connected ? 'heart' : 'heart-outline'}
              size={26}
              color={connected ? colors.danger : colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={8} onPress={open} accessibilityLabel="View profile">
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={8} accessibilityLabel="Share">
            <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          hitSlop={8}
          onPress={() => id != null && onShortlist(id)}
          accessibilityLabel="Shortlist"
        >
          <Ionicons
            name={shortlisted ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={shortlisted ? colors.star : colors.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.caption}>
        <Text style={styles.code}>{profileCode(profile)}</Text>

        <Text style={styles.captionName}>
          {profileName(profile)}
          {age ? `, ${age}` : ''}
        </Text>

        {!!headline && <Text style={styles.detail}>{headline}</Text>}
        {highlights.map((line, i) => (
          <Text key={i} style={styles.detail} numberOfLines={2}>
            {line}
          </Text>
        ))}

        <TouchableOpacity
          style={styles.connectWrap}
          activeOpacity={0.85}
          onPress={() => id != null && onConnect(id)}
          disabled={action.disabled}
        >
          {action.variant === 'filled' ? (
            <View style={styles.connectBtn}>
              <Text style={styles.connectText}>{action.label}</Text>
            </View>
          ) : (
            <View style={styles.connectedBtn}>
              {action.label === 'Connected' && (
                <Ionicons name="checkmark" size={16} color={colors.text} />
              )}
              <Text style={styles.connectedText}>{action.label}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Memoised because this is a feed row: every shortlist tap, every "load more",
 * every unread-count poll re-renders the screen holding the list, and without
 * this each of those re-runs the layout for every card on screen. Depends on
 * the parent passing stable callbacks - see the useCallback block in home.tsx.
 */
export default memo(ProfileFeedCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: colors.surface,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  username: {
    fontSize: font.label,
    fontWeight: '600',
    color: colors.text,
  },
  headerMeta: {
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: 1,
  },
  photoWindow: {
    width,
    height: PHOTO_WINDOW_H,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photo: {
    width,
    height: PHOTO_FULL_H,
    backgroundColor: colors.surface,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  caption: {
    paddingHorizontal: spacing.md,
    gap: 3,
  },
  code: {
    fontSize: font.caption,
    color: colors.accent,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  captionName: {
    fontSize: font.title,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 1,
  },
  detail: {
    fontSize: font.body,
    color: colors.textMuted,
    lineHeight: 19,
  },
  connectWrap: {
    marginTop: spacing.sm,
  },
  // Flat crimson, matching the Save button on the edit sheets - one primary
  // action style across the app rather than a gradient here and a flat there.
  connectBtn: {
    backgroundColor: colors.accentAlt,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: radius.sm,
  },
  connectText: {
    color: colors.white,
    fontSize: font.label,
    fontWeight: '600',
  },
  connectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  connectedText: {
    color: colors.text,
    fontSize: font.label,
    fontWeight: '600',
  },
});
