import { memo, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  /** Leading glyph, e.g. "mail-outline". */
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  /** Renders the masked field plus its own show/hide toggle. */
  secure?: boolean;
};

/**
 * One labelled row of a sign-in form: icon, input, and - for passwords - the
 * reveal toggle.
 *
 * Memoised, and that is the point of the component rather than a nicety. These
 * screens hold every field in one `useState` apiece on the screen component, so
 * a single keystroke re-rendered the whole 380-line tree: both fields, the
 * logo, the Google button, the footer. That is what the typing lag was. Wrapped
 * in `memo`, a keystroke re-renders only the field whose `value` changed - the
 * others see identical props and are skipped.
 *
 * Two things keep that working, and both are easy to undo by accident:
 *
 *  - `onChangeText` must be referentially stable. Passing a `useState` setter
 *    directly is stable; passing an inline arrow (`onChangeText={(t) => ...}`)
 *    creates a new function every render and defeats the memo entirely.
 *  - the reveal toggle keeps its state HERE rather than on the screen. Hoisting
 *    it up would make every toggle re-render the whole form again, which is the
 *    problem this exists to avoid.
 */
function FormField({ icon, value, onChangeText, secure = false, ...rest }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={20} color="#8E8E8E" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholderTextColor="#8E8E8E"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure && !revealed}
        {...rest}
      />
      {secure && (
        <TouchableOpacity
          style={styles.eye}
          onPress={() => setRevealed((r) => !r)}
          accessibilityRole="button"
          accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          hitSlop={8}
        >
          <Ionicons name={revealed ? 'eye-off' : 'eye'} size={20} color="#8E8E8E" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#262626',
  },
  eye: {
    padding: 8,
  },
});

export default memo(FormField);
