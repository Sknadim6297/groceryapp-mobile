import { Camera, CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { brandLogo } from '@/constants/brand';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { parseQrPayload, type ParsedQrResult } from '@/utils/qrScanResult';

const FRAME = 260;

export default function ScanQrScreen() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { showToast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<ParsedQrResult | null>(null);
  const lockRef = useRef(false);
  const [lineAnim] = useState(() => new Animated.Value(0));

  const cameraActive = focused && scanning && !result && Platform.OS !== 'web';

  useEffect(() => {
    if (!cameraActive) {
      lineAnim.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cameraActive, lineAnim]);

  const handleBarcode = useCallback(
    (scan: BarcodeScanningResult) => {
      if (!scanning || lockRef.current || result) {
        return;
      }
      const data = typeof scan.data === 'string' ? scan.data.trim() : '';
      if (!data) {
        return;
      }
      lockRef.current = true;
      setScanning(false);
      setTorch(false);
      setResult(parseQrPayload(data));
    },
    [result, scanning],
  );

  const scanAgain = useCallback(() => {
    lockRef.current = false;
    setResult(null);
    setScanning(true);
  }, []);

  const openGallery = useCallback(async () => {
    if (Platform.OS === 'web') {
      showToast('info', 'Gallery QR scan is not available on web.');
      return;
    }
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast('warning', 'Photo library permission is required to pick a QR image.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: false,
    });
    if (picked.canceled || !picked.assets[0]?.uri) {
      return;
    }
    try {
      const codes = await Camera.scanFromURLAsync(picked.assets[0].uri, ['qr']);
      const data = codes[0]?.data?.trim();
      if (!data) {
        showToast('warning', 'No QR code found in that image.');
        return;
      }
      lockRef.current = true;
      setScanning(false);
      setTorch(false);
      setResult(parseQrPayload(data));
    } catch {
      showToast('error', 'Could not read a QR code from that image.');
    }
  }, [showToast]);

  const lineTranslate = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, FRAME - 24],
  });

  return (
    <View style={styles.screen} testID="scan-qr-screen">
      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />

      <AppScreenHeader
        title="Scan QR Code"
        fallbackHref="/home"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pick QR from gallery"
            onPress={() => {
              void openGallery();
            }}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            testID="scan-qr-gallery">
            <AppIcon name="image" color={colors.text} size={20} />
          </Pressable>
        }
      />

      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Image source={brandLogo} style={styles.logo} contentFit="contain" accessibilityLabel="Mayapur Bazaar" />
        <Text style={styles.headline}>Scan QR Code</Text>
        <Text style={styles.subtitle}>
          Align the QR code within the frame to scan and access offers, payments or details
        </Text>

        {Platform.OS === 'web' ? (
          <UnsupportedWeb />
        ) : !permission ? (
          <View style={styles.centerBox}>
            <Text style={styles.statusText}>Checking camera permission…</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centerBox}>
            <Text style={styles.statusText}>Camera access is needed to scan QR codes.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Allow camera access"
              onPress={() => {
                void requestPermission();
              }}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              testID="scan-qr-request-permission">
              <Text style={styles.primaryLabel}>Allow Camera</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.frameWrap}>
              {cameraActive ? (
                <CameraView
                  style={styles.camera}
                  facing="back"
                  enableTorch={torch && cameraActive}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={handleBarcode}
                  testID="scan-qr-camera"
                />
              ) : (
                <View style={[styles.camera, styles.cameraPaused]}>
                  <AppIcon name="scan" color={colors.textSecondary} size={48} />
                  <Text style={styles.pausedLabel}>{result ? 'Scan paused' : 'Camera paused'}</Text>
                </View>
              )}

              <View style={styles.frameOverlay} pointerEvents="none">
                <Corner position="tl" />
                <Corner position="tr" />
                <Corner position="bl" />
                <Corner position="br" />
                {cameraActive ? (
                  <Animated.View
                    style={[styles.scanLine, { transform: [{ translateY: lineTranslate }] }]}
                  />
                ) : null}
              </View>
            </View>

            <View style={styles.statusPill}>
              <AppIcon name="scan" color={colors.text} size={14} />
              <Text style={styles.statusPillText}>
                {scanning && focused ? 'Scanning the QR Code...' : 'Scanner idle'}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={torch ? 'Turn off flash' : 'Turn on flash'}
              accessibilityState={{ disabled: !cameraActive }}
              disabled={!cameraActive}
              onPress={() => setTorch((value) => !value)}
              style={({ pressed }) => [
                styles.flashBtn,
                !cameraActive && styles.flashDisabled,
                pressed && cameraActive && styles.pressed,
              ]}
              testID="scan-qr-torch">
              <AppIcon name="flashlight" color={colors.text} size={18} />
              <Text style={styles.flashLabel}>{torch ? 'Turn Off Flash' : 'Turn On Flash'}</Text>
            </Pressable>
          </>
        )}
      </View>

      <Modal visible={result !== null} transparent animationType="fade" onRequestClose={scanAgain}>
        <View style={styles.modalRoot}>
          <View style={[styles.resultCard, { marginBottom: Math.max(insets.bottom, 16) }]} testID="scan-qr-result">
            <Text style={styles.resultTitle}>{result?.title}</Text>
            <Text style={styles.resultDetail}>{result?.detail}</Text>
            {result?.raw ? (
              <Text style={styles.resultRaw} numberOfLines={4}>
                {result.raw}
              </Text>
            ) : null}
            <View style={styles.resultActions}>
              {result?.canNavigate && result.href ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open result"
                  onPress={() => {
                    if (result.href) {
                      router.push(result.href);
                    }
                  }}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  testID="scan-qr-open-result">
                  <Text style={styles.primaryLabel}>Open</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Scan again"
                onPress={scanAgain}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                testID="scan-qr-again">
                <Text style={styles.secondaryLabel}>Scan Again</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
                style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}>
                <Text style={styles.linkLabel}>Back</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function UnsupportedWeb() {
  return (
    <View style={styles.centerBox} testID="scan-qr-web-unsupported">
      <AppIcon name="scan" color={colors.textSecondary} size={40} />
      <Text style={styles.statusText}>
        QR camera scanning is not available in the web browser. Open Mayapur Bazaar on an Android or
        iOS device to scan.
      </Text>
    </View>
  );
}

