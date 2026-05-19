// Future Google OAuth integration stub (Pure MongoDB + JWT version)
export const useGoogleAuth = () => {
  const handleGoogleSignIn = async () => {
    console.log('[Google Auth] Stub called. OAuth is temporarily disabled in pure JWT configuration.');
    return null;
  };

  return {
    request: null,
    handleGoogleSignIn,
  };
};