import { Text, TouchableOpacity, View, Image } from "react-native";
import React from 'react';
import { useAuthStore } from "../../../store/authStore";
import { CommonActions, useNavigation } from '@react-navigation/native';

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

  return (
    <View className="w-full my-auto justify-center items-center gap-3">
      <View className="w-full my-auto justify-center items-center gap-3 flex-row">
        <View className="w-20 h-20 rounded-full bg-white p-1 shadow-lg justify-center items-center">
          {user && user.profileImage ? (
            <Image
              style={{ width: 50, height: 50, borderRadius: 50 }}
              source={{ uri: `https://api.dicebear.com/7.x/bottts/png?seed=${user?.username || "guest"}` }}
              resizeMode="cover"
            />
          ) : (
            <View className="w-50 h-50 rounded-full bg-gray-300 justify-center items-center">
              <Text className="text-gray-500">No Image</Text>
            </View>
          )}
        </View>
        {user && user.username && (
          <Text className="justify-center text-center text-3xl font-pbold text-primary">
            {user.username.toUpperCase()}
          </Text>
        )}
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity
        className="mt-4 px-4 py-2 bg-primary rounded-lg"
        onPress={() => navigation.navigate("EditProfile")}
      >
        <Text className="text-white font-semibold text-lg">Edit Profile</Text>
      </TouchableOpacity>

      {/* Log Out Button */}
      <TouchableOpacity onPress={handleLogout}>
        <Text className="text-accent font-bold p-6 text-2xl">
          Log Out
        </Text>
      </TouchableOpacity>
    </View>
  );
};