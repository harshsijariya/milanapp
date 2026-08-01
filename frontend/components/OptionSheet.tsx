import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChipRow from './ChipRow';
import { colors, font, radius, spacing } from './theme';
import type { Option } from '../utils/useReference';

const { height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  title: string;
  options: Option[];
  /** Selected code, or codes when multi. */
  value?: string | string[] | null;
  multi?: boolean;
  searchable?: boolean;
  onClose: () => void;
  onSave: (value: string | string[]) => void;
};

/**
 * The picker that slides over an edit sheet.
 *
 * Layout follows the reference screens: selected values as removable chips at
 * the top, a filled search field with the magnifier on the right, a checkbox
 * list, and a right-aligned Done button. The parent sheet stays visible and
 * dimmed behind it so the user keeps their place in the form.
 *
 * Selection is local until Done. Committing per tap would fire a write per
 * keystroke in multi-select and make dismissing-without-saving meaningless.
 */
export default function OptionSheet({
  visible,
  title,
  options,
  value,
  multi = false,
  searchable,
  onClose,
  onSave,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  // Re-seed on open so a cancelled edit never leaks into the next one.
  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setSelected(value == null ? [] : Array.isArray(value) ? value : [value]);
  }, [visible, value]);

  const showSearch = searchable ?? options.length > 8;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedChips = useMemo(
    () =>
      selected
        .map((code) => options.find((o) => o.code === code))
        .filter(Boolean)
        .map((o) => ({ code: o!.code, label: o!.label })),
    [selected, options]
  );

  const toggle = (code: string) => {
    if (multi) {
      setSelected((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      );
    } else {
      setSelected([code]);
    }
  };

  const commit = () => {
    onSave(multi ? selected : (selected[0] ?? ''));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{title}</Text>

          {selectedChips.length > 0 && (
            <ChipRow
              chips={selectedChips}
              selected={selected}
              removable
              onPress={(code) => setSelected((prev) => prev.filter((c) => c !== code))}
            />
          )}

          {showSearch && (
            <View style={styles.searchWrap}>
              <TextInput
                style={styles.search}
                placeholder="Type to search"
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
              />
              {query ? (
                <TouchableOpacity hitSlop={8} onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={19} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="search" size={19} color={colors.fieldLabel} />
              )}
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => {
              const isOn = selected.includes(item.code);
              return (
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => toggle(item.code)}
                >
                  <View style={[styles.box, isOn && styles.boxOn]}>
                    {isOn && <Ionicons name="checkmark" size={15} color={colors.white} />}
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {options.length === 0 ? 'Loading options…' : `No match for “${query}”`}
                </Text>
              </View>
            }
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.done} activeOpacity={0.85} onPress={commit}>
              <Text style={styles.doneText}>Done</Text>
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
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: height * 0.78,
    gap: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 21,
    fontWeight: 'bold',
    color: colors.heading,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: 46,
    borderRadius: radius.md,
    // Filled rather than outlined, matching the reference.
    backgroundColor: colors.surface,
  },
  search: {
    flex: 1,
    fontSize: font.title,
    color: colors.fieldValue,
    padding: 0,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 13,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: colors.accentAlt,
    borderColor: colors.accentAlt,
  },
  rowLabel: {
    flex: 1,
    fontSize: font.title,
    color: colors.fieldValue,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: font.body,
    color: colors.textMuted,
  },
  footer: {
    // Right-aligned rather than full width, so it reads as "confirm this picker"
    // rather than "save the whole form" - that button lives on the sheet behind.
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: spacing.md,
  },
  done: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.accentAlt,
  },
  doneText: {
    color: colors.white,
    fontSize: font.title,
    fontWeight: 'bold',
  },
});
