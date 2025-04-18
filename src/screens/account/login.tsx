import React, { useState, useEffect } from 'react';
import { View, Text, Alert, SafeAreaView } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Button } from 'react-native';
import auth from '@react-native-firebase/auth';
import MainNavigator from '../../components/mainNavigator';

const Login = () => {
  const [user, setUser] = useState<auth.User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual web client ID
    });

    const subscriber = auth().onAuthStateChanged((authUser) => {
      setUser(authUser);
      if (initializing) setInitializing(false);
    });

    return subscriber; // unsubscribe on unmount
  }, []);

  async function onGoogleButtonPress() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('Signing in with Google...');
      const { idToken } = await GoogleSignin.signIn();

      if (!idToken) {
        throw new Error('No ID token found');
      }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      return auth().signInWithCredential(googleCredential);
    } catch (error: any) {
      console.log('Error signing in with Google', error);
      Alert.alert('Google Sign-In Error', error.message);
    }
  }

  if (initializing) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <Text className="text-white text-lg">Loading...</Text>
      </View>
    );
  }

  if (user) {
    // User is logged in, render the MainNavigator
    return <MainNavigator />;
  }

  // User is not logged in, render the login screen
  return (
    <SafeAreaView className="h-full bg-primary">
      <View className="h-full w-full flex items-center pt-60 bg-primary">
        <Text className="text-white font-bold text-5xl">VIBRO</Text>
        <Text className="text-white ">Feel the Sound</Text>

        <View className="pt-60 w-full flex items-center justify-center">
          <Button
            title="Join for free"
            onPress={() => onGoogleButtonPress().then(() => console.log('Signed in with Google!'))}
          />

          <Button
            title="Google Sign-In"
            onPress={onGoogleButtonPress}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;