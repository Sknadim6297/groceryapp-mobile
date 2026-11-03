export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type DeliveryMapHandle = {
  animateToRegion: (region: MapRegion, duration: number) => void;
};
