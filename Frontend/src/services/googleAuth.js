import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      '478377181309-p6ec1uikv47advfemosmis47pcm4osg0.apps.googleusercontent.com',
    iosClientId:
      '478377181309-p6ec1uikv47advfemosmis47pcm4osg0.apps.googleusercontent.com',
    androidClientId:
      '478377181309-p6ec1uikv47advfemosmis47pcm4osg0.apps.googleusercontent.com',
    webClientId:
      '478377181309-p6ec1uikv47advfemosmis47pcm4osg0.apps.googleusercontent.com',

    scopes: ['profile', 'email'],
  });

  const handleGoogleSignIn = async () => {
    try {
      const result = await promptAsync();

      console.log('🔥 GOOGLE RESULT:', result);

      if (result?.type === 'success') {
        const { authentication } = result;

        if (!authentication?.accessToken) {
          console.log('❌ No access token');
          return null;
        }

        const credential = GoogleAuthProvider.credential(
          authentication.accessToken
        );

        const userCredential = await signInWithCredential(
          auth,
          credential
        );

        console.log('🔥 FIREBASE USER:', userCredential.user);

        return userCredential.user;
      }

      return null;
    } catch (error) {
      console.log('🔥 GOOGLE LOGIN ERROR:', error);
      return null;
    }
  };

  return {
    request,
    handleGoogleSignIn,
  };
};