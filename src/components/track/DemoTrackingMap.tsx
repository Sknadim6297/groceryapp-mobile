import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, G, Path, Rect, LinearGradient, Stop } from 'react-native-svg';

import { AppIcon } from '@/components/ui/AppIcon';
import { brandLogo } from '@/constants/brand';
import { colors, fonts } from '@/constants/theme';
import { pointAlongRoute, splitRouteAtProgress } from '@/data/demoOrderTracking';
import type { DemoMapPoint, DemoOrderTracking } from '@/types/orderTracking';

type DemoTrackingMapProps = {
  tracking: DemoOrderTracking;
};

const MIN_ZOOM = 0.9;
const MAX_ZOOM = 1.85;
const ZOOM_STEP = 0.18;

export function DemoTrackingMap({ tracking }: DemoTrackingMapProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1.15);

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
  const offsetX = layout.width / 2 - ((rider.x + tracking.delivery.x) / 2) * fit;
  const offsetY = layout.height / 2 - ((rider.y + tracking.store.y) / 2) * fit;

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  }

  function zoomIn() {
    setZoom((value) => Math.min(MAX_ZOOM, Number((value + ZOOM_STEP).toFixed(2))));
  }

  function zoomOut() {
    setZoom((value) => Math.max(MIN_ZOOM, Number((value - ZOOM_STEP).toFixed(2))));
  }

  function recenter() {
    setZoom(1.15);
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
            <Rect x={0} y={0} width={mapW} height={mapH} fill="#F1F5F9" />
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
            <Path d={polylinePath(completed)} stroke="#F59E0B" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d={polylinePath(remaining)} stroke="#16A34A" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d={polylinePath(completed)} stroke="#FDE68A" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d={polylinePath(remaining)} stroke="#86EFAC" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

            <MarkerCircle cx={tracking.store.x} cy={tracking.store.y} fill={colors.primary} />
            <MarkerCircle cx={tracking.delivery.x} cy={tracking.delivery.y} fill="#16A34A" />
            <Circle cx={rider.x} cy={rider.y} r={18} fill={colors.white} stroke="#16A34A" strokeWidth={6} />
            <Circle cx={rider.x} cy={rider.y} r={7} fill="#16A34A" />
          </G>
        </Svg>
      ) : null}

      {/* Marker icons layered in RN coords for crisp Lucide icons */}
      {layout.width > 0 ? (
        <>
          <MapIconBadge
            x={tracking.store.x * fit + offsetX}
            y={tracking.store.y * fit + offsetY}
            bg={colors.primary}
            icon="shop"
            iconColor={colors.text}
          />
          <MapIconBadge
            x={tracking.delivery.x * fit + offsetX}
            y={tracking.delivery.y * fit + offsetY}
            bg="#16A34A"
            icon="home"
            iconColor={colors.white}
          />
          <View
            pointerEvents="none"
            style={[
              styles.etaBubble,
              {
                left: rider.x * fit + offsetX - 62,
                top: rider.y * fit + offsetY - 58,
              },
            ]}>
            <AppIcon name="bike" color="#4ADE80" size={14} />
            <Text style={styles.etaBubbleText}>{tracking.etaMinutes} min away</Text>
          </View>
        </>
      ) : null}

      <View style={styles.brand} pointerEvents="none">
        <Image source={brandLogo} style={styles.brandLogo} contentFit="contain" />
      </View>

      <View style={styles.demoPill} pointerEvents="none">
        <Text style={styles.demoPillText}>Demo Tracking</Text>
      </View>

      <View style={styles.controls}>
        <MapControl accessibilityLabel="Zoom in" icon="plus" onPress={zoomIn} testID="map-zoom-in" />
        <MapControl accessibilityLabel="Zoom out" icon="minus" onPress={zoomOut} testID="map-zoom-out" />
        <MapControl accessibilityLabel="Recenter map" icon="crosshair" onPress={recenter} testID="map-recenter" />
      </View>
    </View>
  );
}

function MapControl({
  icon,
  onPress,
  accessibilityLabel,
  testID,
}: {
  icon: 'plus' | 'minus' | 'crosshair';
  onPress: () => void;
  accessibilityLabel: string;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.control, pressed && styles.controlPressed]}
      testID={testID}>
      <AppIcon name={icon} color={colors.text} size={18} />
    </Pressable>
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
      <Circle cx={cx} cy={cy} r={28} fill={colors.white} opacity={0.9} />
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
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  brand: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  brandLogo: {
    width: 30,
    height: 30,
  },
  demoPill: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    left: 70,
    right: 70,
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
  },
  controls: {
    position: 'absolute',
    right: 12,
    top: '28%',
    gap: 8,
  },
  control: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  etaBubble: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    minWidth: 124,
    justifyContent: 'center',
  },
  etaBubbleText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.white,
  },
});
