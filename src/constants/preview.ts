import Constants from 'expo-constants';

const PREVIEW_PROFILE = 'ui-preview';
const PREVIEW_ANDROID_PACKAGE = 'com.groceryapp.uipreview';

const previewFlag = process.env.EXPO_PUBLIC_UI_PREVIEW;
const previewPackage = Constants.expoConfig?.android?.package === PREVIEW_ANDROID_PACKAGE;
const previewExtra = Constants.expoConfig?.extra?.uiPreview === true;

/**
 * The internal APK is a release bundle, so `__DEV__` is false there.
 * Preview turns on only when the ui-preview profile inlines this exact flag,
 * the Android package is the preview id, and the embedded config marks the build as preview.
 * A missing or different value stays off.
 * Local Metro can still preview while `__DEV__` is true, unless the flag is explicitly "off".
 * This does not create a session, token, or customer record.
 */
export const UI_PREVIEW_MODE =
  (previewFlag === PREVIEW_PROFILE && previewPackage && previewExtra) ||
  (typeof __DEV__ !== 'undefined' && __DEV__ === true && previewFlag !== 'off');
