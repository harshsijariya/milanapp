import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  TextInput,
  ViewStyle,
} from 'react-native';

/**
 * A ScrollView that keeps the focused input above the keyboard.
 *
 * KeyboardAvoidingView is not enough here. The app sets `edgeToEdgeEnabled`, and
 * an edge-to-edge Android window does not resize when the keyboard opens - the
 * layout keeps its full height and the keyboard simply draws over it. That is
 * why the confirm-password field, the step-1 inputs and the state search results
 * were all unreachable: nothing was ever moving them.
 *
 * So the keyboard height is measured directly, applied as bottom padding, and
 * the focused input scrolled into what space is left. Same code path on both
 * platforms - two different behaviours to reason about buys nothing here.
 */

type Props = ScrollViewProps & {
  children: React.ReactNode;
  /** Breathing room between the input and the top of the keyboard. */
  gap?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export type FormScrollHandle = {
  scrollToEnd: () => void;
};

/**
 * Keyboard height, or 0 while closed.
 *
 * `keyboardDidShow` rather than `WillShow`: Android only fires the Did events,
 * so listening for Will on iOS alone would make the two platforms behave
 * differently for no benefit.
 */
export const useKeyboardHeight = (): number => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) =>
      setHeight(e.endCoordinates?.height ?? 0),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
};

/**
 * How much of the keyboard still covers a container, after any resizing the OS
 * already did for us.
 *
 * This distinction is the whole problem. Android resizes a Modal's own window
 * when the keyboard opens, but an edge-to-edge Activity window is left at full
 * height. Assuming either one is wrong somewhere: pad unconditionally and the
 * modal sheets jump twice the keyboard's height into the middle of the screen;
 * pad never and the plain screens keep their fields underneath it.
 *
 * So compare the container's measured height against the full window. Whatever
 * the OS already took off is not ours to take off again.
 *
 * @param measured height reported by the container's own onLayout, or 0 before
 *                 the first layout pass
 */
export const useCoveredHeight = (measured: number): number => {
  const keyboard = useKeyboardHeight();
  if (keyboard === 0) return 0;

  const window = Dimensions.get('window').height;
  const alreadyHandled = Math.max(0, window - measured);

  return Math.max(0, keyboard - alreadyHandled);
};

const FormScroll = forwardRef<FormScrollHandle, Props>(
  ({ children, gap = 24, contentContainerStyle, onScroll, ...rest }, ref) => {
    const scrollRef = useRef<ScrollView>(null);
    const offset = useRef(0);

    // Measured, not assumed: inside a Modal the OS has usually shrunk this view
    // already, and padding again would move the content twice.
    const [viewport, setViewport] = useState(0);
    const keyboard = useCoveredHeight(viewport);

    useImperativeHandle(ref, () => ({
      scrollToEnd: () => scrollRef.current?.scrollToEnd({ animated: true }),
    }));

    const handleScroll = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        offset.current = e.nativeEvent.contentOffset.y;
        onScroll?.(e);
      },
      [onScroll],
    );

    useEffect(() => {
      if (keyboard === 0) return;

      // One tick of delay: the bottom padding has to exist before an offset is
      // worth computing, or the view scrolls to a position that stops being
      // valid a moment later.
      const timer = setTimeout(() => {
        const input = TextInput.State.currentlyFocusedInput?.();
        if (!input || !scrollRef.current) return;

        // Window coordinates, not content coordinates: the keyboard's height is
        // measured against the screen, so the input has to be too. Measuring
        // against the content instead is what makes naive versions of this
        // scroll to the wrong place on long forms.
        input.measureInWindow((_x: number, y: number, _w: number, height: number) => {
          // Against the window, because measureInWindow reports window
          // coordinates - but only the still-covered part of the keyboard
          // counts, since anything the OS already resized away is not on screen
          // to obstruct anything.
          const limit = Dimensions.get('window').height - keyboard - gap;
          const bottom = y + height;
          if (bottom <= limit) return;

          scrollRef.current?.scrollTo({
            y: Math.max(0, offset.current + (bottom - limit)),
            animated: true,
          });
        });
      }, 60);

      return () => clearTimeout(timer);
    }, [keyboard, gap]);

    return (
      <ScrollView
        ref={scrollRef}
        onLayout={(e) => setViewport(e.nativeEvent.layout.height)}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          contentContainerStyle,
          // This padding is what actually makes the last field reachable; the
          // scroll above only positions within the space it creates.
          { paddingBottom: keyboard > 0 ? keyboard + gap : 0 },
        ]}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  },
);

FormScroll.displayName = 'FormScroll';

export default FormScroll;
