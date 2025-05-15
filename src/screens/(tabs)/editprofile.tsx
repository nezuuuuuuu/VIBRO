import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import React, { useState, useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../store/authStore';
import "../../../global.css"

export default function EditProfile() {
  const navigation = useNavigation();
  const { user, updateProfile } = useAuthStore();
  const [username, setUsername] = useState(user?.username || "");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text className="font-pbold text-2xl text-white">Edit Profile</Text>
      ),
      headerStyle: {
        backgroundColor: '#1B1B3A', 
      },
      headerTintColor: 'white'
    });
  }, [navigation]);

  const handleSave = async () => {
    await updateProfile({ username });
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-primary justify-center items-center px-8">

      
      <View className="relative mb-6">
        <View className="w-24 h-24 rounded-full bg-gray-300 justify-center items-center overflow-hidden">
          {user?.profileImage ? (
            <Image
              source={{ uri: `https://api.dicebear.com/9.x/personas/png?seed=${user?.username || "guest"}` }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-gray-500 text-lg font-semibold">{user?.username?.charAt(0)?.toUpperCase() || '?'}</Text>
          )}
        </View>
      </View>

      <View className="w-full mb-4">
        <Text className="text-lg font-pmedium text-white mb-2">Username</Text>
        <TextInput
          className="w-full font-pregular border border-gray-400 rounded-lg px-4 py-3 text-lg text-gray-400"
          value={username}
          onChangeText={setUsername}
          placeholder="Enter new username"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        className="bg-secondary px-8 py-3 rounded-lg w-full items-center shadow-md"
        onPress={handleSave}
      >
        <Text className="text-white text-lg font-psemibold">Save Changes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-6"
        onPress={() => navigation.goBack()}
      >
        <Text className="text-secondary font-psemibold text-lg">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}