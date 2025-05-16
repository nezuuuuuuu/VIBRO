import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import notifee, { AndroidColor, AndroidImportance } from '@notifee/react-native';
import '@react-native-firebase/app';

// Auth store
import { useAuthStore } from './store/authStore';

// Screens
import Welcome from './src/screens/(welcome)/index';
import Signup from './src/screens/(auth)/signup';
import Login from './src/screens/(auth)';
import Home from './src/screens/(tabs)/home';
import Group from './src/screens/(tabs)/group';
import Sound from './src/screens/(tabs)/sound';
import Profile from './src/screens/(tabs)/profile';

// Constants
import { icons } from './src/constants';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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

// ✅ Bottom Tab Navigator (for logged-in users)
function Tabs() {
  return (
    <SafeAreaView className="h-full bg-primary">
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          headerStyle: { backgroundColor: '#1B1B3A', borderBottomWidth: 0 },
          headerTintColor: '#F5F5F5',
          tabBarIcon: ({ focused }) => {
            let icon;
            switch (route.name) {
              case 'Home':
                icon = icons.home;
                break;
              case 'Group':
                icon = icons.group;
                break;
              case 'Sound':
                icon = icons.sound;
                break;
              case 'Profile':
                icon = icons.profile;
                break;
            }

            return (
              <Image
                source={icon}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: focused ? '#10B981' : '#9CA3AF',
                }}
                resizeMode="contain"
              />
            );
          },
          tabBarActiveTintColor: '#8A2BE2',
          tabBarInactiveTintColor: '#CDCDE0',
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: '#1B1B3A',
            borderTopWidth: 1,
            borderTopColor: '#232533',
            height: 84,
            justifyContent: 'center',
          },
          tabBarItemStyle: {
            top: 20,
          },
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Group" component={Group} />
        <Tab.Screen name="Sound" component={Sound} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

// 🔐 App Root with Auth Logic
export default function App() {
  const { checkAuth, user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);

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
          </>
        ) : (
          <Stack.Screen name="Tabs" component={Tabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