function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <View
      style={[
        styles.corner,
        position === 'tl' && styles.cornerTl,
        position === 'tr' && styles.cornerTr,
        position === 'bl' && styles.cornerBl,
        position === 'br' && styles.cornerBr,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  blobTop: {
    position: 'absolute',
    top: -40,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FEF3C7',
    opacity: 0.7,
  },
  blobBottom: {
    position: 'absolute',
    right: -60,
    bottom: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FEF9C3',
    opacity: 0.8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 12,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 10,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  frameWrap: {
    width: FRAME,
    height: FRAME,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  cameraPaused: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E2E8F0',
  },
  pausedLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  frameOverlay: {
    ...StyleSheet.absoluteFill,
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: colors.primary,
  },
  cornerTl: {
    top: 10,
    left: 10,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 10,
  },
  cornerTr: {
    top: 10,
    right: 10,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 10,
  },
  cornerBl: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 10,
  },
  cornerBr: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  statusPill: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.softYellow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusPillText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text,
  },
  flashBtn: {
    marginTop: 'auto',
    marginBottom: 8,
    minHeight: 52,
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#FFFBEB',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  flashDisabled: {
    opacity: 0.5,
  },
  flashLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 16,
  },
  statusText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 160,
  },
  primaryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  secondaryBtn: {
    backgroundColor: colors.softBackground,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  secondaryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  resultTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  resultDetail: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  resultRaw: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
    backgroundColor: colors.softYellow,
    borderRadius: 10,
    padding: 10,
    overflow: 'hidden',
  },
  resultActions: {
    gap: 8,
    marginTop: 6,
  },
  pressed: {
    opacity: 0.85,
  },
});
