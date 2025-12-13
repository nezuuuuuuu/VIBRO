import React, { useEffect, useState } from 'react';
import { 
  View, 
  ActivityIndicator, 
  Platform, 
  StatusBar, 
  PermissionsAndroid 
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Torch from 'react-native-torch'; // <--- USING TORCH FOR FLASH
import notifee, { 
  AndroidImportance, 
  EventType 
} from '@notifee/react-native';

import Welcome from './src/screens/(welcome)/index';
import Signup from './src/screens/(auth)/signup';
import Login from './src/screens/(auth)';
import OTPVerification from './src/screens/(auth)/otpverification';
import Tabs from './src/components/mainNavigator';
import { useAuthStore } from "./store/authStore";

const Stack = createNativeStackNavigator();

if (Platform.OS === 'android') {
  notifee.createChannel({
    id: 'sound-alerts1',
    name: 'Sound Alerts (Low)',
    importance: AndroidImportance.MIN,
    vibration: true,
    sound: 'default',
  });

  notifee.createChannel({
    id: 'sound-alerts2',
    name: 'Sound Alerts (Default)',
    importance: AndroidImportance.DEFAULT,
    vibration: true,
    sound: 'default',
  });

  notifee.createChannel({
    id: 'sound-alerts3',
    name: 'Sound Alerts (High)',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'default',
  });

  notifee.createChannel({
    id: 'chat-alerts-v2',
    name: 'Chat Alerts',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'default',
  });
}

export default function App() {
  const { checkAuth, user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    return () => {
      try {
        Torch.switchState(false);
      } catch (e) {
        console.log("Torch cleanup error", e);
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true;
    
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Flashlight Permission',
          message: 'VIBRO needs access to your camera to blink the flashlight for alerts.',
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

  const startBlinkSequence = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      // Blink Pattern: ON -> 150ms -> OFF -> 150ms -> ON -> 150ms -> OFF
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
      
    } catch (e) {
      console.log("Torch Error:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.DELIVERED || type === EventType.PRESSED) {
        console.log("Notification received! Triggering Flash...");
        startBlinkSequence();
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }


  return (
    <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user || !token ? (
            <>
              <Stack.Screen name="Welcome" component={Welcome} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Signup" component={Signup} />
              <Stack.Screen name="OTPVerification" component={OTPVerification} />
            </>
          ) : (
            <Stack.Screen name="Tabs" component={Tabs} />
          )}
        </Stack.Navigator>
        <StatusBar className='bg-primary' />
    </NavigationContainer>
  );
}