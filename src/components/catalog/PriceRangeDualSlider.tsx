import { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

type PriceRangeDualSliderProps = {
  boundMin: number;
  boundMax: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
};

const THUMB = 22;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function snap(value: number, min: number, max: number) {
  const span = Math.max(1, max - min);
  const step = span > 500 ? 10 : span > 100 ? 5 : 1;
  return Math.round(value / step) * step;
}

/**
 * Lightweight dual-thumb range control — no extra native modules.
 * Yellow active track follows Mayapur brand fills.
 */
export function PriceRangeDualSlider({
  boundMin,
  boundMax,
  low,
  high,
  onChange,
}: PriceRangeDualSliderProps) {
  const widthRef = useRef(1);
  const [width, setWidth] = useState(1);
  const valuesRef = useRef({ boundMin, boundMax, low, high, onChange });
  valuesRef.current = { boundMin, boundMax, low, high, onChange };

  const span = Math.max(1, boundMax - boundMin);
  const lowRatio = clamp((low - boundMin) / span, 0, 1);
  const highRatio = clamp((high - boundMin) / span, 0, 1);

  const dragRef = useRef({
    thumb: 'low' as 'low' | 'high',
    startLow: low,
    startHigh: high,
  });

  const responders = useMemo(() => {
    const make = (thumb: 'low' | 'high') =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragRef.current = {
            thumb,
            startLow: valuesRef.current.low,
            startHigh: valuesRef.current.high,
          };
        },
        onPanResponderMove: (_evt, gesture) => {
          const { boundMin: min, boundMax: max, onChange: emit } = valuesRef.current;
          const track = Math.max(1, widthRef.current - THUMB);
          const localSpan = Math.max(1, max - min);
          const deltaValue = (gesture.dx / track) * localSpan;
          if (dragRef.current.thumb === 'low') {
            const nextLow = clamp(
              snap(dragRef.current.startLow + deltaValue, min, max),
              min,
              dragRef.current.startHigh - 1,
            );
            emit(nextLow, dragRef.current.startHigh);
          } else {
            const nextHigh = clamp(
              snap(dragRef.current.startHigh + deltaValue, min, max),
              dragRef.current.startLow + 1,
              max,
            );
            emit(dragRef.current.startLow, nextHigh);
          }
        },
      });
    return { low: make('low'), high: make('high') };
  }, []);

  function onLayout(event: LayoutChangeEvent) {
    const next = event.nativeEvent.layout.width;
    widthRef.current = next;
    setWidth(next);
  }

  const trackInner = Math.max(0, width - THUMB);
  const lowLeft = lowRatio * trackInner;
  const highLeft = highRatio * trackInner;

  return (
    <View
      style={styles.wrap}
      onLayout={onLayout}
      testID="price-range-slider"
      accessibilityRole="adjustable"
      accessibilityLabel={`Price range ${low} to ${high}`}>
      <View style={styles.track} />
      <View
        style={[
          styles.fill,
          {
            left: lowLeft + THUMB / 2,
            width: Math.max(0, highLeft - lowLeft),
          },
        ]}
      />
      <View
        {...responders.low.panHandlers}
        style={[styles.thumb, { left: lowLeft }]}
        accessibilityLabel={`Minimum price ${low}`}
      />
      <View
        {...responders.high.panHandlers}
        style={[styles.thumb, { left: highLeft }]}
        accessibilityLabel={`Maximum price ${high}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 36,
    justifyContent: 'center',
    marginTop: 4,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  fill: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primaryDark,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    top: (36 - THUMB) / 2,
    elevation: 2,
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});
