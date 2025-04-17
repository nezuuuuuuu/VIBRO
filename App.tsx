import React from 'react';
import { StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Home from './src/screens/(tabs)/home'; 
import Group from './src/screens/(tabs)/group'; 
import Sound from './src/screens/(tabs)/sound'; 
import Profile from './src/screens/(tabs)/profile'; 
import { icons } from './src/constants';
const Tab = createBottomTabNavigator();

function App() {
  return (
    <>
   
      <SafeAreaView className="h-full bg-primary">

        <NavigationContainer >
          <Tab.Navigator 
            screenOptions={({ route }) => ({
              headerShown: true,
              headerStyle: {
                backgroundColor: '#1B1B3A',
                borderBottomWidth: 0,
             
              },
              headerTintColor: '#F5F5F5',
              tabBarIcon: ({ focused, color, size }) => {
                let icon;

                switch (route.name) {
                  case 'Home':
                    icon = icons.home;
                    break;
                  case 'Group':
                    icon = icons.group;
                    break;
                  case 'Sound':
                    icon =icons.sound;
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
                      tintColor: focused ? '#10B981' : '#9CA3AF', // green if active, gray if not
                    }}
                    resizeMode="contain"
                  />
                );
              },
              tabBarActiveTintColor: "#8A2BE2",
              tabBarInactiveTintColor: "#CDCDE0",
              tabBarShowLabel: false,
              tabBarStyle: {
                backgroundColor: "#1B1B3A",
                borderTopWidth: 1,
                borderTopColor: "#232533",
                height: 84,
                justifyContent: 'center'
              },
              tabBarItemStyle:{
                  top: 20
                  
              }
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
}

export default App;
