import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Pressable, Image, TextInput, Alert } from 'react-native';
import "../../../global.css";
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../constants';
import { useGroupStore } from "../../../store/groupStore";

const Groups = () => {
  // Destructure state and actions from the store
  // Make sure groups is destructured as it's a dependency
  const { getGroups, groups, isLoading, setGroupNavigation, groupPointer, getMembers, joinGroup } = useGroupStore();

  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Initialize filteredGroups as an empty array
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [groupCode, setGroupCode] = useState('');
  const [groupCodePlaceholder, setGroupCodePlaceholder] = useState('Enter group code');

  // --- Effect 1: Fetch groups only on component mount ---
  useEffect(() => {
    // This function is called inside an effect that runs only once on mount
    const fetchInitialGroups = async () => {
      // Add a check here to prevent fetching if groups are already loaded on first render
      // (e.g., if navigating back to this screen and the store still has data)
      if (groups.length === 0 && !isLoading) {
         await getGroups();
      }
    };
    fetchInitialGroups();
  }, []); // Empty dependency array means this effect runs only once after the initial render

  // --- Effect 2: Update filtered groups whenever search query or original groups list changes ---
  useEffect(() => {
    if (searchQuery === '') {
      // If search is empty, filteredGroups should be the same as the original groups list
      setFilteredGroups(groups);
    } else {
      // If there is a search query, filter the original groups list
      setFilteredGroups(
        groups.filter(group =>
          group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    // This effect correctly depends on searchQuery and groups, re-running only when they change
  }, [searchQuery, groups]);


  // --- Header configuration effect (depends on navigation, search, and query) ---
  useLayoutEffect(() => {
    if (navigation) {
      navigation.setOptions({
        headerTitle: () => (
          searchActive ? (
            <View className="w-72 h-12 bg-[#2a2a5a] px-4 py-0 rounded-full justify-center">
              <TextInput
                className="text-white font-pregular flex-1"
                placeholder="Search groups..."
                placeholderTextColor="#ccc"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
                style={{ paddingVertical: 0 }}
              />
            </View>
          ) : (
            <Text className="font-pbold text-2xl text-white">GROUPS</Text>
          )
        ),
        headerStyle: {
          backgroundColor: '#1a1a3d',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <View className="flex-row mr-2 gap-2 items-center pr-3">
            <TouchableOpacity onPress={() => setSearchActive(!searchActive)} className="mr-4">
              <Image
                source={icons.search}
                className="w-6 h-6 tint-white"
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
                setModalVisible(true);
                setGroupCodePlaceholder('Enter group code');
                setGroupCode('');
            }}>
               <Image
                 source={icons.addgroup}
                 className="w-8 h-8 tint-white"
                 resizeMode="contain"
               />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [navigation, searchActive, searchQuery]); // Depends on navigation, searchActive, searchQuery


  // --- Handle Join Group Logic ---
  const handleJoinGroup = async () => {
    console.log('Attempting to join group with code:', groupCode);

    if (!groupCode) {
        setGroupCodePlaceholder('Please enter a code');
        return;
    }

    // You might want to check isLoading here too, although the button is disabled
    if (isLoading) {
        console.log("Join already in progress");
        return;
    }

    setGroupCodePlaceholder('Joining...'); // Give user feedback

    const result = await joinGroup(groupCode); // This is where store.isLoading becomes true

    if (result.success) {
        console.log('Successfully joined group:', result.group);
        setModalVisible(false); // Close modal on success
        setGroupCode(''); // Clear input
        setGroupCodePlaceholder('Enter group code'); // Reset placeholder
        Alert.alert("Success", "Joined group successfully!"); // Optional success alert
        // No need to manually fetch groups here; the store's joinGroup action
        // should add the new group to the 'groups' state, which will trigger
        // the second useEffect to update filteredGroups.
    } else {
        console.error('Failed to join group:', result.error);

        const errorMessage = result.error || 'Failed to join group.';

        if (errorMessage === 'You are already a member of this group.') {
            Alert.alert("Cannot Join", errorMessage);
            setGroupCodePlaceholder('Enter group code'); // Reset placeholder
        } else {
            Alert.alert("Error", errorMessage); // Generic error alert
            setGroupCodePlaceholder(errorMessage); // Show error in placeholder
        }

        setGroupCode(''); // Clear input after attempt
    }
     // No need to manually set isLoading to false here; the store action handles it
  };


  const handleCreateGroupNavigation = () => {
    console.log('Navigating to New Group screen');
    setModalVisible(false);
    setGroupCode('');
    setGroupCodePlaceholder('Enter group code');
    navigation.navigate('CreateGroup');
  };

  return (
    <View className="flex-1 bg-primary p-4">
      {/* Main ScrollView */}
      <ScrollView className="flex-1">
        {/* Loading indicator */}
        {isLoading && groups.length === 0 && ( // Show loading indicator only if no groups are loaded yet
            <Text className="text-white text-center mt-8">Loading groups...</Text>
        )}
         {/* Loading indicator *while* groups are already shown (e.g., during join) */}
         {/* {isLoading && groups.length > 0 && (
             <Text className="text-white text-center">Updating groups...</Text>
         )} */}


        {/* Message when no groups and not searching and not loading */}
        {!isLoading && filteredGroups.length === 0 && searchQuery === '' && groups.length === 0 && (
             <Text className="text-white text-center mt-8">No groups found. Join or create one!</Text>
        )}

        {/* Message when search yields no results */}
         {!isLoading && filteredGroups.length === 0 && searchQuery !== '' && (
             <Text className="text-white text-center mt-8">No groups found matching "{searchQuery}".</Text>
         )}

        {/* Render the list of filtered groups */}
        {/* Add a check for filteredGroups.length > 0 before mapping if needed */}
        {filteredGroups.map((group) => (
          <TouchableOpacity
            key={group._id} // Use _id for key
            className="flex-row justify-between items-center bg-[#2a2a5a] p-4 mb-3 rounded-lg"
            onPress={async () => {
              await setGroupNavigation(group._id); // Navigate action should set the pointer
              navigation.navigate('GroupDetails'); // Navigate to details screen
            }}
          >
            <View className="flex-row items-center space-x-4">
              {/* Group Photo */}
              <Image
                source={{ uri: `https://api.dicebear.com/7.x/personas/png?seed=${group?.groupName || group?._id || "guest"}` }} // Use _id if name is null/empty
                className="w-12 h-12 rounded-full bg-gray-300"
                resizeMode="cover"
              />
              <Text className="text-white px-4 text-lg font-pregular">{group.groupName}</Text>
            </View>

            <View className="flex-row items-center">
              {/* Optional status display */}
              <Image
                source={icons.rightArrow}
                className="w-7 h-7"
                resizeMode="contain"
                style={{ tintColor: 'white' }}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal for joining or creating a group */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setGroupCode('');
          setGroupCodePlaceholder('Enter group code');
        }}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={() => {
            setModalVisible(false);
            setGroupCode('');
            setGroupCodePlaceholder('Enter group code');
          }}
        >
          <Pressable className="bg-primary p-6 py-10 rounded-lg w-4/5 items-center" onPress={(e) => e.stopPropagation()}>
            <Text className="text-xl font-pbold mb-6 text-center text-white">ADD GROUP</Text>

            {/* Group Code Input */}
            <Text className="text-left w-full mb-2 text-white font-psemibold">Group Code</Text>
            <View className="w-full h-14 bg-gray-200 px-4 rounded-lg justify-center mb-4">
              <TextInput
                className="flex-1 text-black font-pregular"
                placeholder={groupCodePlaceholder}
                placeholderTextColor="#888"
                value={groupCode}
                onChangeText={setGroupCode}
                autoCapitalize="none"
              />
            </View>

            {/* Join Group Button (Disabled while isLoading) */}
            <TouchableOpacity
              className={`p-4 rounded-lg w-full items-center mb-6 ${isLoading ? 'bg-gray-400' : 'bg-secondary'}`}
              onPress={handleJoinGroup}
              disabled={isLoading} // Prevents multiple clicks while loading
            >
              <Text className="text-white text-base font-psemibold">{isLoading ? 'Joining...' : 'Join Group'}</Text>
            </TouchableOpacity>

            {/* Navigate to Create Group */}
            <View className="flex-row justify-center">
              <Text className="text-white font-pregular text-sm text-center">
                Create a new group instead?{' '}
              </Text>
              <TouchableOpacity onPress={handleCreateGroupNavigation} className="items-center">
                <Text className="text-secondary text-sm font-pbold underline">New Group</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default Groups;