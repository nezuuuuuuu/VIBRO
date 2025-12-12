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

// Screens
import Welcome from './src/screens/(welcome)/index';
import Signup from './src/screens/(auth)/signup';
import Login from './src/screens/(auth)';
import OTPVerification from './src/screens/(auth)/otpverification';
import Tabs from './src/components/mainNavigator';
import { useAuthStore } from "./store/authStore";

const Stack = createNativeStackNavigator();

// --- 1. Notifee Channel Setup (For Notification Sound/Vibration) ---
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

  // --- 2. Flashlight Logic (Using react-native-torch) ---
  
  // Cleanup: Ensure torch is OFF when app closes/unmounts
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
      // Check permission first
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

  // --- 3. Integrate Notification with Flash ---
  useEffect(() => {
    // This listener fires whenever a notification is displayed while the app is open
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      // EventType.DELIVERED means the notification just appeared
      if (type === EventType.DELIVERED) {
        console.log("Notification received! Triggering Flash...");
        startBlinkSequence();
      }
    });

    return unsubscribe;
  }, []);

  // --- 4. Auth & Navigation Logic ---
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

  //This dont work lol

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