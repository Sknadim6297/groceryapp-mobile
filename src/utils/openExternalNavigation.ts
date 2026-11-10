import { Linking, Platform } from 'react-native';

/**
 * Open turn-by-turn navigation to exact saved coordinates.
 * Prefers Google Maps URL schemes; falls back to geo: / Apple Maps / web.
 * Does not invent routes, ETA, or distances.
 */
export async function openExternalNavigation(options: {
  latitude: number;
  longitude: number;
  label?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { latitude, longitude, label } = options;
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return { ok: false, message: 'Invalid destination coordinates.' };
  }

  const lat = latitude.toFixed(6);
  const lng = longitude.toFixed(6);
  const q = encodeURIComponent(label?.trim() || `${lat},${lng}`);

  const candidates =
    Platform.OS === 'ios'
      ? [
          `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
          `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
          `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        ]
      : [
          `google.navigation:q=${lat},${lng}`,
          `geo:${lat},${lng}?q=${lat},${lng}(${q})`,
          `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        ];

  for (const url of candidates) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        continue;
      }
      await Linking.openURL(url);
      return { ok: true };
    } catch {
      // try next candidate
    }
  }

  try {
    await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: 'Could not open Maps. Install Google Maps or check your browser.',
    };
  }
}
