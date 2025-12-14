import React, { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Pressable, Image, TextInput, Alert, RefreshControl } from 'react-native';
import "../../../global.css";
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../constants';
import { useGroupStore } from "../../../store/groupStore";

// NEW: Import Camera components
import { useCameraDevice, useCodeScanner, Camera } from 'react-native-vision-camera';

const Groups = () => {
  const { getGroups, groups, isLoading, setGroupNavigation, groupPointer, getMembers, joinGroup } = useGroupStore();
  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [groupCode, setGroupCode] = useState('');
  const [groupCodePlaceholder, setGroupCodePlaceholder] = useState('Enter group code');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // NEW: Camera State
  const [isScanning, setIsScanning] = useState(false);
  const device = useCameraDevice('back');

  // NEW: Request Camera Permissions on Mount
  useEffect(() => {
    const requestPermissions = async () => {
      const permission = await Camera.requestCameraPermission();
      if (permission === 'denied') Alert.alert('Permission required', 'Please allow camera access to scan QR codes.');
    };
    requestPermissions();
  }, []);

  // NEW: Handle Code Scanned
  const onCodeScanned = useCallback((codes) => {
    const value = codes[0]?.value;
    if (value) {
      try {
        // Attempt to parse JSON (assuming your QR contains JSON like { type: 'JOIN_GROUP', code: '...' })
        const parsed = JSON.parse(value);
        
        if (parsed.code) {
          setIsScanning(false); // Stop scanning immediately
          setGroupCode(parsed.code); // Fill the input
          
          // Optional: Auto-submit after a short delay to let state update
          setTimeout(() => {
             handleJoinGroup(parsed.code); 
          }, 500);
        }
      } catch (e) {
        // Fallback: If it's just a raw text string, use it directly
        setIsScanning(false);
        setGroupCode(value);
      }
    }
  }, []);

  // NEW: Initialize Code Scanner
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: onCodeScanned,
  });

  const loadGroups = async () => {
    setIsRefreshing(true);
    await getGroups();
    setIsRefreshing(false);
  }

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

  const onRefresh = useCallback(async () => {
    await loadGroups();
  }, []);

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
        headerStyle: { backgroundColor: '#1a1a3d' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => (
          <View className="flex-row mr-2 gap-2 items-center pr-3">
            <TouchableOpacity onPress={() => setSearchActive(!searchActive)} className="mr-4">
              <Image source={icons.search} className="w-6 h-6 tint-white" resizeMode="contain" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setModalVisible(true);
              setGroupCodePlaceholder('Enter group code');
              setGroupCode('');
            }}>
              <Image source={icons.addgroup} className="w-8 h-8 tint-white" resizeMode="contain" />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [navigation, searchActive, searchQuery]);

  // Modified to accept an optional code argument for the auto-scan feature
  const handleJoinGroup = async (codeOverride = null) => {
    const codeToUse = codeOverride || groupCode;
    console.log('Attempting to join group with code:', codeToUse);

    if (!codeToUse) {
      setGroupCodePlaceholder('Please enter a code');
      return;
    }

    if (isLoading) return;

    setGroupCodePlaceholder('Joining...');
    
    // Ensure we are passing the code to your store function
    const result = await joinGroup(codeToUse);

    if (result.success) {
      setModalVisible(false);
      setGroupCode('');
      setGroupCodePlaceholder('Enter group code');
      Alert.alert("Success", "Joined group successfully!");
    } else {
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
    setModalVisible(false);
    setGroupCode('');
    setGroupCodePlaceholder('Enter group code');
    navigation.navigate('CreateGroup');
  };

  // NEW: Camera View Component
  if (isScanning && device) {
    return (
      <View className="flex-1 bg-black">
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
        />
        {/* Overlay UI for Scanner */}
        <View className="absolute top-10 right-5">
           <TouchableOpacity onPress={() => setIsScanning(false)} className="bg-white/20 p-2 rounded-full">
              <Text className="text-white font-pbold text-lg">Close X</Text>
           </TouchableOpacity>
        </View>
        <View className="absolute bottom-10 w-full items-center">
            <Text className="text-white font-pregular bg-black/50 px-4 py-2 rounded-lg">Point camera at Group QR Code</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="h-full flex-1 bg-primary p-4">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor='#8A2BE2' colors={['#8A2BE2']} />
        }
      >
        {(isLoading || isRefreshing) && groups.length === 0 && (
          <Text className="text-white font-pregular text-center mt-8">Loading groups...</Text>
        )}

        {!isLoading && filteredGroups.length === 0 && (
            <Text className="text-white font-pregular text-center mt-8">
                {searchQuery !== '' ? `No groups found matching "${searchQuery}".` : "No groups found. Join or create one!"}
            </Text>
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
                source={{ uri: `https://api.dicebear.com/9.x/shapes/png?seed=${group?.groupName || group?._id || "guest"}` }}
                className="w-12 h-12 rounded-full bg-gray-300"
                resizeMode="cover"
              />
              <Text className="text-white px-4 text-lg font-pregular">{group.groupName}</Text>
            </View>
            <Image source={icons.rightArrow} className="w-7 h-7 tint-white" resizeMode="contain" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* MODAL SECTION */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
            setModalVisible(false);
            setGroupCode('');
        }}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={() => {
            setModalVisible(false);
            setGroupCode('');
          }}
        >
          <Pressable className="bg-primary p-6 py-10 rounded-lg w-4/5 items-center" onPress={(e) => e.stopPropagation()}>
            <Text className="text-xl font-pbold mb-10 text-center text-white">ADD GROUP</Text>

            {/* Scan Button */}
            <TouchableOpacity 
                 className={`p-4 rounded-lg w-full items-center ${isLoading ? 'bg-gray-400' : 'bg-secondary'}`}
                onPress={() => setIsScanning(true)}
            >
                <Text className="text-white text-base font-psemibold">{isLoading ? 'Opening Camera...' : 'Join with QR'}</Text>
                
            </TouchableOpacity>
             <View className="flex-row items-center w-full my-6">
                {/* Left Line */}
                <View className="flex-1 h-[1px] bg-gray-600/50" />
                
                {/* Text */}
                <Text className="text-gray-400 text-sm font-pmedium mx-4 uppercase">OR</Text>
                
                {/* Right Line */}
                <View className="flex-1 h-[1px] bg-gray-600/50" />
            </View>
            
            {/* NEW: Input Row with Scan Button */}
            <View className="w-full flex-row gap-2 mb-4">
                <View className="flex-1 h-14 bg-gray-200 px-4 rounded-lg justify-center">
                    <TextInput
                        className="text-black font-pregular"
                        placeholder={groupCodePlaceholder}
                        placeholderTextColor="#888"
                        value={groupCode}
                        onChangeText={setGroupCode}
                        autoCapitalize="none"
                    />
                </View>
            </View>

            <TouchableOpacity
              className={`p-4 rounded-lg w-full items-center mb-6 ${isLoading ? 'bg-gray-400' : 'bg-secondary'}`}
              onPress={() => handleJoinGroup()}
              disabled={isLoading}
            >
              <Text className="text-white text-base font-psemibold">{isLoading ? 'Joining...' : 'Join Group'}</Text>
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="text-white font-pregular text-sm text-center">Create a new group instead? </Text>
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