import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { useEffect, useMemo, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useReference } from '../utils/useReference';
import {
  colors,
  font,
  radius,
  spacing,
  profileId,
  profileName,
  profileCode,
  profileImage,
  profileSubtitle,
  profileLocation,
  photoHeight,
  type Profile,
} from './theme';

const { width, height } = Dimensions.get('window');
const CARD_W = width - 24;
// Photo-shaped, capped so the card still fits above the action row.
const CARD_H = Math.min(photoHeight(CARD_W), height * 0.62);
const SWIPE_THRESHOLD = width * 0.28;

type Props = {
  profiles: Profile[];
  index: number;
  /** Fired once a card has animated off-screen. */
  onSwipe: (direction: 'left' | 'right', profile: Profile) => void;
  onShortlist: (id: string | number) => void;
  onOpen: (id: string | number) => void;
};

/**
 * Presentational card deck. The parent owns the profile list, the current
 * index and pagination; this component only handles the gesture, the
 * animation and the action row.
 *
 * Uses RN's Animated + PanResponder rather than reanimated worklets - this
 * screen sits behind the navigation stack that useGuardedRouter exists to
 * protect, so it avoids adding another moving part to a crash-prone surface.
 */
export default function SwipeDeck({ profiles, index, onSwipe, onShortlist, onOpen }: Props) {
  // Profiles store codes; the card overlay must show labels.
  const { label } = useReference();
  const position = useRef(new Animated.ValueXY()).current;

  // The PanResponder is built once, so its closures would capture the first
  // render's props. These refs hand the handlers the live values.
  const indexRef = useRef(index);
  const profilesRef = useRef(profiles);
  const onSwipeRef = useRef(onSwipe);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);
  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);
  useEffect(() => {
    onSwipeRef.current = onSwipe;
  }, [onSwipe]);

  const forceSwipe = (direction: 'left' | 'right') => {
    const card = profilesRef.current[indexRef.current];

    Animated.timing(position, {
      toValue: { x: direction === 'right' ? width * 1.5 : -width * 1.5, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      if (card) onSwipeRef.current(direction, card);
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 6,
      useNativeDriver: false,
    }).start();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_e, g) => position.setValue({ x: g.dx, y: g.dy }),
        onPanResponderRelease: (_e, g) => {
          if (g.dx > SWIPE_THRESHOLD) forceSwipe('right');
          else if (g.dx < -SWIPE_THRESHOLD) forceSwipe('left');
          else resetPosition();
        },
        onPanResponderTerminate: resetPosition,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const rotate = position.x.interpolate({
    inputRange: [-width * 1.5, 0, width * 1.5],
    outputRange: ['-18deg', '0deg', '18deg'],
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const nextScale = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  const body = (profile: Profile) => {
    const uri = profileImage(profile);
    const subtitle = profileSubtitle(profile, label);
    const location = profileLocation(profile);

    return (
      <>
        {uri ? (
          <Image source={{ uri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Ionicons name="person" size={80} color={colors.textFaint} />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.overlay}>
          <Text style={styles.code}>{profileCode(profile)}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {profileName(profile)}
          </Text>
          {!!subtitle && (
            <View style={styles.metaRow}>
              <Ionicons name="briefcase-outline" size={14} color={colors.white} />
              <Text style={styles.meta} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          )}
          {!!location && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={colors.white} />
              <Text style={styles.meta} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}
        </LinearGradient>
      </>
    );
  };

  const current = profiles[index];
  const next = profiles[index + 1];
  if (!current) return null;

  const currentId = profileId(current);

  return (
    <View style={styles.wrap}>
      <View style={styles.deck}>
        {next && (
          <Animated.View
            style={[styles.card, styles.cardBehind, { transform: [{ scale: nextScale }] }]}
          >
            {body(next)}
          </Animated.View>
        )}

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
          ]}
        >
          {body(current)}

          <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
            <Text style={[styles.stampText, { color: colors.online }]}>CONNECT</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
            <Text style={[styles.stampText, { color: colors.danger }]}>PASS</Text>
          </Animated.View>

          <TouchableOpacity
            style={styles.infoBtn}
            hitSlop={8}
            onPress={() => currentId != null && onOpen(currentId)}
            accessibilityLabel="View full profile"
          >
            <Ionicons name="information-circle" size={26} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.circle}
          activeOpacity={0.8}
          onPress={() => forceSwipe('left')}
          accessibilityLabel="Pass"
        >
          <Ionicons name="close" size={30} color={colors.danger} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circle}
          activeOpacity={0.8}
          onPress={() => currentId != null && onShortlist(currentId)}
          accessibilityLabel="Shortlist"
        >
          <Ionicons name="star" size={24} color={colors.star} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => forceSwipe('right')}
          style={styles.connectShadow}
        >
          <View style={styles.connectBtn}>
            <Ionicons name="heart" size={20} color={colors.white} />
            <Text style={styles.connectText}>Connect</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  deck: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
      },
      android: { elevation: 6 },
    }),
  },
  cardBehind: {
    opacity: 0.9,
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingTop: 56,
    gap: 3,
  },
  code: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: font.caption,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  name: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: font.body,
    flex: 1,
  },
  stamp: {
    position: 'absolute',
    top: 28,
    borderWidth: 3,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  stampLike: {
    left: 20,
    borderColor: colors.online,
    transform: [{ rotate: '-14deg' }],
  },
  stampNope: {
    right: 20,
    borderColor: colors.danger,
    transform: [{ rotate: '14deg' }],
  },
  stampText: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  infoBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  connectShadow: {
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 5 },
    }),
  },
  connectBtn: {
    backgroundColor: colors.accentAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: 28,
    height: 56,
    borderRadius: 28,
  },
  connectText: {
    color: colors.white,
    fontSize: font.title,
    fontWeight: 'bold',
  },
});
