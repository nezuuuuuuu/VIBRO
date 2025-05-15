import React from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Import Stack Navigator
import Home from '../screens/(tabs)/home';
import Group from '../screens/(tabs)/group';
import CreateGroup from '../screens/(tabs)/createGroup';
import Sound from '../screens/(tabs)/sound';
import ProfileScreen from '../screens/(tabs)/profile'; 
import EditProfile from '../screens/(tabs)/editprofile';
import GroupDetails from '../screens/(tabs)/GroupDetails';
import GroupSoundsDetected from '../screens/(tabs)/GroupSoundsDetected';
import GroupInfo from '../screens/(tabs)/GroupInfo';
import ChatScreen from '../screens/(tabs)/chatScreen';
import { icons } from '../constants';
import "../../global.css";
import CustomSounds from '../screens/(tabs)/customSound';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator(); 
const GroupStack = createNativeStackNavigator();

// Create a nested Stack Navigator for the Profile screen and its related screens
const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{
        // Default header style for this stack, can be overridden per screen
        headerStyle: {
          backgroundColor: 'bg-primary',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false, // Common to hide back button title on iOS
      }}
    >
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfile} />
    </ProfileStack.Navigator>
  );
};

const GroupStackNavigator = () => {
  return (
    // Default screenOptions for the GroupStack
    <GroupStack.Navigator
      screenOptions={{
        // Default header style for this stack, can be overridden per screen
        headerStyle: {
          backgroundColor: 'bg-primary',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }}
    >
      <GroupStack.Screen
        name="GroupsList"
        component={Group}
        options={{ title: 'My Groups' }} 
      />
      <GroupStack.Screen
        name="CreateGroup"
        component={CreateGroup}
        options={{ headerShown: false }} 
      />
      <GroupStack.Screen
        name="GroupDetails"
        component={GroupDetails}
        // options={{ headerShown: true }} // GroupDetails sets its own header via useLayoutEffect
      />
      <GroupStack.Screen
        name="GroupSoundsDetected"
        component={GroupSoundsDetected}
        options={{ title: 'Sound Detections' }} 
      />
      <GroupStack.Screen
        name="GroupInfo"
        component={GroupInfo}
        options={{ title: 'Group Information' }} 
      />
      <GroupStack.Screen 
        name="ChatScreen"
        component ={ChatScreen}
        options={({ title: 'Chat Screen'})}
      />
      <GroupStack.Screen
       name="CustomSounds"
        component={CustomSounds}
         options={{ headerShown: true }} />

    </GroupStack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true, // Hide header for tabs, nested stacks can control it
        tabBarIcon: ({ focused, color, size }) => {
          let iconSource;

          switch (route.name) {
            case 'Home':
              iconSource = icons.home;
              break;
            case 'Sound':
              iconSource = icons.sound;
              break;
            case 'Group':
              iconSource = icons.group;
              break;
            case 'Profile': 
              iconSource = icons.profile;
              break;
            default:
              break;
          }

          return (
            <Image
              source={iconSource}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? '#8A2BE2' : '#9CA3AF',
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
      <Tab.Screen name="Group" component={GroupStackNavigator} options={{ tabBarLabel: 'Group', headerShown: false}}/>
      <Tab.Screen name="Sound" component={Sound} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ tabBarLabel: 'Profile', headerShown: false }} />
    </Tab.Navigator>
  );
};

export default MainNavigator;