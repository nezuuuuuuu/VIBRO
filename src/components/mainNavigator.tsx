import React from 'react';
import { StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import '@react-native-firebase/app';
import Home from '../screens/(tabs)/home'; 
import Group from '../screens/(tabs)/group'; 
import Sound from '../screens/(tabs)/sound'; 
import Profile from '../screens/(tabs)/profile'; 
import Login from '../screens/account/login'; 
import { icons } from '../constants';
const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  return (
    <>
      <SafeAreaView className="h-full bg-primary">
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: true,
              headerStyle: {
                backgroundColor: '#1B1B3A',
                borderBottomWidth: 0,
              },
              headerTintColor: '#F5F5F5',
              tabBarIcon: ({ focused, color, size }) => {
                let iconSource;

                switch (route.name) {
                  case 'Home':
                    iconSource = icons.home;
                    break;
                  case 'Group':
                    iconSource = icons.group;
                    break;
                  case 'Sound':
                    iconSource = icons.sound;
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
        </NavigationContainer>
      </SafeAreaView>
    </>
  );
};

export default MainNavigator;