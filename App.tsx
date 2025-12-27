import React, { useEffect, useState, } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Welcome from './src/screens/(welcome)/index';
import AuthScreen from './src/screens/(auth)';
import Tabs from './src/components/mainNavigator';
import { useAuthStore } from "./store/authStore";
import { View, ActivityIndicator, Platform, Image, StatusBar, Alert,PermissionsAndroid } from 'react-native';
import Signup from './src/screens/(auth)/signup';
import Login from './src/screens/(auth)';
import OTPVerification from './src/screens/(auth)/otpverification';
import notifee, { AndroidColor, AndroidImportance } from '@notifee/react-native';
import { navigationRef,navigate } from './src/components/navigationRef';
import {registerNotificationListeners} from './src/components/notification';
import messaging from "@react-native-firebase/messaging"
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  notifee.createChannel({
    id: 'chat-alerts-v2',
    name: 'Chat Alerts',
    description: 'Notifications for new messages',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [ 100,700],
    ...(hasLedSupport && {
      lights: true,
      lightColor: '#FF0000',
    }),
    sound: 'default',
  });
}


export default function App() {

  


  const { checkAuth, user, token, fcmId, setFcmId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false); 



  const requestPermission = async ()=>{
    if (Platform.OS !== 'android') return;

  if (Platform.Version < 33) {
    // Android 12 and below → permission auto-granted
    console.log('POST_NOTIFICATIONS auto-granted');
    requestToken();
    return;
  }
    try {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      console.log("result**", result)
      console.log("result**2", PermissionsAndroid.RESULTS.GRANTED)
      if(result === PermissionsAndroid.RESULTS.GRANTED){
        console.log("Permission Granted")
        // request for device token
        requestToken()
      }else{
        Alert.alert("Permission Denied")
      }
    } catch (error) {
        console.log(error)
    }
  }
  
  const requestToken = async ()=>{
    try {
      await messaging().registerDeviceForRemoteMessages();
      const token = await messaging().getToken();
      await setFcmId(token)
      console.log("token**", token)
    } catch (error) {
      console.log(error)
    }
  }


  useEffect(()=>{
    requestPermission()
  }, [])

  useEffect(() => {
  
  const consumePendingNavigation = async () => {
    const stored = await AsyncStorage.getItem('PENDING_NAVIGATION');
    if (!stored) return;

    const { target, params } = JSON.parse(stored);

    await AsyncStorage.removeItem('PENDING_NAVIGATION');

    // Wait until navigation is fully ready
    const interval = setInterval(() => {
      if (navigationRef.isReady()) {
        clearInterval(interval);

        // Navigate properly
        navigate('Tabs', { screen: 'Group' });

        setTimeout(() => {
          navigate(target, params);
        }, 300);
      }
    }, 50);
  };

  consumePendingNavigation();
}, []);
  

  useEffect(() => {
    const init = async () => {
        const stored = await AsyncStorage.getItem('PENDING_NAVIGATION');
      console.log("stored pending nav:", stored);
      await registerNotificationListeners();
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
    <NavigationContainer ref={navigationRef}>
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
