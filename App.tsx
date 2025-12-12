// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import Welcome from './src/screens/(welcome)/index';
// import AuthScreen from './src/screens/(auth)';
// import Tabs from './src/components/mainNavigator';
// import { useAuthStore } from "./store/authStore";
// import { View, ActivityIndicator, Platform, Image, StatusBar, Alert } from 'react-native';
// import Signup from './src/screens/(auth)/signup';
// import Login from './src/screens/(auth)';
// import OTPVerification from './src/screens/(auth)/otpverification';
// import notifee, { AndroidColor, AndroidImportance } from '@notifee/react-native';


// const Stack = createNativeStackNavigator();


// // Notifee Setup
// if (Platform.OS === 'android') {
//   const androidVersion = Platform.Version;
//   const hasLedSupport = androidVersion >= 26; // Android 8.0 (Oreo)

//   notifee.createChannel({
//     id: 'sound-alerts1',
//     name: 'Sound Alerts',
//     description: 'Notifications for detected sounds',
//     importance: AndroidImportance.MIN,
//     vibration: true,
//     vibrationPattern: [300, 500],
//     sound: 'default',
//   });

//   notifee.createChannel({
//     id: 'sound-alerts2',
//     name: 'Sound Alerts',
//     description: 'Notifications for detected sounds',
//     importance: AndroidImportance.DEFAULT,
//     vibration: true,
//     vibrationPattern: [300, 500, 700, 900],
//     ...(hasLedSupport && {
//       lights: true,
//       lightColor: '#FF0000',
//     }),
//     sound: 'default',
//   });

//   notifee.createChannel({
//     id: 'sound-alerts3',
//     name: 'Sound Alerts',
//     description: 'Notifications for detected sounds',
//     importance: AndroidImportance.HIGH,
//     vibration: true,
//     vibrationPattern: [300, 500, 700, 900, 1100, 1300, 1500, 1700, 1900, 2100],
//     ...(hasLedSupport && {
//       lights: true,
//       lightColor: '#FF0000',
//     }),
//     sound: 'default',
//   });

//   notifee.createChannel({
//     id: 'chat-alerts-v2',
//     name: 'Chat Alerts',
//     description: 'Notifications for new messages',
//     importance: AndroidImportance.HIGH,
//     vibration: true,
//     vibrationPattern: [ 100,700],
//     ...(hasLedSupport && {
//       lights: true,
//       lightColor: '#FF0000',
//     }),
//     sound: 'default',
//   });
// }


// export default function App() {



//   const { checkAuth, user, token } = useAuthStore();
//   const [loading, setLoading] = useState(true);
//   const [isOfflineMode, setIsOfflineMode] = useState(false); 

//   useEffect(() => {


//     const init = async () => {
//       await checkAuth();  // fetches and sets user/token
//       setLoading(false);  // only show UI after auth is checked
//     };
//     init();
 
//   }, []);

  
//   if (loading) {
//     return (
//       <View className="flex-1 justify-center items-center">
//         <ActivityIndicator size="large" color="#0000ff" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//         <Stack.Navigator screenOptions={{ headerShown: false }}>
//           {!user || !token ? (
//             <>
//               <Stack.Screen name="Welcome" component={Welcome} />
//               <Stack.Screen name="Login" component={Login} />
//               <Stack.Screen name="Signup" component={Signup} />
//               <Stack.Screen name="OTPVerification" component={OTPVerification} />
//             </>
//           ) : (
//             <Stack.Screen name="Tabs" component={Tabs} />
//           )}
//         </Stack.Navigator>
//         <StatusBar className='bg-primary' />
//     </NavigationContainer>
//   );
// }

import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Button,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import Torch from 'react-native-torch';

const FlashNotification = () => {
  
  // Clean up: Ensure torch is OFF when leaving the screen
  useEffect(() => {
    return () => {
      Torch.switchState(false);
    };
  }, []);

  const handleFlash = async () => {
    // 1. Check Permissions (Android Only)
    if (Platform.OS === 'android') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;
    }

    // 2. Trigger the blink pattern
    blinkSequence();
  };

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Flashlight Permission',
          message: 'App needs access to your camera to blink the flashlight.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const blinkSequence = () => {
    // Blink Pattern: ON -> 150ms -> OFF -> 150ms -> ON -> 150ms -> OFF
    
    // First Flash
    Torch.switchState(true);
    
    setTimeout(() => {
      Torch.switchState(false); // Off

      setTimeout(() => {
        Torch.switchState(true); // Second Flash

        setTimeout(() => {
          Torch.switchState(false); // Final Off
        }, 150);
        
      }, 150);

    }, 150);
  };

  return (
    <View style={styles.container}>
      <Button 
        title="Test Flash Notification" 
        onPress={handleFlash} 
        color="#841584"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default FlashNotification;
