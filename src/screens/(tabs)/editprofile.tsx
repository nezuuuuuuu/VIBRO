import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../store/authStore';

export default function EditProfile() {
  const navigation = useNavigation();
  const { user, updateProfile } = useAuthStore();
  const [username, setUsername] = useState(user?.username || "");

  const handleSave = async () => {
    await updateProfile({ username });
    navigation.goBack();
  };

  return (
    <View className="flex-1 justify-center items-center px-6">
      <Text className="text-2xl font-bold mb-6">Edit Profile</Text>
      <TextInput
        className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
      />
      <TouchableOpacity
        className="bg-primary px-6 py-2 rounded-lg"
        onPress={handleSave}
      >
        <Text className="text-white text-lg font-semibold">Save</Text>
      </TouchableOpacity>
    </View>
  );
}
