/**
 * Default / TypeScript entry. Metro swaps this for `.native` / `.web` at bundle time.
 * Keep the web fallback here so SSR and typecheck never load react-native-maps native.
 */
export { DeliveryMap } from './DeliveryMap.web';
