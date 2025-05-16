import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Modal, Alert, Platform, PermissionsAndroid, NativeModules,DeviceEventEmitter, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../constants';
import { useAuthStore } from '../../../store/authStore';
import { useGroupStore } from '../../../store/groupStore';
import { useCustomSoundStore } from '../../../store/customSoundStore';

// Access your native module
const { CustomAudioRecorderModule } = NativeModules;

// Create an event emitter for native events

const CustomSounds = () => {
    const navigation = useNavigation();

    // Zustand Store Hooks
    const { user } = useAuthStore();
    const { groupPointer } = useGroupStore();
    const {
        folders,
        isLoading,
        error,
        getFolders,
        addFolder,
        removeFolder,
        addSound,
        removeSound,
        getSoundById
    } = useCustomSoundStore();

    const currentGroupId = groupPointer?._id;
    const currentUserId = user?._id;

    // Local UI State
    const [isCreateFolderModalVisible, setCreateFolderModalVisible] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [isRecordModalVisible, setRecordModalVisible] = useState(false);
    const [recordingStatus, setRecordingStatus] = useState('idle'); // 'idle', 'recording', 'finished'
    const [recordDuration, setRecordDuration] = useState(0); // Current recording duration in ms
    const recordIntervalRef = useRef(null); // For polling or simulating progress if no native event
    const [recordedAudioBase64, setrecordedAudioBase64] = useState(null); // Store the recorded file 

    const [recordingTime, setRecordingTime] = useState(0);

    const MAX_RECORD_DURATION_MS = 5000; // 5 seconds

    // --- Effects ---
    useLayoutEffect(() => {
        // Ensure navigation and groupPointer are available
        if (navigation) { // Header elements like back button are needed even without groupPointer
            navigation.setOptions({
                headerTitle: () => (
                                    <Text className="font-psemibold text-xl text-white">{ "Custom Sound"}</Text>
                                ),
                headerStyle: {
                    backgroundColor: '#1a1a3d',
                    borderBottomWidth: 0, 
                    elevation: 0, 
                    shadowOpacity: 0, 
                },
                headerTintColor: 'white', 
                headerTitleAlign: 'left', 
            });
        }
    }, [navigation, groupPointer]);

    useEffect(() => {
        
        if (currentGroupId) {
            getFolders(currentGroupId);
        }
    }, [currentGroupId, getFolders]);

    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
        }
    }, [error]);

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            // Stop any ongoing recording or playback if the component unmounts
            if (recordingStatus === 'recording') {
                CustomAudioRecorderModule.stopRecording()
                    .catch(e => console.log("Error stopping recording on unmount:", e));
            }
            CustomAudioRecorderModule.stopPlayback()
                .catch(e => console.log("Error stopping playback on unmount:", e));
            if (recordIntervalRef.current) {
                clearInterval(recordIntervalRef.current);
            }

        };
    }, []);

    // --- Modal Toggles ---

    const toggleCreateFolderModal = () => {
        setCreateFolderModalVisible(!isCreateFolderModalVisible);
        setNewFolderName('');
    };

    const toggleRecordModal = () => {
        setRecordModalVisible(!isRecordModalVisible);
        // Reset recording state when opening/closing modal
        setRecordingStatus('idle');
        setRecordDuration(0);
        if (recordIntervalRef.current) {
            clearInterval(recordIntervalRef.current);
            recordIntervalRef.current = null;
        }
        // Stop any playback that might be happening from the modal
        CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping playback:", e));
    };

    // --- Folder Actions ---

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            Alert.alert('Input Error', 'Folder name cannot be empty.');
            return;
        }
        if (!currentGroupId) {
            Alert.alert('Error', 'No active group selected. Cannot create folder.');
            return;
        }

        const result = await addFolder(newFolderName.trim(), currentGroupId);
        if (result.success) {
            Alert.alert('Success', `Folder "${newFolderName}" created!`);
            toggleCreateFolderModal();
        } else {
            console.error('Failed to create folder:', result.error);
        }
    };

    const handleRemoveFolder = async (folderId, folderName) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete folder "${folderName}"? All sounds within it will also be deleted.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        const result = await removeFolder(folderId);
                        if (result.success) {
                            Alert.alert('Success', `Folder "${folderName}" removed!`);
                            if (selectedFolder?._id === folderId) {
                                setSelectedFolder(null);
                            }
                        } else {
                            console.error('Failed to remove folder:', result.error);
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const handleRemoveSound = async (soundId, soundName) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete sound "${soundName}"?`,
            [   
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        const result = await removeSound(soundId);
                        if (result.success) {
                            Alert.alert('Success', `Sound "${soundName}" removed!`);
                            if (selectedFolder) {
                                console.log('Selected folder:', selectedFolder);
                                setSelectedFolder(null);
                            }
                            getFolders(currentGroupId); // Refresh after deletion
                        } else {
                            console.error('Failed to remove sound:', result.error);
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const openFolder = (folder) => {
        console.log('Opening folder:', folder);
        setSelectedFolder(folder);
    };

    const closeFolder = () => {
        setSelectedFolder(null);
    };

    // --- Audio Recording Actions (Using Native Module) ---

    const requestAndCheckAudioPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                // Assuming your native module has a method to request permission
                const granted = await CustomAudioRecorderModule.requestMicrophonePermission();
                return granted;
            } catch (err) {
                console.error("Error requesting Android mic permission via native module:", err);
                Alert.alert('Permission Error', 'Failed to get audio recording permission. Please enable in app settings.');
                return false;
            }
        }
        // iOS permissions are typically handled by Info.plist entry; no explicit JS request needed
        return true;
    };


    const startRecording = async () => {
        const hasPermission = await requestAndCheckAudioPermissions();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Microphone permission is required to record audio.');
            return;
        }

        // Define a temporary file . Your native module should handle saving it.
        // It's good practice to let the native module decide the exact storage location
        // but pass a filename.
  
        try {
              setRecordDuration(0);
            setrecordedAudioBase64(null);
           
            setRecordingStatus('recording');
               recordIntervalRef.current = setInterval(() => {
                setRecordDuration(prevDuration => {
                    const newDuration = prevDuration + 100; // Increment by 100ms
                    // Stop JS timer if max duration is reached or exceeded
                    if (newDuration >= MAX_RECORD_DURATION_MS) {
                        clearInterval(recordIntervalRef.current);
                        recordIntervalRef.current = null;
                        // Trigger native stop if not already handled by native module
                        stopRecording();
                        return MAX_RECORD_DURATION_MS; // Cap at max duration for display
                    }
                    return newDuration;
                });
            }, 100); // Update every 100 milliseconds


            let audio = await CustomAudioRecorderModule.startRecording();
         
        // Start the timer
         
         
            // Listen for the recording finished event from the native module
           DeviceEventEmitter.addListener('onRecordingFinished', (data) => {
                 console.log('Native startRecording response:', data.base64);
                setrecordedAudioBase64(data.base64);
                setRecordingStatus('finished');
                setRecordDuration(0); // Reset duration after recording
                 if (recordIntervalRef.current) {
                clearInterval(recordIntervalRef.current);
                recordIntervalRef.current = null;
            }
               
            });

        } catch (error) {
            console.error('Failed to start recording via native module:', error);
            Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
            setRecordingStatus('idle');
            if (recordIntervalRef.current) {
                clearInterval(recordIntervalRef.current);
            }
        }
    };

    const playAudio = async (customSoundId) => {
        console.log('Playing sound with ID:', customSoundId);
        let sound = await getSoundById(customSoundId);  // ✅ await here
        console.log('Sound data:', sound);
        playRecordedSound(sound.sound.sound);
            
    }

    const stopRecording = async () => {
        try {
            if (recordIntervalRef.current) {
                clearInterval(recordIntervalRef.current);
                recordIntervalRef.current = null;
            }
           
             await CustomAudioRecorderModule.stopRecording(); 
         

        } catch (error) {
            console.error('Failed to stop recording via native module:', error);
            Alert.alert('Recording Error', 'Failed to stop recording.');
            setRecordingStatus('idle');
        }
    };

    const playRecordedSound = async (audio : string) => {
        if (audio.length === 0) {
            Alert.alert('No Sound', 'No sound recorded to play.');
            return;
        }
        try {
        
            await CustomAudioRecorderModule.playAudio(audio);
            // Optionally, add a listener for playback completion from your native module
            DeviceEventEmitter.addListener('onPlaybackFinished', () => {
                console.log('Playback finished');
            });
        } catch (error) {
            console.error('Failed to play sound via native module:', error);
            Alert.alert('Playback Error', 'Failed to play recorded sound.');
        }
    };

    const handleUploadRecordedSound = async () => {
        if (!recordedAudioBase64) {
            Alert.alert('No Sound', 'Please record a sound before uploading.');
            return;
        }
        if (!currentGroupId || !currentUserId) {
            Alert.alert('Error', 'User or group information missing. Cannot upload sound.');
            return;
        }

     


        Alert.alert(
            "Upload Confirmation",
            `Are you sure you want to upload this recorded sound${selectedFolder ? ` to "${selectedFolder.folderName}"` : ' without a folder'}?`,
            [
                { text: "Cancel", style: "cancel", onPress: () => { /* Do nothing */ } },
                {
                    text: "Upload",
                    onPress: async () => {
                        const result = await addSound( currentGroupId, currentUserId, selectedFolder._id ,`recorded_sound_${Date.now()}.wav`, recordedAudioBase64,);
                        if (result.success) {
                            Alert.alert('Success', `Sound "${fileName}" uploaded!`);
                            toggleRecordModal();
                            if (selectedFolder) {
                                setSelectedFolder(null);
                                getFolders(currentGroupId);
                            } else {
                                getFolders(currentGroupId);
                            }
                        } else {
                            console.error('Failed to upload recorded sound:', result.error);
                            Alert.alert('Upload Error', 'Failed to upload sound. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const formatDuration = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <View className='flex-1 justify-center items-center bg-primary'>
                <Text className='text-white text-lg'>Loading custom sounds...</Text>
            </View>
        );
    }

    return (
        <View className='bg-primary p-4 flex-1'>
            {/* Create New Folder Button */}
            <TouchableOpacity
                className="bg-secondary p-4 rounded-lg mb-8 items-center"
                onPress={toggleCreateFolderModal}
            >
                <Text className="text-white font-psemibold text-lg">Create New Folder</Text>
            </TouchableOpacity>

           

            <Text className='text-white my-3 font-psemibold text-lg'>Folders:</Text>
            <ScrollView className='w-full mb-4 flex-1'>
                {folders.length === 0  && !isLoading ? (
                    <Text className="text-gray-400 text-center mt-5">No folders or sounds yet. Create one or record a sound!</Text>
                ) : (
                    <>
                        {/* List Folders */}
                        {folders.map((folder) => (
                            <TouchableOpacity
                                key={folder._id}
                                className='bg-[#333366] p-4 mb-2 rounded-lg flex-row justify-between items-center'
                                onPress={() => openFolder(folder)}
                            >
                                <View className="flex-row items-center space-x-3 flex-1">
                                    <Image
                                        source={icons.folder}
                                        className="w-6 h-6 tint-white"
                                        resizeMode="contain"
                                    />
                                    <Text className="text-white font-pregular text-lg flex-shrink">{folder.folderName}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleRemoveFolder(folder._id, folder.folderName)} className="ml-4 p-2">
                                    <Image
                                        source={icons.deleteIcon}
                                        className="w-5 h-5 tint-red-500"
                                        resizeMode="contain"    
                                    />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}

                    
                       
                    </>
                )}
            </ScrollView>

            {/* Create Folder Modal */}
           {/* Create Folder Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isCreateFolderModalVisible}
                onRequestClose={toggleCreateFolderModal}
            >
                <Pressable
                className="flex-1 justify-center items-center bg-black/50"
                onPress={toggleCreateFolderModal} 
                >
                    <Pressable className="bg-primary p-6 rounded-lg w-4/5 items-center" onPress={(e) => e.stopPropagation()}> 
                        <Text className="text-xl font-psemibold mb-6 text-center text-white">Create New Folder</Text> 
            
                        <Text className="text-left w-full mb-2 text-white font-psemibold">Folder Name</Text> 
                        <View className="w-full h-14 bg-gray-200 px-4 rounded-lg justify-center mb-4"> 
                            <TextInput
                                className="flex-1 text-black font-pregular" 
                                placeholder="Enter folder name" 
                                placeholderTextColor="#888" 
                                value={newFolderName}
                                onChangeText={setNewFolderName}
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Buttons - Structure adjusted to vertical */}
                        <View className="flex-col justify-center items-center w-full"> 
                            {/* Create Button */}
                            <TouchableOpacity
                                className="bg-secondary py-4 px-6 rounded-lg mb-4 items-center w-full" // Added mb-4 and w-full, removed mr-4 and flex-1
                                onPress={handleCreateFolder}
                            >
                                <Text className="text-white text-base font-psemibold">Create</Text>
                            </TouchableOpacity>
                            {/* Cancel Button */}
                            <TouchableOpacity
                                className="py-4 px-6 rounded-lg items-center w-full" // Added w-full, removed flex-1
                                onPress={toggleCreateFolderModal}
                            >
                                <Text className="text-gray-400 text-base font-psemibold">Cancel</Text> 
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Folder Content Modal */} 
            <Modal
                animationType="slide"
                transparent={true}
                visible={selectedFolder !== null}
                onRequestClose={closeFolder}
            >
                <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
                    <View className="bg-primary p-6 rounded-lg w-80">
                        <Text className="text-white font-psemibold text-xl mb-4 text-center">{selectedFolder?.folderName}</Text>
                        <ScrollView style={{ maxHeight: 200 }}>
                            {selectedFolder?.sounds.length > 0 ? (
                                selectedFolder.sounds.map((sound) => (
                                    <View key={sound._id} className="bg-[#444477] p-3 mb-2 rounded-lg flex-row justify-between items-center">
                                        <View className="flex-row items-center space-x-3 flex-1">
                                            <Image
                                                source={icons.musicNote}
                                                className="w-6 h-6 tint-white"
                                                resizeMode="contain"
                                            />
                                            <Text className="text-white flex-shrink">{sound.filename} ({sound.userId?.username || 'Unknown'})</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleRemoveSound(sound._id, sound.filename)} className="ml-4 p-2">
                                            <Text>Delete</Text>
                                        </TouchableOpacity>
                                         <TouchableOpacity onPress={() =>  playAudio(sound._id)} className="ml-4 p-2">
                                            <Text>Play</Text>
                                        </TouchableOpacity>
                                       
                                    </View>
                                ))
                            ) : (
                                <Text className="text-gray-400 text-center">No sounds in this folder yet.</Text>
                            )}
                        </ScrollView>
                        <TouchableOpacity
                            className="bg-accent py-3 px-4 rounded-md mt-4 items-center"
                            onPress={() => {
                                toggleRecordModal();
                                // selectedFolder state will remain, so handleUploadRecordedSound can use its ID
                            }}
                        >
                            <Text className="text-white font-psemibold text-center">Record Sound to Folder</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="py-3 px-4 rounded-md mt-2 items-center" onPress={closeFolder}>
                            <Text className="text-gray-400 text-center">Close Folder</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Record Sound Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isRecordModalVisible}
                onRequestClose={toggleRecordModal}
            >
                <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
                    <View className="bg-primary p-6 rounded-lg w-80 flex items-center justify-center">
                        <Text className="text-white font-psemibold text-xl mb-4 text-center">Record New Sound</Text>
                        <Text className="text-gray-400 mb-3 text-center">
                            Record a 5-second audio clip {selectedFolder ? `for "${selectedFolder.folderName}"` : 'without a folder'}.
                        </Text>

                        <Text className={`text-3xl font-pbold mb-4 ${recordDuration >= MAX_RECORD_DURATION_MS ? 'text-red-500' : 'text-white'}`}>
                            {formatDuration(recordDuration)} / {formatDuration(MAX_RECORD_DURATION_MS)}
                        </Text>

                        {recordingStatus === 'idle' && (
                            <TouchableOpacity
                                className="bg-green-500 p-4 rounded-full w-20 h-20 items-center justify-center mb-4"
                                onPress={startRecording}
                            >
                                <Image
                                    source={icons.mic}
                                    className="w-10 h-10 tint-white"
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        )}
                        {recordingStatus === 'recording' && (
                            <TouchableOpacity
                                className="bg-red-500 p-4 rounded-full w-20 h-20 items-center justify-center mb-4 animate-pulse"
                                onPress={stopRecording}
                            >
                                <Image
                                    source={icons.stop}
                                    className="w-10 h-10 tint-white"
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        )}
                        {recordingStatus === 'finished' && (
                            <View className="flex-row items-center justify-center mb-4">
                                <TouchableOpacity
                                    className="bg-blue-500 p-3 rounded-full mr-2"
                                    onPress={playRecordedSound(recordedAudioBase64)}
                                >
                                    <Image
                                        source={icons.play}
                                        className="w-8 h-8 tint-white"
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="bg-gray-600 p-3 rounded-full"
                                    onPress={() => { setRecordingStatus('idle'); setRecordDuration(0); }}
                                >
                                    <Image
                                        source={icons.reload}
                                        className="w-8 h-8 tint-white"
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>
                            </View>
                        )}

                        <View className="flex-row justify-end mt-4 w-full">
                            <TouchableOpacity className="py-2 px-4 rounded-md mr-2" onPress={toggleRecordModal}>
                                <Text className="text-gray-400">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-accent py-2 px-4 rounded-md"
                                onPress={handleUploadRecordedSound}
                                disabled={recordingStatus !== 'finished' }
                            >
                                <Text className="text-white font-psemibold">Upload</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default CustomSounds;
