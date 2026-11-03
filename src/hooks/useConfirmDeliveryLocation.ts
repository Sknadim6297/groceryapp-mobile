import { router } from 'expo-router';
import { useCallback, useRef } from 'react';

import { useToast } from '@/components/ui/AppToast';
import { useAuthFlow } from '@/context/AuthFlowContext';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCustomerAccount } from '@/context/CustomerAccountContext';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useProfileDraft } from '@/context/ProfileDraftContext';
import { locationContinueTarget, resolveLocationExitHref } from '@/navigation/locationFlow';
import { addressFormSelectHref, locationRoutes } from '@/navigation/locationRoutes';
import { ALREADY_REGISTERED_LOGIN_MESSAGE } from '@/navigation/alreadyRegisteredRecovery';
import { canUseDevelopmentHome, isDevOtpEnabled, promoteDevTestSessionToHome } from '@/services/devOtp';
import { clearMobileOtpVerification } from '@/services/mobileVerificationStore';
import { isProfileNameReady, submitRegistrationThenOtp } from '@/services/registrationSubmission';
import type { DeliveryLocation } from '@/types/location';

/**
 * Shared Set Location / Done handler for search → map confirmation.
 * Routes by caller: address-book form, registration submit, or signed-in change.
 *
 * Never uses router.back() after confirm — that reopened /location (search) when the
 * stack was Home → search → map.
 */
export function useConfirmDeliveryLocation() {
  const { showToast } = useToast();
  const leaving = useRef(false);
  const submitting = useRef(false);
  const {
    applyConfirmed,
    locationIntent,
    returnTo,
    addressBookPick,
    addressBookSelectMode,
    completeAddressBookPick,
    consumeReturnTo,
    clearDelivery,
  } = useDeliveryLocation();
  const { standing, nationalNumber, setStanding, setOtpDispatched, mobileVerification, setMobileVerification } =
    useAuthFlow();
  const { session, devSession, signIn, keepDevelopmentLogin, clearAuthSession } = useAuthSession();
  const { setAccount } = useCustomerAccount();
  const draft = useProfileDraft();

  const leavePickerTo = useCallback((href: ReturnType<typeof resolveLocationExitHref>) => {
    consumeReturnTo();
    // Dismiss search + map (and any intermediate pickers) until the caller is visible.
    router.dismissTo(href);
  }, [consumeReturnTo]);

  const confirmLocation = useCallback(
    async (location: DeliveryLocation) => {
      if (leaving.current || submitting.current) {
        return;
      }
      leaving.current = true;

      // Address-book / checkout “add address”: keep coordinates on the form draft.
      if (addressBookPick) {
        completeAddressBookPick(location);
        applyConfirmed(location);
        const formHref = addressBookSelectMode ? addressFormSelectHref() : locationRoutes.addressForm;
        consumeReturnTo();
        router.dismissTo(formHref);
        leaving.current = false;
        return;
      }

      applyConfirmed(location);

      const signedIn = Boolean(session) || canUseDevelopmentHome(devSession);
      const onboarding =
        locationIntent === 'registration' ||
        standing === 'unregistered' ||
        (isDevOtpEnabled() && devSession?.destination === 'complete-profile');
      const profileNameReady = isProfileNameReady(draft.fullName);
      const target = locationContinueTarget({
        intent: locationIntent,
        canGoBack: router.canGoBack(),
        signedIn,
        onboarding,
        profileNameReady,
      });

      if (target === 'submit-registration') {
        submitting.current = true;
        try {
          const result = await submitRegistrationThenOtp({
            mobile: nationalNumber,
            name: draft.fullName,
            email: draft.email,
            dateOfBirth: draft.dateOfBirth,
            location,
            mobileVerification,
          });

          if (!result.ok) {
            if (result.reason === 'already-registered') {
              showToast('info', ALREADY_REGISTERED_LOGIN_MESSAGE);
              setStanding('registered');
              setOtpDispatched(false);
              setMobileVerification(null);
              void clearMobileOtpVerification();
              clearAuthSession();
              draft.clearDraft();
              clearDelivery();
              router.replace('/login');
              return;
            }
            showToast('error', result.message);
            leaving.current = false;
            return;
          }

          if (result.customer) {
            setAccount(result.customer);
          }
          setStanding('registered');
          showToast('success', result.message);

          if (result.next === 'home' && isDevOtpEnabled()) {
            promoteDevTestSessionToHome(nationalNumber);
            const saved = await keepDevelopmentLogin();
            if (!saved) {
              showToast('warning', 'This development sign-in could not be saved on this device.');
              leaving.current = false;
              return;
            }
            setMobileVerification(null);
            void clearMobileOtpVerification();
            leavePickerTo('/home');
            return;
          }

          if (result.next === 'home' && result.temporaryLogin) {
            const saved = await signIn(result.temporaryLogin);
            if (!saved) {
              showToast('warning', 'Registration succeeded, but this sign-in could not be saved on this device.');
              leaving.current = false;
              return;
            }
            setMobileVerification(null);
            void clearMobileOtpVerification();
            leavePickerTo('/home');
            return;
          }

          setOtpDispatched(true);
          consumeReturnTo();
          router.replace('/otp');
        } finally {
          submitting.current = false;
          leaving.current = false;
        }
        return;
      }

      if (target === 'caller') {
        leavePickerTo(resolveLocationExitHref(returnTo, '/home'));
        leaving.current = false;
        return;
      }

      if (target === '/complete-profile') {
        leavePickerTo('/complete-profile');
        leaving.current = false;
        return;
      }

      // '/home' — never fall back to location search.
      leavePickerTo('/home');
      leaving.current = false;
    },
    [
      addressBookPick,
      addressBookSelectMode,
      applyConfirmed,
      clearAuthSession,
      clearDelivery,
      completeAddressBookPick,
      consumeReturnTo,
      draft,
      keepDevelopmentLogin,
      leavePickerTo,
      locationIntent,
      mobileVerification,
      nationalNumber,
      returnTo,
      session,
      setAccount,
      setMobileVerification,
      setOtpDispatched,
      setStanding,
      showToast,
      signIn,
      standing,
      devSession,
    ],
  );

  return { confirmLocation, isBusy: () => leaving.current || submitting.current };
}
