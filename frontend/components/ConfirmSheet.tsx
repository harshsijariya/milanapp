import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from './theme';

/**
 * A bottom-sheet confirmation.
 *
 * Replaces Alert.alert for destructive actions. The system dialog appears in
 * the middle of the screen in the OS's own styling, which on Android puts the
 * confirm button under whichever finger is least likely to be there. A sheet
 * arrives from the bottom where the thumb already is, and looks like the rest
 * of the app.
 *
 * Cancel sits on the left and is the outlined one: the filled button is the
 * action you asked for, but the quiet one should be the easy miss.
 */

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  /** Label for the destructive button. */
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  onCancel,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        {/* Tapping the dimmed area cancels - the same expectation every other
            sheet in the app sets. */}
        <Pressable style={styles.backdropTouch} onPress={onCancel} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.grabber} />

          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.button, styles.cancel]}
              activeOpacity={0.8}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirm]}
              activeOpacity={0.85}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropTouch: { flex: 1 },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: font.heading,
    fontWeight: '700',
    color: colors.heading,
  },
  message: {
    fontSize: font.label,
    color: colors.textMuted,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    borderWidth: 1.5,
    borderColor: colors.brand,
    backgroundColor: colors.bg,
  },
  cancelText: {
    color: colors.brand,
    fontSize: font.title,
    fontWeight: '600',
  },
  confirm: {
    backgroundColor: colors.brand,
  },
  confirmText: {
    color: colors.white,
    fontSize: font.title,
    fontWeight: '700',
  },
});
