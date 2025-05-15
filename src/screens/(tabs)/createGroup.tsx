import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import "../../../global.css"; // Assuming your global CSS for Tailwind is here
import { icons } from '../../constants'; // Assuming icons are correctly imported
import { useGroupStore } from "../../../store/groupStore"; // Assuming you have an API utility for creating groups
import { useNavigation } from '@react-navigation/native'; // Import the navigation hook

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [groupPhotoUri, setGroupPhotoUri] = useState(null); // State to hold the selected group photo URI
  const { createGroup } = useGroupStore();
  const navigation = useNavigation(); // Initialize the navigation object

  // Placeholder function for selecting a photo
  const handleSelectPhoto = () => {
    // Implement photo selection logic here (e.g., using ImagePicker)
    console.log('Select Group Photo pressed');
    // For now, let's just set a dummy URI
    // setGroupPhotoUri('https://placehold.co/150x150');
  };

  // Placeholder function for creating the group
  const handleCreateGroup = () => {
    if(groupPhotoUri === null) {
      console.log("Please select a group photo");
      return; // Prevent group creation if no photo is selected
    }

    createGroup(groupName, groupPhotoUri);
    console.log('Create Group pressed');
    console.log('Group Name:', groupName);
    console.log('Group Photo URI:', groupPhotoUri);
    // You would typically send this data to your backend API
    // After successful creation, you might want to navigate the user somewhere
    // navigation.goBack(); // Example: Go back to the previous screen
  };

  const handleCancel = () => {
    navigation.goBack(); // Go back to the previous screen
  };

  return (
    <ScrollView className="flex-1 bg-primary p-4">
      <View className="items-center mt-20 mb-6">
        <Text className="text-white text-2xl font-pbold">
          Create New Group
        </Text>
      </View>

      {/* Group Photo Section */}
      <TouchableOpacity
        className="w-32 h-32 rounded-full bg-[#2a2a5a] justify-center items-center self-center mb-6"
        onPress={handleSelectPhoto}
      >
        {groupPhotoUri ? (
          <Image
            source={{ uri: groupPhotoUri }}
            className="w-32 h-32 rounded-full"
            resizeMode="cover"
          />
        ) : (
          <Image
            source={icons.home} // Assuming you have a camera icon in your constants
            className="w-12 h-12 tint-white"
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
      <Text className="text-center text-white text-sm mb-16 font-pregular">
        Tap to add group photo
      </Text>


      {/* Group Name Input */}
      <View className="mb-6">
        <Text className="text-white text-sm mb-2 font-psemibold">
          Group Name
        </Text>
        <TextInput
          className="h-14 bg-[#2a2a5a] rounded-lg px-4 text-white text-base font-pextralight"
          placeholder="Enter group name"
          placeholderTextColor="#ccc"
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>

      {/* Members and Admins (Placeholder) */}
      {/* You would typically have separate screens or components to manage members and admins */}
      {/* <View className="mb-6">
        <Text className="text-white text-lg mb-2 font-plight">
          Members & Admins (Manage Separately)
        </Text>
      </View> */}


      {/* Create Group Button */}
      <TouchableOpacity
        className="bg-secondary p-4 rounded-lg items-center mb-4" // Added mb-4 for spacing
        onPress={handleCreateGroup}
      >
        <Text className="text-white text-lg font-pbold">
          Create Group
        </Text>
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        className="p-4 rounded-lg items-center"
        onPress={handleCancel}
      >
        <Text className="text-secondary text-lg font-psemibold">
          Cancel
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

export default CreateGroup;