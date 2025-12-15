import React, { useState, useEffect } from 'react';
import { View, Text, Alert, SafeAreaView } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Button } from 'react-native';
import auth from '@react-native-firebase/auth';
import MainNavigator from '../../components/mainNavigator';

const Login = () => {
  const [user, setUser] = useState<auth.User | null>(null);
  const [initializing, setInitializing] = useState(true);
  let idToken = undefined;
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '654329737878-frulfj5lng0f8rpa0viom1hh49vdk8gk.apps.googleusercontent.com', // Replace with your actual web client ID
    });

    const subscriber = auth().onAuthStateChanged((authUser) => {
      setUser(authUser);
      if (initializing) setInitializing(false);
    });

    return subscriber; // unsubscribe on unmount
  }, []);

  async function onGoogleButtonPress() {
    try {
      const signInResult = await GoogleSignin.signIn();
      idToken = signInResult.data?.idToken;


      if (!idToken) {
        console.log(user);

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
    console.log('User is logged in:', user.toJSON()); 
    return <MainNavigator />;
  }

  // User is not logged in, render the login screen
//   const toNavigation = () => {
//     return <MainNavigator  />;
// }
  return (
    <SafeAreaView className="h-full bg-primary">
      <View className="h-full w-full flex items-center pt-60 bg-primary">
        <Text className="text-white font-bold text-5xl">VIBRO</Text>
        <Text className="text-white ">Feel the Sound</Text>

        <View className="pt-60 w-full flex items-center justify-center">
          <Button
            title="Join for free"
            onPress={() => onGoogleButtonPress().then(() => console.log('Signed in with Google!'))}
            // onPress={toNavigation}

          />

          <Button
            title="Google Sign-In"
            // onPress={onGoogleButtonPress}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;