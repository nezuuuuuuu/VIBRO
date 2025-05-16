import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Pressable, Image, TextInput, Alert } from 'react-native';
import "../../../global.css";
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../constants';
import { useGroupStore } from "../../../store/groupStore";

const Groups = () => {
  const { getGroups, groups, isLoading, setGroupNavigation, groupPointer, getMembers, joinGroup } = useGroupStore();

  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [groupCode, setGroupCode] = useState('');
  const [groupCodePlaceholder, setGroupCodePlaceholder] = useState('Enter group code');

  useEffect(() => {
    const fetchInitialGroups = async () => {
      if (groups.length === 0 && !isLoading) {
          await getGroups();
      }
    };
    fetchInitialGroups();
  }, []);

  useEffect(() => {
    if (searchQuery === '') {
      setFilteredGroups(groups);
    } else {
      setFilteredGroups(
        groups.filter(group =>
          group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, groups]);


  useLayoutEffect(() => {
    if (navigation) {
      navigation.setOptions({
        headerTitle: () => (
          searchActive ? (
            <View className="w-11/12 gap-2 h-12 bg-[#2a2a5a] px-4 py-0 rounded-full justify-center">
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
  }, [navigation, searchActive, searchQuery]);


  const handleJoinGroup = async () => {
    console.log('Attempting to join group with code:', groupCode);

    if (!groupCode) {
        setGroupCodePlaceholder('Please enter a code');
        return;
    }

    if (isLoading) {
        console.log("Join already in progress");
        return;
    }

    setGroupCodePlaceholder('Joining...');

    const result = await joinGroup(groupCode);

    if (result.success) {
        console.log('Successfully joined group:', result.group);
        setModalVisible(false);
        setGroupCode('');
        setGroupCodePlaceholder('Enter group code');
        Alert.alert("Success", "Joined group successfully!");
    } else {
        console.error('Failed to join group:', result.error);

        const errorMessage = result.error || 'Failed to join group.';

        if (errorMessage === 'You are already a member of this group.') {
            Alert.alert("Cannot Join", errorMessage);
            setGroupCodePlaceholder('Enter group code');
        } else {
            Alert.alert("Error", errorMessage);
            setGroupCodePlaceholder(errorMessage);
        }

        setGroupCode('');
    }
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
      <ScrollView className="flex-1">
        {isLoading && groups.length === 0 && (
            <Text className="text-white text-center mt-8">Loading groups...</Text>
        )}

        {!isLoading && filteredGroups.length === 0 && searchQuery === '' && groups.length === 0 && (
            <Text className="text-white text-center mt-8">No groups found. Join or create one!</Text>
        )}

        {!isLoading && filteredGroups.length === 0 && searchQuery !== '' && (
            <Text className="text-white text-center mt-8">No groups found matching "{searchQuery}".</Text>
        )}

        {filteredGroups.map((group) => (
          <TouchableOpacity
            key={group._id}
            className="flex-row justify-between items-center bg-[#2a2a5a] p-4 mb-3 rounded-lg"
            onPress={async () => {
              await setGroupNavigation(group._id);
              navigation.navigate('GroupDetails');
            }}
          >
            <View className="flex-row items-center space-x-4">
              <Image
                source={{ uri: `https://api.dicebear.com/7.x/personas/png?seed=${group?.groupName || group?._id || "guest"}` }}
                className="w-12 h-12 rounded-full bg-gray-300"
                resizeMode="cover"
              />
              <Text className="text-white px-4 text-lg font-pregular">{group.groupName}</Text>
            </View>

            <View className="flex-row items-center">
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

            <TouchableOpacity
              className={`p-4 rounded-lg w-full items-center mb-6 ${isLoading ? 'bg-gray-400' : 'bg-secondary'}`}
              onPress={handleJoinGroup}
              disabled={isLoading}
            >
              <Text className="text-white text-base font-psemibold">{isLoading ? 'Joining...' : 'Join Group'}</Text>
            </TouchableOpacity>

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