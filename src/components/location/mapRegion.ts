export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type DeliveryMapHandle = {
  animateToRegion: (region: MapRegion, duration: number) => void;
};

/** Approximate Mercator zoom from a latitude span (matches prior react-native-maps usage). */
export function zoomFromLatitudeDelta(latitudeDelta: number): number {
  const safe = Math.max(latitudeDelta, 1e-6);
  return Math.min(20, Math.max(1, Math.log2(360 / safe)));
}

export function latitudeDeltaFromZoom(zoom: number): number {
  const safeZoom = Number.isFinite(zoom) ? zoom : 14;
  return 360 / 2 ** Math.min(20, Math.max(1, safeZoom));
}
