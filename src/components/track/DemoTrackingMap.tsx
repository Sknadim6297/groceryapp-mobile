import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, G, Path, Rect, LinearGradient, Stop } from 'react-native-svg';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { pointAlongRoute, splitRouteAtProgress } from '@/data/demoOrderTracking';
import type { DemoMapPoint, DemoOrderTracking } from '@/types/orderTracking';

type DemoTrackingMapProps = {
  tracking: DemoOrderTracking;
  /** Show rider scooter on the demo polyline. */
  showRider?: boolean;
  /** Extra bottom inset so the recenter control clears the sheet. */
  bottomClearance?: number;
  /** Extra top inset so overlays clear the floating header. */
  topClearance?: number;
};

/**
 * Canvas demo map for preview orders — not GPS, traffic, or live routing.
 * Used when a real MapLibre tracking feed is unavailable.
 */
export function DemoTrackingMap({
  tracking,
  showRider = true,
  bottomClearance = 24,
  topClearance = 12,
}: DemoTrackingMapProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1.12);

  const rider = useMemo(
    () => pointAlongRoute(tracking.route, tracking.riderProgress),
    [tracking.route, tracking.riderProgress],
  );
  const { completed, remaining } = useMemo(
    () => splitRouteAtProgress(tracking.route, tracking.riderProgress),
    [tracking.route, tracking.riderProgress],
  );

  const { width: mapW, height: mapH } = tracking.mapSize;
  const fit =
    layout.width > 0 && layout.height > 0
      ? Math.max(layout.width / mapW, layout.height / mapH) * zoom
      : 1;
  const focusX = showRider ? (rider.x + tracking.delivery.x) / 2 : (tracking.store.x + tracking.delivery.x) / 2;
  const focusY = showRider ? (rider.y + tracking.store.y) / 2 : (tracking.store.y + tracking.delivery.y) / 2;
  const offsetX = layout.width / 2 - focusX * fit;
  const offsetY = layout.height / 2 - focusY * fit;

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  }

  function recenter() {
    setZoom(1.12);
  }

  return (
    <View style={styles.root} onLayout={onLayout} testID="demo-tracking-map">
      {layout.width > 0 ? (
        <Svg width={layout.width} height={layout.height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="parkA" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#D9F99D" stopOpacity="0.95" />
              <Stop offset="1" stopColor="#BBF7D0" stopOpacity="0.9" />
            </LinearGradient>
          </Defs>
          <G transform={`translate(${offsetX}, ${offsetY}) scale(${fit})`}>
            <Rect x={0} y={0} width={mapW} height={mapH} fill="#F3F4F6" />
            {STREETS.map((street) => (
              <Rect
                key={street.id}
                x={street.x}
                y={street.y}
                width={street.w}
                height={street.h}
                fill="#FFFFFF"
                rx={street.rx ?? 2}
              />
            ))}
            {BLOCKS.map((block) => (
              <Rect
                key={block.id}
                x={block.x}
                y={block.y}
                width={block.w}
                height={block.h}
                fill={block.fill}
                rx={10}
              />
            ))}
            {PARKS.map((park) => (
              <Rect key={park.id} x={park.x} y={park.y} width={park.w} height={park.h} fill="url(#parkA)" rx={18} />
            ))}

            {tracking.route.length >= 2 ? (
              <>
                <Path
                  d={polylinePath(showRider ? completed : tracking.route)}
                  stroke={showRider ? colors.primaryDark : '#94A3B8'}
                  strokeWidth={14}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {showRider ? (
                  <Path
                    d={polylinePath(remaining)}
                    stroke="#16A34A"
                    strokeWidth={14}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
                <Path
                  d={polylinePath(showRider ? completed : tracking.route)}
                  stroke={showRider ? '#FDE68A' : '#CBD5E1'}
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {showRider ? (
                  <Path
                    d={polylinePath(remaining)}
                    stroke="#86EFAC"
                    strokeWidth={5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
              </>
            ) : null}

            <MarkerCircle cx={tracking.store.x} cy={tracking.store.y} fill="#16A34A" />
            <MarkerCircle cx={tracking.delivery.x} cy={tracking.delivery.y} fill="#16A34A" />
            {showRider ? (
              <>
                <Circle cx={rider.x} cy={rider.y} r={26} fill={colors.ink} opacity={0.92} />
                <Circle cx={rider.x} cy={rider.y} r={18} fill={colors.ink} />
              </>
            ) : null}
          </G>
        </Svg>
      ) : null}

      {layout.width > 0 ? (
        <>
          <MapIconBadge
            x={tracking.store.x * fit + offsetX}
            y={tracking.store.y * fit + offsetY}
            bg="#16A34A"
            icon="shop"
            iconColor={colors.white}
          />
          <MapIconBadge
            x={tracking.delivery.x * fit + offsetX}
            y={tracking.delivery.y * fit + offsetY}
            bg="#16A34A"
            icon="home"
            iconColor={colors.white}
          />
          {showRider ? (
            <View
              pointerEvents="none"
              style={[
                styles.riderBadge,
                {
                  left: rider.x * fit + offsetX - 18,
                  top: rider.y * fit + offsetY - 18,
                },
              ]}>
              <AppIcon name="bike" color={colors.white} size={18} />
            </View>
          ) : null}
        </>
      ) : null}

      <View style={[styles.demoPill, { top: topClearance + 8 }]} pointerEvents="none">
        <Text style={styles.demoPillText}>
          {tracking.route.length >= 2
            ? 'Demo route preview — not live GPS'
            : 'Location only — route unavailable'}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recenter map"
        onPress={recenter}
        style={({ pressed }) => [
          styles.locateBtn,
          { bottom: bottomClearance },
          pressed && styles.controlPressed,
        ]}
        testID="map-recenter">
        <AppIcon name="crosshair" color="#16A34A" size={20} />
      </Pressable>
    </View>
  );
}

function MapIconBadge({
  x,
  y,
  bg,
  icon,
  iconColor,
}: {
  x: number;
  y: number;
  bg: string;
  icon: 'shop' | 'home';
  iconColor: string;
}) {
  return (
    <View pointerEvents="none" style={[styles.markerBadge, { left: x - 18, top: y - 18, backgroundColor: bg }]}>
      <AppIcon name={icon} color={iconColor} size={16} />
    </View>
  );
}

function MarkerCircle({ cx, cy, fill }: { cx: number; cy: number; fill: string }) {
  return (
    <>
      <Circle cx={cx} cy={cy} r={28} fill={colors.white} opacity={0.95} />
      <Circle cx={cx} cy={cy} r={22} fill={fill} />
    </>
  );
}

function polylinePath(points: readonly DemoMapPoint[]): string {
  if (points.length === 0) {
    return '';
  }
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

const STREETS = [
  { id: 'h1', x: 40, y: 160, w: 920, h: 28, rx: 8 },
  { id: 'h2', x: 40, y: 320, w: 920, h: 24, rx: 8 },
  { id: 'h3', x: 40, y: 480, w: 920, h: 26, rx: 8 },
  { id: 'h4', x: 40, y: 640, w: 920, h: 24, rx: 8 },
  { id: 'h5', x: 40, y: 800, w: 920, h: 26, rx: 8 },
  { id: 'v1', x: 140, y: 40, w: 24, h: 920, rx: 8 },
  { id: 'v2', x: 320, y: 40, w: 22, h: 920, rx: 8 },
  { id: 'v3', x: 500, y: 40, w: 26, h: 920, rx: 8 },
  { id: 'v4', x: 680, y: 40, w: 22, h: 920, rx: 8 },
  { id: 'v5', x: 850, y: 40, w: 24, h: 920, rx: 8 },
];

const BLOCKS = [
  { id: 'b1', x: 180, y: 200, w: 120, h: 90, fill: '#E2E8F0' },
  { id: 'b2', x: 360, y: 200, w: 110, h: 95, fill: '#E5E7EB' },
  { id: 'b3', x: 540, y: 195, w: 115, h: 100, fill: '#E2E8F0' },
  { id: 'b4', x: 180, y: 360, w: 120, h: 90, fill: '#E5E7EB' },
  { id: 'b5', x: 360, y: 355, w: 110, h: 95, fill: '#E2E8F0' },
  { id: 'b6', x: 540, y: 360, w: 115, h: 90, fill: '#E5E7EB' },
  { id: 'b7', x: 180, y: 520, w: 120, h: 90, fill: '#E2E8F0' },
  { id: 'b8', x: 360, y: 515, w: 110, h: 95, fill: '#E5E7EB' },
  { id: 'b9', x: 540, y: 520, w: 115, h: 90, fill: '#E2E8F0' },
  { id: 'b10', x: 720, y: 360, w: 100, h: 95, fill: '#E5E7EB' },
  { id: 'b11', x: 720, y: 520, w: 100, h: 90, fill: '#E2E8F0' },
];

const PARKS = [
  { id: 'p1', x: 60, y: 60, w: 150, h: 80 },
  { id: 'p2', x: 730, y: 70, w: 180, h: 90 },
  { id: 'p3', x: 60, y: 860, w: 200, h: 80 },
  { id: 'p4', x: 780, y: 780, w: 150, h: 100 },
];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  demoPill: {
    position: 'absolute',
    alignSelf: 'center',
    left: 72,
    right: 72,
    alignItems: 'center',
  },
  demoPillText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryInk,
    backgroundColor: colors.softYellow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryDark,
    overflow: 'hidden',
    textAlign: 'center',
  },
  locateBtn: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  controlPressed: {
    opacity: 0.85,
  },
  markerBadge: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  riderBadge: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
