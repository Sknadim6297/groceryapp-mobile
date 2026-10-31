import { Image, type ImageSource, type ImageStyle } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp } from 'react-native';

type CatalogImageProps = {
  source: ImageSource;
  style: StyleProp<ImageStyle>;
  label?: string;
};

export function CatalogImage({ source, style, label }: CatalogImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const remote = isRemote(source);

  if (failed) {
    return (
      <View
        style={[style, styles.fallback]}
        accessibilityRole="image"
        accessibilityLabel={label ? `${label}. Image unavailable.` : 'Image unavailable.'}
      />
    );
  }

  return (
    <Image
      source={source}
      style={[style, remote && !loaded ? styles.loading : null]}
      contentFit="contain"
      cachePolicy="memory-disk"
      recyclingKey={remote ? source.uri : undefined}
      transition={120}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      accessible={Boolean(label)}
      accessibilityLabel={label}
    />
  );
}

function isRemote(source: ImageSource): source is { uri: string } {
  return typeof source === 'object' && source != null && 'uri' in source && typeof source.uri === 'string';
}

const styles = StyleSheet.create({
  loading: {
    backgroundColor: '#F3F5F7',
  },
  fallback: {
    backgroundColor: '#F3F5F7',
  },
});
