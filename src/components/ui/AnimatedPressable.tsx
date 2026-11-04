import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion } from '@/constants/theme';

type AnimatedPressableProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Short scale feedback.
 * Flex/size/margin live on the outer wrapper so row layouts (e.g. qty steppers) size correctly.
 * flexDirection/gap/padding/align stay on Pressable so icon + label children lay out as a row.
 */
export function AnimatedPressable({ children, style, disabled, onPressIn, onPressOut, ...rest }: AnimatedPressableProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const { outer, inner } = splitPressableStyle(style);

  return (
    <Animated.View style={[styles.wrap, outer, animatedStyle]}>
      <Pressable
        {...rest}
        disabled={disabled}
        style={[styles.pressable, inner]}
        onPressIn={(event) => {
          if (!disabled && !reducedMotion) {
            // eslint-disable-next-line react-hooks/immutability -- shared value write
            scale.value = withTiming(0.97, { duration: motion.press });
          }
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          // eslint-disable-next-line react-hooks/immutability -- shared value write
          scale.value = withTiming(1, { duration: motion.press + 20 });
          onPressOut?.(event);
        }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function splitPressableStyle(style: StyleProp<ViewStyle> | undefined): {
  outer: ViewStyle;
  inner: ViewStyle;
} {
  const flat = StyleSheet.flatten(style) ?? {};
  const {
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    alignSelf,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    marginStart,
    marginEnd,
    position,
    top,
    left,
    right,
    bottom,
    zIndex,
    ...inner
  } = flat;

  return {
    outer: {
      flex,
      flexGrow,
      flexShrink,
      flexBasis,
      alignSelf: alignSelf ?? 'stretch',
      width,
      height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      margin,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      marginHorizontal,
      marginVertical,
      marginStart,
      marginEnd,
      position,
      top,
      left,
      right,
      bottom,
      zIndex,
    },
    inner,
  };
}

const styles = StyleSheet.create({
  wrap: {
    // Default stretch keeps full-width ADD buttons filling the card footer.
  },
  pressable: {
    flex: 1,
  },
});
