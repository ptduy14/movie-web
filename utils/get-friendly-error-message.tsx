/**
 * Maps a Firebase Auth error code to a key in the i18n `errors.*` namespace.
 *
 * Caller pattern (client component):
 *   const tErr = useTranslations('errors');
 *   toast.error(tErr(getFriendlyErrorMessage(error.code)));
 *
 * Returning a key (rather than a translated string) keeps this util pure /
 * server-safe and lets each caller scope its translator however it wants.
 */
export default function getFriendlyErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
      return 'invalidCredentials';
    case 'auth/user-not-found':
      return 'userNotFound';
    case 'auth/wrong-password':
      return 'wrongPassword';
    case 'auth/email-already-in-use':
      return 'emailInUse';
    case 'auth/invalid-email':
      return 'invalidEmail';
    default:
      return 'default';
  }
}
