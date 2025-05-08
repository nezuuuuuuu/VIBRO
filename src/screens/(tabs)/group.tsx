import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Pressable, Image, TextInput } from 'react-native';
import "../../../global.css";
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../constants';
// Importing CreateGroup here is not necessary for navigation,
// it's only needed in the file where your navigator is defined.
// import CreateGroup from './createGroup';
import { useGroupStore } from "../../../store/groupStore"; // Assuming you have an API utility for creating groups


const Groups = () => {
  const { getGroups, groups, isLoading,setGroupNavigation, groupPointer,getMembers,joinGroup } = useGroupStore();

  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGroups, setFilteredGroups] = useState(groups);
  const [groupCode, setGroupCode] = useState(''); // State for the group code input
  const [groupCodePlaceholder, setgroupCodePlaceholder] = useState('');
  const fetchGroups = async () => {
    await getGroups(); 
  };
  useEffect(() => {
    
    if(groups.length === 0) {
      fetchGroups();
    }
    
    
    // console.log('Groupsghjk:', groups); // Log the groups to see if they are fetched correctly
    if (searchQuery === '') {
      setFilteredGroups(groups); // If search is empty, show all groups
    } else {
      setFilteredGroups(
        groups.filter(group =>
          group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery,groups]);

  useLayoutEffect(() => {
    if (navigation) {
      navigation.setOptions({
        headerTitle: () => (
          searchActive ? (
            <View className="w-72 h-12 bg-[#2a2a5a] px-4 py-0 rounded-full justify-center">
              <TextInput
                className="text-white flex-1"
                placeholder="Search groups..."
                placeholderTextColor="#ccc"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
                style={{ paddingVertical: 0 }}
              />
            </View>
          ) : (
            <Text className="font-psemibold text-2xl text-white">GROUPS</Text>
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
            <TouchableOpacity onPress={() => setModalVisible(true)}>
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
  }, [navigation, searchActive, searchQuery]);

  const handleJoinGroup = () => {
    console.log('Joining group with code:', groupCode);
    if(joinGroup(groupCode)== true){
      setModalVisible(false); // Close modal after attempting to join
      setGroupCode(''); // Clear the input
    }
    else{
      setgroupCodePlaceholder('code is not valid')
      setGroupCode(''); // Clear the input
    }
  };

  const handleCreateGroupNavigation = () => {
    console.log('Navigating to New Group screen');
    setModalVisible(false); // Close modal
    setGroupCode(''); // Clear the input

    navigation.navigate('CreateGroup');
  };

  return (
    <View className="flex-1 bg-primary p-4">
      <ScrollView className="flex-1">
        {filteredGroups.map((group) => (
          <TouchableOpacity
            key={group._id}
            className="flex-row justify-between items-center bg-[#2a2a5a] p-4 mb-3 rounded-lg"
            onPress={() => {
              setGroupNavigation(group._id);
              // getMembers(group._id);
              navigation.navigate('GroupDetails');
              // console.log('Group ID:', group._id); // Log the group ID for debugging
            }}
        >
          <View className="flex-row items-center space-x-4">
            {/* Group Photo */}
            <Image
              source={{ uri: `https://api.dicebear.com/7.x/bottts/png?seed=${group?.groupName || "guest"}` }}
              className="w-12 h-12 rounded-full bg-gray-300"
              resizeMode="cover"
            />
        
            {/* Group Name */}
            <Text className="text-white px-4 text-lg font-pregular">{group.groupName}</Text>
          </View>
        
          <View className="flex-row items-center">
            {group.status === 'Active' && (
              <Text className="text-green-400 font-plight text-sm mr-2">{group.status}</Text>
            )}
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
          setGroupCode(''); // Clear input on close
        }}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={() => {
            setModalVisible(false);
            setGroupCode(''); // Clear input on close
          }}
        >
          <Pressable className="bg-white p-6 py-8 rounded-lg w-4/5 items-center" onPress={(e) => e.stopPropagation()}>
            <Text className="text-xl font-pbold mb-6 text-center text-black">ADD GROUP</Text>

            {/* Group Code Input */}
            <Text className="text-left w-full mb-2 text-gray-700 font-psemibold">Group Code</Text>
            <View className="w-full h-14 bg-gray-200 px-4 rounded-lg justify-center mb-4">
              <TextInput
                className="flex-1 text-black font-pregular"
                placeholder={groupCodePlaceholder}
                placeholderTextColor="#888"
                value={groupCode}
                onChangeText={setGroupCode}
              />
            </View>

            {/* Join Group Button */}
            <TouchableOpacity
              className="bg-secondary p-4 rounded-lg w-full items-center mb-4"
              onPress={handleJoinGroup}
            >
              <Text className="text-white text-base font-psemibold">Join Group</Text>
            </TouchableOpacity>

            {/* Navigate to Create Group */}
            <View className="flex-row justify-center">
              <Text className="text-gray-700 font-pregular text-sm text-center">
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