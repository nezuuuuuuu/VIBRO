import { Text, TouchableOpacity, View, Image, Alert, Switch } from "react-native";
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useAuthStore } from "../../../store/authStore";
import { CommonActions, useNavigation } from '@react-navigation/native';
import "../../../global.css";
import { useAppStore } from "../../../store/appStore";

const INACTIVE_SWITCH_COLOR = '#767577';
const ACTIVE_SWITCH_COLOR = '#8A2BE2';

export default function Profile() {
  const navigation = useNavigation();
  const { user, logout, setActiveStatus } = useAuthStore();
  const { isOfflineMode, toggleOfflineMode } = useAppStore();
  const [isMonitoringOn, setIsMonitoringOn] = useState(user.isMonitoringOn);


  useEffect(() => {
    if (isOfflineMode) {
        // 1. Turn off monitoring if we enter offline mode
        setIsMonitoringOn(false);
        // 2. Update the global active status in the store
        setActiveStatus(false); 
    }
    // Dependency array ensures this runs whenever isOfflineMode changes
}, [isOfflineMode]);

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Logout Cancelled"),
          style: "cancel"
        },
        {
          text: "Log Out",
          onPress: async () => {
            await logout();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              })
            );
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  const handleToggle = () => {
  if (isMonitoringOn) {
    setActiveStatus(false);
  } else {
    setActiveStatus(true);
  }
  // Toggle the state
setIsMonitoringOn(!isMonitoringOn);
}

  const handleOfflineModeToggle = () => {
    const newMode = !isOfflineMode;
    toggleOfflineMode();
    Alert.alert(
      "Mode Switched",
      newMode ? "App is now OFFLINE. Some features may be limited." : "App is now ONLINE."
    );
  };

  useLayoutEffect(() => {
    if (user) {
      navigation.setOptions({
        headerTitle: () => (
          <Text className="font-pbold text-2xl text-white">PROFILE</Text>
        ),
        headerStyle: {
          backgroundColor: '#1B1B3A',
        },
        headerRight: () => (
          <View className="mr-4">
            <TouchableOpacity onPress={handleLogout}>
              <Text className="text-red-500 font-psemibold text-lg">
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        ),
        headerTintColor: '#fff',
      });
    }
  }, [navigation, user, logout]);

  return (
    <View className='bg-primary h-full justify-start'>

      {/* Profile Info Section */}
      <View className="w-full justify-center items-center gap-3 mt-10">
        <View className="w-full justify-center items-center gap-3 flex-column">
          {user && (
            <Image
              className="w-12 h-12 rounded-full bg-gray-300"
              style={{ width: 100, height: 100, borderRadius: 100 }}
              source={{ uri: `https://api.dicebear.com/9.x/personas/png?seed=${user?.username || "guest"}` }}
              resizeMode="cover"
            />
          )}
          {user && user.username && (
            <Text className="justify-center text-center text-4xl font-pbold text-white">
              {user.username.toUpperCase()}
            </Text>
          )}
        </View>

        <TouchableOpacity
          className="mt-2 px-4 py-2 bg-secondary rounded-lg"
          onPress={() => navigation.navigate("EditProfile")}
          disabled={isOfflineMode}
          style={{ opacity: isOfflineMode ? 0.5 : 1 }}
        >
          <Text className="px-4 py-1 text-white font-psemibold text-lg">Edit Profile</Text>
        </TouchableOpacity>
      </View>




      {/* Offline Mode Toggle Section */}
      <View className="px-4 mt-20">
        <View className="w-full p-4 bg-[#2A2A5A] rounded-lg shadow-md">
          <View className="flex flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-base font-pmedium text-white">
                Offline Mode
              </Text>
              <Text className="text-xs font-pregular text-gray-400 mt-1">
                Use sound detection without internet. Online features will be limited.
              </Text>
            </View>
            <Switch
              onValueChange={handleOfflineModeToggle}
              trackColor={{ false: INACTIVE_SWITCH_COLOR, true: ACTIVE_SWITCH_COLOR}}
              thumbColor={isOfflineMode ? "#f4f3f4" : "#f4f3f4"}
              value={isOfflineMode}
              ios_backgroundColor={INACTIVE_SWITCH_COLOR}
            />
          </View>
        </View>
      </View>


       {/* Enable Group Monitoring */}
       <View className="p-4">
        <View className="w-full p-4 bg-[#2A2A5A] rounded-lg shadow-md" 
          style={{ opacity: isOfflineMode ? 0.5 : 1 }}>
          <View className="flex flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-base font-pmedium text-white">
                Enable Group Monitoring
              </Text>
              <Text className="text-xs font-pregular text-gray-400 mt-1">
                When enabled, detected sounds will be visible to your group members.
              </Text>
            </View>
            <Switch
                onValueChange={() => handleToggle()}
                trackColor={{ false: INACTIVE_SWITCH_COLOR, true: ACTIVE_SWITCH_COLOR }}
                thumbColor={isMonitoringOn ? "#f4f3f4" : "#f4f3f4"} 
                value={isMonitoringOn}
                ios_backgroundColor={INACTIVE_SWITCH_COLOR}
                disabled={isOfflineMode}
              />
          </View>
        </View>
      </View>
      <View />
    </View>
  );
};