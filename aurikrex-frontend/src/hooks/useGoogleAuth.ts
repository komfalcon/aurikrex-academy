import { useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import { Alert } from 'react-native';

const SCHEME = 'falcon-focus';
const AUTH_CALLBACK_PATH = 'auth/callback';

const useGoogleAuth = () => {
  let redirectUri = '';
  let initError: unknown = null;

  try {
    redirectUri = AuthSession.makeRedirectUri({
      scheme: SCHEME,
      path: AUTH_CALLBACK_PATH,
    });
  } catch (error) {
    console.error('[GoogleAuth] Failed to initialize:', error);
    initError = error;
  }

  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    if (initError) {
      Alert.alert('Google Sign In unavailable', 'Please use email sign in instead.');
      return;
    }

    try {
      setIsLoading(true);

      const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        Alert.alert('Configuration Error', 'Google Client ID is not configured.');
        return;
      }

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('profile email')}` +
        `&access_type=offline` +
        `&prompt=consent`;

      const result = await AuthSession.startAsync({ authUrl });

      if (result.type === 'success') {
        return result.params;
      }
    } catch (error) {
      console.error('[GoogleAuth] Sign in failed:', error);
      Alert.alert('Sign In Failed', 'An error occurred during Google sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    isLoading,
    redirectUri,
  };
};

export default useGoogleAuth;
