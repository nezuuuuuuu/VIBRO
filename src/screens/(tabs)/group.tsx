import React, { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Pressable, Image, TextInput, Alert, RefreshControl } from 'react-native';
import "../../../global.css";
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../constants';
import { useGroupStore } from "../../../store/groupStore";
import { useCameraDevice, useCodeScanner, Camera } from 'react-native-vision-camera';

const Groups = () => {
  const { getGroups, groups, isLoading, setGroupNavigation, joinGroup } = useGroupStore();
  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGroups, setFilteredGroups] = useState([]);
  
  const [groupCode, setGroupCode] = useState('');
  
  // ERROR STATES
  const [qrError, setQrError] = useState(''); 
  const [manualError, setManualError] = useState(''); 
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Camera State
  const [isScanning, setIsScanning] = useState(false);
  const device = useCameraDevice('back');

  useEffect(() => {
    const requestPermissions = async () => {
      const permission = await Camera.requestCameraPermission();
      if (permission === 'denied') Alert.alert('Permission required', 'Please allow camera access to scan QR codes.');
    };
    requestPermissions();
  }, []);

  // --- UPDATED JOIN LOGIC WITH SPECIFIC ERROR HANDLING ---
  const executeJoin = async (codeToUse, type = 'manual') => {
    // 1. Clear previous errors based on interaction type
    if (type === 'qr') setQrError('');
    if (type === 'manual') setManualError('');
    
    // 2. Validation for empty code
    if (!codeToUse) {
      if (type === 'manual') setManualError('Please enter a code');
      if (type === 'qr') setQrError('Invalid QR code scanned');
      return;
    }

    if (isLoading) return;
    
    // 3. Call Store
    const result = await joinGroup(codeToUse);

    // 4. Handle Result
    if (result.success) {
      setModalVisible(false);
      setGroupCode('');
      setQrError('');
      setManualError('');
      Alert.alert("Success", "Joined group successfully!");
    } else {
      const rawError = result.error ? result.error.toLowerCase() : '';
      let displayMsg = 'Failed to join group.';

      // --- SPECIFIC ERROR CHECKS ---
      if (rawError.includes('already a member')) {
         displayMsg = 'You are already a member of this group.';
      } 
      else if (rawError.includes('not found') || rawError.includes('invalid') || rawError.includes('does not exist')) {
         displayMsg = 'Group code does not exist.';
      }
      
      // Set error to the correct location
      if (type === 'qr') {
        setQrError(displayMsg);
      } else {
        setManualError(displayMsg);
      }
      
      setGroupCode('');
    }
  };

  const onCodeScanned = useCallback((codes) => {
    const value = codes[0]?.value;
    if (value) {
      setIsScanning(false); 
      try {
        const parsed = JSON.parse(value);
        if (parsed.code) {
          setGroupCode(parsed.code); 
          executeJoin(parsed.code, 'qr');
        }
      } catch (e) {
        setGroupCode(value);
        executeJoin(value, 'qr');
      }
    }
  }, []);

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
              setQrError('');
              setManualError('');
              setGroupCode('');
            }}>
              <Image source={icons.addgroup} className="w-8 h-8 tint-white" resizeMode="contain" />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [navigation, searchActive, searchQuery]);

  const handleCreateGroupNavigation = () => {
    setModalVisible(false);
    setGroupCode('');
    setQrError('');
    setManualError('');
    navigation.navigate('CreateGroup');
  };

  if (isScanning && device) {
    return (
      <View className="flex-1 bg-black">
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
        />
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
            setQrError('');
            setManualError('');
        }}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={() => {
            setModalVisible(false);
            setGroupCode('');
            setQrError('');
            setManualError('');
          }}
        >
          <Pressable className="bg-primary p-6 py-10 rounded-lg w-4/5 items-center" onPress={(e) => e.stopPropagation()}>
            <Text className="text-xl font-pbold mb-10 text-center text-white">ADD GROUP</Text>

            {/* Scan Button */}
            <TouchableOpacity 
                 className={`p-4 rounded-lg w-full items-center ${isLoading ? 'bg-gray-400' : 'bg-secondary'}`}
                onPress={() => {
                    setQrError('');
                    setManualError(''); 
                    setIsScanning(true);
                }}
            >
                <Text className="text-white text-base font-psemibold">{isLoading ? 'Opening Camera...' : 'Join with QR'}</Text>
            </TouchableOpacity>

            {/* QR ERROR AREA */}
            <View className="h-4 mb-4 mt-2 w-full justify-center">
                {qrError ? (
                    <Text className="text-red-500 text-xs font-pregular text-center">
                        {qrError}
                    </Text>
                ) : null}
            </View>

             <View className="flex-row items-center w-full mb-6">
                <View className="flex-1 h-[1px] bg-gray-600/50" />
                <Text className="text-gray-400 text-sm font-pmedium mx-4 uppercase">OR</Text>
                <View className="flex-1 h-[1px] bg-gray-600/50" />
            </View>
            
            {/* Input Row */}
            <View className="w-full flex-row gap-2 mb-2">
                <View className="flex-1 h-14 bg-gray-200 px-4 rounded-lg justify-center">
                    <TextInput
                        className="text-black font-pregular"
                        placeholder="Enter group code"
                        placeholderTextColor="#888"
                        value={groupCode}
                        onChangeText={(text) => {
                            setGroupCode(text);
                            if(manualError) setManualError(''); 
                        }}
                        autoCapitalize="none"
                    />
                </View>
            </View>

            {/* MANUAL ERROR AREA */}
            <View className="h-4 mb-4 w-full justify-center">
                {manualError ? (
                    <Text className="text-red-500 text-xs font-pregular text-center">
                        {manualError}
                    </Text>
                ) : null}
            </View>

            <TouchableOpacity
              className={`p-4 rounded-lg w-full items-center mb-6 ${isLoading ? 'bg-gray-400' : 'bg-secondary'}`}
              onPress={() => executeJoin(groupCode, 'manual')}
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