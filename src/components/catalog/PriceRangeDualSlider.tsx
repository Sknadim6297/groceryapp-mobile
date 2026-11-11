import { useEffect, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View, type PanResponderInstance } from 'react-native';

import { colors } from '@/constants/theme';

type PriceRangeDualSliderProps = {
  boundMin: number;
  boundMax: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
};

const THUMB = 22;

/** Per-instance gesture bags kept off React state so pan handlers stay stable under the Compiler. */
const handlerBags = new Map<symbol, HandlerBag>();

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function snap(value: number, min: number, max: number) {
  const span = Math.max(1, max - min);
  const step = span > 500 ? 10 : span > 100 ? 5 : 1;
  return Math.round(value / step) * step;
}

type ValuesBag = {
  boundMin: number;
  boundMax: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
};

type DragBag = {
  thumb: 'low' | 'high';
  startLow: number;
  startHigh: number;
};

type HandlerBag = {
  values: ValuesBag;
  width: number;
  drag: DragBag;
};

function createResponders(bag: HandlerBag): { low: PanResponderInstance; high: PanResponderInstance } {
  const make = (thumb: 'low' | 'high') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        bag.drag = {
          thumb,
          startLow: bag.values.low,
          startHigh: bag.values.high,
        };
      },
      onPanResponderMove: (_evt, gesture) => {
        const { boundMin: min, boundMax: max, onChange: emit } = bag.values;
        const track = Math.max(1, bag.width - THUMB);
        const localSpan = Math.max(1, max - min);
        const deltaValue = (gesture.dx / track) * localSpan;
        if (bag.drag.thumb === 'low') {
          const nextLow = clamp(
            snap(bag.drag.startLow + deltaValue, min, max),
            min,
            bag.drag.startHigh - 1,
          );
          emit(nextLow, bag.drag.startHigh);
        } else {
          const nextHigh = clamp(
            snap(bag.drag.startHigh + deltaValue, min, max),
            bag.drag.startLow + 1,
            max,
          );
          emit(bag.drag.startLow, nextHigh);
        }
      },
    });
  return { low: make('low'), high: make('high') };
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
  const [width, setWidth] = useState(1);
  const [runtime] = useState(() => {
    const id = Symbol('price-range-slider');
    const bag: HandlerBag = {
      values: { boundMin, boundMax, low, high, onChange },
      width: 1,
      drag: { thumb: 'low', startLow: low, startHigh: high },
    };
    handlerBags.set(id, bag);
    return { id, responders: createResponders(bag) };
  });

  useEffect(() => {
    const bag = handlerBags.get(runtime.id);
    if (!bag) {
      return;
    }
    bag.values = { boundMin, boundMax, low, high, onChange };
  }, [runtime.id, boundMin, boundMax, low, high, onChange]);

  useEffect(() => {
    const id = runtime.id;
    return () => {
      handlerBags.delete(id);
    };
  }, [runtime.id]);

  const span = Math.max(1, boundMax - boundMin);
  const lowRatio = clamp((low - boundMin) / span, 0, 1);
  const highRatio = clamp((high - boundMin) / span, 0, 1);

  function onLayout(event: LayoutChangeEvent) {
    const next = event.nativeEvent.layout.width;
    const bag = handlerBags.get(runtime.id);
    if (bag) {
      bag.width = next;
    }
    setWidth(next);
  }

  const trackInner = Math.max(0, width - THUMB);
  const lowLeft = lowRatio * trackInner;
  const highLeft = highRatio * trackInner;
  const { responders } = runtime;

  return (
    <View
      style={styles.track}
      onLayout={onLayout}
      accessibilityRole="adjustable"
      accessibilityLabel="Price range"
      accessibilityValue={{ min: boundMin, max: boundMax, now: low, text: `${low} to ${high}` }}>
      <View style={styles.rail} />
      <View
        style={[
          styles.active,
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
  track: {
    height: THUMB,
    justifyContent: 'center',
  },
  rail: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  active: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryInk,
    top: 0,
  },
});
