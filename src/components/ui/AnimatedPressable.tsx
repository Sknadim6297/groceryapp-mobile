import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion } from '@/constants/theme';

type AnimatedPressableProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Short scale feedback. Layout styles stay on Pressable so flexDirection/gap
 * apply to children (icon + label stay in a row). Transform lives on the wrapper.
 */
export function AnimatedPressable({ children, style, disabled, onPressIn, onPressOut, ...rest }: AnimatedPressableProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ alignSelf: 'stretch' }, animatedStyle]}>
      <Pressable
        {...rest}
        disabled={disabled}
        style={style}
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
