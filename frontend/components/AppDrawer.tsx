import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing } from './theme';

/**
 * The account menu that slides in from the left.
 *
 * Built on Modal rather than @react-navigation/drawer on purpose. That library
 * was removed from this project because nothing used it and it was costing APK
 * size; bringing it back for a three-item menu would undo that for navigation
 * this app does not otherwise need. Modal already gives the two things that
 * actually matter here - it renders above everything, and it handles the
 * Android back button - so what is left is one slide animation.
 *
 * `useNativeDriver` on the transform keeps the slide on the UI thread, so it
 * stays smooth even while the screen underneath is fetching.
 */

const WIDTH = Math.min(Dimensions.get('window').width * 0.82, 340);

export type DrawerItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  name?: string | null;
  memberId?: string | null;
  avatarUrl?: string | null;
  items: DrawerItem[];
};

export default function AppDrawer({
  visible,
  onClose,
  name,
  memberId,
  avatarUrl,
  items,
}: Props) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(-WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slower on the way in than the way out: an entrance wants to feel
    // deliberate, a dismissal wants to feel immediate.
    Animated.parallel([
      Animated.timing(slide, {
        toValue: visible ? 0 : -WIDTH,
        duration: visible ? 220 : 160,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: visible ? 1 : 0,
        duration: visible ? 220 : 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, slide, fade]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {/* Tapping the dimmed area closes, which is the gesture everyone
            already expects from a drawer. */}
        <Animated.View style={[styles.scrim, { opacity: fade }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Close menu"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            { width: WIDTH, paddingTop: insets.top + spacing.lg, transform: [{ translateX: slide }] },
          ]}
        >
          <View style={styles.header}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={26} color={colors.textFaint} />
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.name} numberOfLines={1}>
                {name || 'Your profile'}
              </Text>
              {!!memberId && <Text style={styles.memberId}>ID - {memberId}</Text>}
            </View>
          </View>

          <View style={styles.divider} />

          {items.map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => {
                // Close first, then navigate. Pushing a screen while the modal
                // is still mounted leaves the drawer sitting over the new
                // screen on Android.
                onClose();
                requestAnimationFrame(item.onPress);
              }}
              accessibilityRole="button"
            >
              <Ionicons name={item.icon} size={20} color={colors.text} />
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  panel: {
    height: '100%',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.bg },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  name: { fontSize: font.title, fontWeight: '700', color: colors.text },
  memberId: { fontSize: font.small, color: colors.textFaint, marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E4E4E4',
    marginVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 16,
  },
  rowPressed: { opacity: 0.6 },
  rowLabel: { flex: 1, fontSize: font.body, color: colors.text, fontWeight: '500' },
});
