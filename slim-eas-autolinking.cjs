/**
 * EAS `eas-build-pre-install` hook for the client-apk profile.
 * Expo modules (e.g. expo-camera) ignore react-native.config.js — exclude them here.
 */
const fs = require('fs');
const path = require('path');

const profile = process.env.EAS_BUILD_PROFILE || '';
if (profile !== 'client-apk' && process.env.EXPO_PUBLIC_UI_PREVIEW !== 'ui-preview') {
  process.exit(0);
}

const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const exclude = [
  'expo-camera',
  'expo-dev-client',
  'expo-updates',
  'expo-glass-effect',
  'react-native-maps',
  'react-native-cashfree-pg-sdk',
  '@pushpendersingh/react-native-otp-verify',
];

pkg.expo = pkg.expo || {};
pkg.expo.autolinking = pkg.expo.autolinking || {};
const android = pkg.expo.autolinking.android || {};
const current = Array.isArray(android.exclude) ? android.exclude : [];
android.exclude = Array.from(new Set([...current, ...exclude]));
pkg.expo.autolinking.android = android;

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(
  `[slim-eas-autolinking] profile=${profile} android.exclude=${android.exclude.join(', ')}`,
);
