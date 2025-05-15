import { Text, TouchableOpacity, View, Image } from "react-native";
import React, { useEffect, useLayoutEffect } from 'react';
import { useAuthStore } from "../../../store/authStore";
import { CommonActions, useNavigation } from '@react-navigation/native';
import "../../../global.css"

export default function Profile() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      })
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
          <View>
            <TouchableOpacity onPress={handleLogout}>
              <Text className="text-red-600 font-psemibold text-lg">
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [navigation, user, logout]);

  return (
    <View className='bg-primary h-full' >
      <View className="w-full my-auto justify-center items-center gap-3">
        <View className="w-full my-auto justify-center items-center gap-3 flex-row">
          <View className="w-20 h-20 rounded-full bg-white p-1 shadow-lg justify-center items-center">
            {user && user.profileImage ? (
              <Image
                style={{ width: 50, height: 50, borderRadius: 50 }}
                source={{ uri: `https://api.dicebear.com/7.x/personas/png?seed=${user?.username || "guest"}` }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-50 h-50 rounded-full bg-gray-300 justify-center items-center">
                <Text className="text-gray-500">No Image</Text>
              </View>
            )}
          </View>
          {user && user.username && (
            <Text className="justify-center text-center text-3xl font-pbold text-white">
              {user.username.toUpperCase()}
            </Text>
          )}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          className="mt-8 px-4 py-2 bg-secondary rounded-lg"
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text className="px-4 py-1 text-white font-psemibold text-lg">Edit Profile</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};