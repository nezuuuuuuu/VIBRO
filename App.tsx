import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Welcome from './src/screens/(welcome)/index';
import AuthScreen from './src/screens/(auth)';
import Tabs from './src/components/mainNavigator';
import { useAuthStore } from "./store/authStore";
import { View, ActivityIndicator, Platform, Image } from 'react-native';
import Signup from './src/screens/(auth)/signup';
import Login from './src/screens/(auth)';
import notifee, { AndroidColor, AndroidImportance } from '@notifee/react-native';


const Stack = createNativeStackNavigator();


// 🔔 Notifee Setup
if (Platform.OS === 'android') {
  const androidVersion = Platform.Version;
  const hasLedSupport = androidVersion >= 26; // Android 8.0 (Oreo)

  notifee.createChannel({
    id: 'sound-alerts1',
    name: 'Sound Alerts',
    description: 'Notifications for detected sounds',
    importance: AndroidImportance.MIN,
    vibration: true,
    vibrationPattern: [300, 500],
    sound: 'default',
  });

  notifee.createChannel({
    id: 'sound-alerts2',
    name: 'Sound Alerts',
    description: 'Notifications for detected sounds',
    importance: AndroidImportance.DEFAULT,
    vibration: true,
    vibrationPattern: [300, 500, 700, 900],
    ...(hasLedSupport && {
      lights: true,
      lightColor: '#FF0000',
    }),
    sound: 'default',
  });

  notifee.createChannel({
    id: 'sound-alerts3',
    name: 'Sound Alerts',
    description: 'Notifications for detected sounds',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [300, 500, 700, 900, 1100, 1300, 1500, 1700, 1900, 2100],
    ...(hasLedSupport && {
      lights: true,
      lightColor: '#FF0000',
    }),
    sound: 'default',
  });
}


export default function App() {



  const { checkAuth, user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {


    const init = async () => {
      await checkAuth();  // fetches and sets user/token
      setLoading(false);  // only show UI after auth is checked
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
          </>
        ) : (
          <Stack.Screen name="Tabs" component={Tabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
