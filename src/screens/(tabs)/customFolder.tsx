import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Platform, NativeModules, DeviceEventEmitter, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../constants';
import { useAuthStore } from '../../../store/authStore';
import { useGroupStore } from '../../../store/groupStore';
import { useCustomSoundStore } from '../../../store/customSoundStore';
import { useModelStore } from '../../../store/modelStore';

const { CustomAudioRecorderModule } = NativeModules;
const MAX_RECORD_DURATION_MS = 5000;

const CustomFolder = ({ route }) => {
    // 1. Rename route param to initialFolder to avoid confusion
    const { folder: initialFolder } = route.params;

    const { isTrainingModel } = useModelStore(); 
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { groupPointer } = useGroupStore();
    
    const {
        folders, // 2. Get the LIVE list of folders from the store
        getFolders,
        addSound,
        removeSound,
        getSoundById
    } = useCustomSoundStore();

    const currentGroupId = groupPointer?._id;
    const currentUserId = user?._id;

    // 3. FIND THE LIVE FOLDER
    // This updates automatically when you add/remove sounds
    const activeFolder = folders?.find(f => f._id === initialFolder?._id) || initialFolder;
    const soundsToDisplay = activeFolder?.sounds || [];

    // --- State Initialization ---
    const [isRecordModalVisible, setRecordModalVisible] = useState(false);
    const [recordingStatus, setRecordingStatus] = useState('idle');
    const [recordDuration, setRecordDuration] = useState(0); 
    const recordIntervalRef = useRef(null);
    const isManualStopRef = useRef(false);

    const [recordedAudioBase64, setRecordedAudioBase64] = useState(null);
    const [currentPlayingSoundId, setCurrentPlayingSoundId] = useState(null);
    const [playbackStatus, setPlaybackStatus] = useState('idle');
    const [loadingSoundId, setLoadingSoundId] = useState(null);
    const [playbackDuration, setPlaybackDuration] = useState(0); 
    const playbackIntervalRef = useRef(null);
    
    // --- Utility Functions ---
    const formatDuration = (ms) => {
        const seconds = (ms / 1000).toFixed(0); 
        return `${seconds}s`;
    };

    const clearPlaybackState = () => {
        if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
            playbackIntervalRef.current = null;
        }
        setPlaybackStatus('idle');
        setCurrentPlayingSoundId(null);
        setPlaybackDuration(0);
    }

    const toggleRecordModal = async () => {
        if (recordingStatus === 'recording') {
            await stopRecording(true);
        }
        await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping playback:", e));
        
        clearPlaybackState();

        setRecordModalVisible(prev => !prev);
        setRecordingStatus('idle');
        setRecordDuration(0);
        setRecordedAudioBase64(null);
        
        if (recordIntervalRef.current) {
            clearInterval(recordIntervalRef.current);
            recordIntervalRef.current = null;
        }
    };
    
    // --- Permissions & Recording ---
    const requestAndCheckAudioPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await CustomAudioRecorderModule.requestMicrophonePermission();
                return granted;
            } catch (err) {
                console.error("Error requesting Android mic permission:", err);
                Alert.alert('Permission Error', 'Failed to get audio recording permission.');
                return false;
            }
        }
        return true;
    };

    const startRecording = async () => {
        const hasPermission = await requestAndCheckAudioPermissions();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Microphone permission is required.');
            return;
        }
    
        try {
            setRecordDuration(1000); 
            setRecordedAudioBase64(null);
            setRecordingStatus('recording');
            clearPlaybackState();
            isManualStopRef.current = false;
            
            await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping prior playback:", e));
    
            recordIntervalRef.current = setInterval(() => {
                setRecordDuration(prev => {
                    const newDuration = prev + 100;
                    if (newDuration >= MAX_RECORD_DURATION_MS) {
                        stopRecording(false); 
                        return MAX_RECORD_DURATION_MS;
                    }
                    return newDuration;
                });
            }, 100);
    
            await CustomAudioRecorderModule.startRecording();
    
        } catch (error) {
            console.error('Failed to start recording:', error);
            Alert.alert('Recording Error', 'Failed to start recording.');
            setRecordingStatus('idle');
            setRecordDuration(0); 
            if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
        }
    };
    
    const stopRecording = async (isManual = true) => {
        if (recordingStatus !== 'recording') return;
        isManualStopRef.current = isManual;
    
        try {
            if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
            await CustomAudioRecorderModule.stopRecording();
        } catch (error) {
            console.error('Failed to stop recording:', error);
            setRecordingStatus('idle');
        }
    };
    
    // --- Playback Logic ---
    const playAudio = async (customSoundId) => {
        if (currentPlayingSoundId === customSoundId || playbackStatus === 'playing') {
            await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping playback:", e));
            clearPlaybackState();
            return;
        }
    
        await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping prior playback:", e));
        clearPlaybackState();
        setLoadingSoundId(customSoundId); 
    
        try {
            let sound = await getSoundById(customSoundId);
            if (sound && sound.sound?.sound) {
                setCurrentPlayingSoundId(customSoundId);
                await CustomAudioRecorderModule.playAudio(sound.sound.sound);
                setPlaybackStatus('playing');
            } else {
                Alert.alert('Playback Error', 'Sound data not found.');
            }
        } catch (error) {
            console.error('Failed to play sound:', error);
            Alert.alert('Playback Error', 'Failed to play recorded sound.');
            setCurrentPlayingSoundId(null);
        } finally {
            setLoadingSoundId(null); 
        }
    };
    
    const playRecordedSound = async (audioBase64) => {
        if (playbackStatus === 'playing') {
            await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping prior playback:", e));
            clearPlaybackState();
            if(currentPlayingSoundId === null) return;
        }
        if(currentPlayingSoundId !== null) {
             await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping prior playback:", e));
             setCurrentPlayingSoundId(null);
        }
    
        if (!audioBase64) {
            Alert.alert('No Sound', 'No sound recorded to play.');
            return;
        }
        
        try {
            setPlaybackStatus('playing');
            setPlaybackDuration(0); 
            const maxDuration = recordDuration > 0 ? recordDuration : MAX_RECORD_DURATION_MS;
            
            playbackIntervalRef.current = setInterval(() => {
                setPlaybackDuration(prev => {
                    const newDuration = prev + 100;
                    if (newDuration >= maxDuration) {
                        setTimeout(() => clearPlaybackState(), 100); 
                        return maxDuration;
                    }
                    return newDuration;
                });
            }, 100);

            await CustomAudioRecorderModule.playAudio(audioBase64);
        } catch (error) {
            console.error('Failed to play sound:', error);
            clearPlaybackState();
        }
    };

    // --- DELETE FUNCTION ---
   const handleRemoveSound = async (soundId, soundName) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete sound "${soundName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // FIX: Pass userId and groupId so the backend can verify ownership/permissions
            // Likely signature: removeSound(soundId, userId, groupId)
            const result = await removeSound(soundId, currentUserId, currentGroupId);

            if (result.success) {
              Alert.alert('Success', `Sound "${soundName}" removed!`);
              getFolders(currentGroupId);
            } else {
              console.error('Failed to remove sound:', result.error);
              Alert.alert('Deletion Error', result.error || 'Failed to remove sound.');
            }
          },
        }
      ]
    );
  };
    
    // --- Upload ---
    const handleUploadRecordedSound = async () => {
        if (!recordedAudioBase64) {
            Alert.alert('No Sound', 'Please record a sound before uploading.');
            return;
        }
    
        const defaultFileName = `recorded_sound_${Date.now()}.wav`;
        const folderName = activeFolder ? activeFolder.folderName : 'without a folder';
    
        Alert.alert(
            "Upload Confirmation",
            `Are you sure you want to upload "${defaultFileName}" to "${folderName}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Upload",
                    onPress: async () => {
                        const folderIdToUse = activeFolder ? activeFolder._id : null;
                        const result = await addSound(currentGroupId, currentUserId, folderIdToUse, defaultFileName, recordedAudioBase64);
                        
                        if (result.success) {
                            Alert.alert('Success', `Sound "${defaultFileName}" uploaded!`);
                            toggleRecordModal();
                            getFolders(currentGroupId); // Refresh store
                            setRecordedAudioBase64(null);
                            setRecordingStatus('idle');
                            clearPlaybackState();
                        } else {
                            Alert.alert('Upload Error', result.error || 'Failed to upload sound.');
                        }
                    }
                }
            ]
        );
    };

    // --- Side Effects ---
    useEffect(() => {
        const recordingListener = DeviceEventEmitter.addListener('onRecordingFinished', (data) => {
            if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);

            if (data && data.base64) {
                setRecordedAudioBase64(data.base64);
                setRecordingStatus('finished');
                if (isManualStopRef.current === false) {
                    setRecordDuration(MAX_RECORD_DURATION_MS);
                }
            } else {
                 setRecordingStatus('idle');
            }
        });

        const playbackListener = DeviceEventEmitter.addListener('onPlaybackFinished', () => {
            clearPlaybackState();
        });

        return () => {
            recordingListener.remove();
            playbackListener.remove();
            CustomAudioRecorderModule.stopRecording().catch(e => {});
            CustomAudioRecorderModule.stopPlayback().catch(e => {});
            if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
            if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
        };
    }, []); 

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                  <View className="flex-col items-left">
                    {/* Main Title */}
                    <Text className="font-pregular text-sm text-gray-200">
                      {groupPointer?.groupName}
                    </Text>
                    
                    {/* Subtitle */}
                      <Text className="font-pbold text-xl text-white">{activeFolder?.folderName || 'Folder Details'}</Text>
                  </View>
                ),
            headerStyle: { backgroundColor: '#1B1B3A' },
        });
    }, [navigation, activeFolder, groupPointer]);

    // --- Render Item for FlatList ---
    const renderSoundItem = ({ item: sound }) => (
        <View
            className="bg-[#444477] p-3 mb-2 rounded-lg flex-row justify-between items-center"
            onStartShouldSetResponder={() => true}
        >
            <View className="flex-row items-center space-x-3 flex-1">
                <Image
                    source={icons.musicnote}
                    className="w-6 h-6 tint-white"
                    resizeMode="contain"
                />
                <Text className="text-white flex-shrink">
                    {sound.filename} ({sound.userId?.username || 'Unknown'})
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => handleRemoveSound(sound._id, sound.filename)}
                className="ml-4 p-2"
            >
                <Image
                    source={icons.trash}
                    className="w-8 h-8 tint-red-500"
                    resizeMode="contain"
                />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => playAudio(sound._id)}
                className={`ml-2 p-2 rounded-full ${
                    currentPlayingSoundId === sound._id ? 'bg-gray-500' : 'bg-secondary'
                }`}
                disabled={loadingSoundId === sound._id}
            >
                {loadingSoundId === sound._id && currentPlayingSoundId !== sound._id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <Image
                        source={currentPlayingSoundId === sound._id ? icons.pause : icons.play}
                        className="w-8 h-8 tint-white"
                        resizeMode="contain"
                    />
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View className="flex-1 p-4 bg-primary">
            {/* FIX: Replaced Map with FlatList for Scrolling */}
            <FlatList
                data={soundsToDisplay}
                keyExtractor={(item) => item._id}
                renderItem={renderSoundItem}
                ListEmptyComponent={
                    <Text className="text-gray-400 font-pregular text-center mt-10">
                        No sounds in this folder yet.
                    </Text>
                }
                contentContainerStyle={{ paddingBottom: 100 }} // Prevents FAB from covering last item
            />

            {/* Fixed Bottom-Right Button */}
            <TouchableOpacity
                onPress={() => setRecordModalVisible(true)}
                className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-purple-600 justify-center items-center shadow-lg"
            >
                <Text className="text-white text-2xl font-bold">+</Text>
            </TouchableOpacity>

            {/* Record New Sound Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isRecordModalVisible}
                onRequestClose={toggleRecordModal}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-primary p-6 rounded-lg w-80 flex items-center justify-center">
                        <Text className="text-white font-psemibold text-xl mb-4 text-center">Record New Sound</Text>
                        <Text className="text-gray-400 mb-3 text-center">
                            Record a 5-second audio clip {activeFolder ? `for "${activeFolder.folderName}"` : 'without a folder'}.
                        </Text>
                        
                        <Text className={`text-3xl font-pbold mb-4 ${(recordDuration >= MAX_RECORD_DURATION_MS && playbackStatus !== 'playing') ? 'text-red-500' : 'text-white'}`}>
                             {playbackStatus === 'playing' && recordingStatus === 'finished' ? 
                                formatDuration(playbackDuration) : 
                                formatDuration(recordDuration)} 
                            / {formatDuration(MAX_RECORD_DURATION_MS)}
                        </Text>
                        
                        {recordingStatus === 'idle' && (
                            <TouchableOpacity
                                className="bg-secondary p-4 rounded-full w-20 h-20 items-center justify-center mb-4"
                                onPress={startRecording}
                            >
                                <Image source={icons.microphone} className="w-10 h-10 tint-white" resizeMode="contain" />
                            </TouchableOpacity>
                        )}
                        {recordingStatus === 'recording' && (
                            <TouchableOpacity
                                className="bg-red-500 p-4 rounded-full w-20 h-20 items-center justify-center mb-4 animate-pulse"
                                onPress={() => stopRecording(true)}
                            >
                                <Image source={icons.recording} className="w-10 h-10 tint-white" resizeMode="contain" />
                            </TouchableOpacity>
                        )}
                        
                        {recordingStatus === 'finished' && (
                            <View className="flex-row items-center justify-center mb-4">
                                <TouchableOpacity
                                    className={`p-3 rounded-full mr-2 ${playbackStatus === 'playing' ? 'bg-secondary' : 'bg-secondary'}`}
                                    onPress={async () => {
                                        if (playbackStatus === 'playing') {
                                            await CustomAudioRecorderModule.stopPlayback().catch(e => {});
                                            clearPlaybackState();
                                        } else {
                                            playRecordedSound(recordedAudioBase64);
                                        }
                                    }}
                                >
                                    <Image
                                        source={playbackStatus === 'playing' ? icons.pause : icons.play}
                                        className="w-8 h-8"
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="bg-gray-600 p-3 rounded-full"
                                    onPress={() => {
                                        clearPlaybackState();
                                        setRecordingStatus('idle');
                                        setRecordDuration(0);
                                        setRecordedAudioBase64(null);
                                    }}
                                >
                                    <Image source={icons.replay} className="w-8 h-8 tint-white" resizeMode="contain" />
                                </TouchableOpacity>
                            </View>
                        )}
                        
                        <View className="flex-row justify-end mt-4 w-full">
                            <TouchableOpacity className="py-2 px-4 rounded-md mr-2" onPress={toggleRecordModal}>
                                <Text className="text-gray-400">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`py-2 px-4 rounded-md ${recordingStatus !== 'finished' || playbackStatus === 'playing' ? 'bg-gray-500' : 'bg-secondary'}`}
                                onPress={handleUploadRecordedSound}
                                disabled={recordingStatus !== 'finished' || playbackStatus === 'playing'}
                            >
                                <Text className="text-white font-psemibold">Upload</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

export default CustomFolder;