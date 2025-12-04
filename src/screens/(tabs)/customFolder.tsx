import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Modal, Alert, Platform, PermissionsAndroid, NativeModules, DeviceEventEmitter, TouchableWithoutFeedback, ActivityIndicator } from 'react-native'; // Import ActivityIndicator
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../constants';
import { useAuthStore } from '../../../store/authStore';
import { useGroupStore } from '../../../store/groupStore';
import { useCustomSoundStore } from '../../../store/customSoundStore';
import { useModelStore } from '../../../store/modelStore';
const { CustomAudioRecorderModule } = NativeModules;


const CustomFolder = ({ route }) => {
    const { folder } = route.params;

    const { fetchAndCreateModel, isTrainingModel } = useModelStore(); // Get isTrainingModel state
      const navigation = useNavigation();
    
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
    
      const [isCreateFolderModalVisible, setCreateFolderModalVisible] = useState(false);
      const [newFolderName, setNewFolderName] = useState('');
    //   const [folder, setfolder] = useState(null);
      const [isRecordModalVisible, setRecordModalVisible] = useState(false);
      const [recordingStatus, setRecordingStatus] = useState('idle');
      const [recordDuration, setRecordDuration] = useState(0);
      const recordIntervalRef = useRef(null);
      const [recordedAudioBase64, setRecordedAudioBase64] = useState(null);
      const [currentPlayingSoundId, setCurrentPlayingSoundId] = useState(null);
      const [playbackStatus, setPlaybackStatus] = useState('idle');
      const [loadingSoundId, setLoadingSoundId] = useState(null);
    
      const MAX_RECORD_DURATION_MS = 5000;

      const requestAndCheckAudioPermissions = async () => {
          if (Platform.OS === 'android') {
            try {
              const granted = await CustomAudioRecorderModule.requestMicrophonePermission();
              return granted;
            } catch (err) {
              console.error("Error requesting Android mic permission via native module:", err);
              Alert.alert('Permission Error', 'Failed to get audio recording permission. Please enable in app settings.');
              return false;
            }
          }
          return true;
        };

      const startRecording = async () => {
        const hasPermission = await requestAndCheckAudioPermissions();
        if (!hasPermission) {
          Alert.alert('Permission Denied', 'Microphone permission is required to record audio.');
          return;
        }
    
        try {
          setRecordDuration(0);
          setRecordedAudioBase64(null);
          setRecordingStatus('recording');
          setPlaybackStatus('idle');
          setCurrentPlayingSoundId(null);
          await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping prior playback:", e));
    
          recordIntervalRef.current = setInterval(() => {
            setRecordDuration(prevDuration => {
              const newDuration = prevDuration + 100;
              if (newDuration >= MAX_RECORD_DURATION_MS) {
                stopRecording();
                return MAX_RECORD_DURATION_MS;
              }
              return newDuration;
            });
          }, 100);
    
          await CustomAudioRecorderModule.startRecording();
          console.log('Native startRecording initiated.');
    
        } catch (error) {
          console.error('Failed to start recording via native module:', error);
          Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
          setRecordingStatus('idle');
          if (recordIntervalRef.current) {
            clearInterval(recordIntervalRef.current);
            recordIntervalRef.current = null;
          }
        }
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
                    getFolders(currentGroupId);
                    if (currentPlayingSoundId === soundId) {
                      setCurrentPlayingSoundId(null);
                      CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping playback on sound delete:", e));
                    }
                  } else {
                    console.error('Failed to remove sound:', result.error);
                    Alert.alert('Deletion Error', result.error || 'Failed to remove sound.');
                  }
                },
                style: 'destructive'
              }
            ]
          );
        };

      const stopRecording = async () => {
        if (recordingStatus !== 'recording') {
          console.log('Not currently recording. Skipping stop.');
          return;
        }
    
        try {
          if (recordIntervalRef.current) {
            clearInterval(recordIntervalRef.current);
            recordIntervalRef.current = null;
          }
    
          await CustomAudioRecorderModule.stopRecording();
          console.log('Native stopRecording initiated.');
    
        } catch (error) {
          console.error('Failed to stop recording via native module:', error);
          Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
          setRecordingStatus('idle');
        }
      };
    
      const playAudio = async (customSoundId) => {
        setLoadingSoundId(customSoundId);
        setCurrentPlayingSoundId(null);
        console.log('Attempting to play sound with ID:', customSoundId);
    
        if (currentPlayingSoundId === customSoundId) {
          console.log('Toggling playback for the same sound. Stopping.');
          await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping playback:", e));
          setCurrentPlayingSoundId(null);
          setLoadingSoundId(null);
          setPlaybackStatus('idle');
          return;
        }
    
        if (currentPlayingSoundId !== null) {
          console.log('Stopping currently playing sound before starting a new one.');
          await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping prior playback:", e));
          setCurrentPlayingSoundId(null);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
    
        if (playbackStatus === 'playing') {
          console.log('Stopping recorded sound before playing folder sound.');
          await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping recorded sound playback:", e));
          setPlaybackStatus('idle');
          await new Promise(resolve => setTimeout(resolve, 50));
        }
    
    
        console.log('Playing sound with ID:', customSoundId);
        try {
          let sound = await getSoundById(customSoundId);
          if (sound && sound.sound?.sound) {
            setCurrentPlayingSoundId(customSoundId);
            await CustomAudioRecorderModule.playAudio(sound.sound.sound);
            console.log('Native playAudio initiated.');
            setLoadingSoundId(null); 
          } else {
            Alert.alert('Playback Error', 'Sound data not found or invalid.');
            setCurrentPlayingSoundId(null);
            setLoadingSoundId(null); 
          }
        } catch (error) {
          setLoadingSoundId(null);
          console.error('Failed to play sound via native module:', error);
          Alert.alert('Playback Error', 'Failed to play recorded sound.');
          setCurrentPlayingSoundId(null);
        }
        setLoadingSoundId(null);
        setPlaybackStatus('playing');
    
      };
      
    
    
      const playRecordedSound = async (audioBase64) => {
        if (playbackStatus === 'playing') {
          console.log('Already playing recorded audio. Stopping current playback.');
          await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping prior playback:", e));
          setPlaybackStatus('idle');
          await new Promise(resolve => setTimeout(resolve, 50));
        }
    
        if (currentPlayingSoundId !== null) {
          console.log('Stopping any folder sound before playing recorded sound.');
          await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping prior playback:", e));
          setCurrentPlayingSoundId(null);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
    
        if (!audioBase64) {
          Alert.alert('No Sound', 'No sound recorded to play.');
          return;
        }
        try {
          setPlaybackStatus('playing');
          await CustomAudioRecorderModule.playAudio(audioBase64);
        } catch (error) {
          console.error('Failed to play sound via native module:', error);
          Alert.alert('Playback Error', 'Failed to play recorded sound.');
          setPlaybackStatus('idle');
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
    
        const defaultFileName = `recorded_sound_${Date.now()}.wav`;
    
        Alert.alert(
          "Upload Confirmation",
          `Are you sure you want to upload "${defaultFileName}"${folder ? ` to "${folder.folderName}"` : ' without a folder'}?`,
          [
            { text: "Cancel", style: "cancel", onPress: () => { } },
            {
              text: "Upload",
              onPress: async () => {
                const folderIdToUse = folder ? folder._id : null;
                const result = await addSound(currentGroupId, currentUserId, folderIdToUse, defaultFileName, recordedAudioBase64);
                if (result.success) {
                  Alert.alert('Success', `Sound "${defaultFileName}" uploaded!`);
                  toggleRecordModal();
                  getFolders(currentGroupId);
                  setRecordedAudioBase64(null);
                  setRecordingStatus('idle');
                  setPlaybackStatus('idle');
                  setCurrentPlayingSoundId(null);
                } else {
                  console.error('Failed to upload recorded sound:', result.error);
                  Alert.alert('Upload Error', result.error || 'Failed to upload sound. Please try again.');
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

    const toggleCreateFolderModal = () => {
        setCreateFolderModalVisible(!isCreateFolderModalVisible);
        setNewFolderName('');
    };

    const toggleRecordModal = () => {
        if (recordingStatus === 'recording') {
        stopRecording();
        }
        CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping playback:", e));
        setCurrentPlayingSoundId(null);

        setRecordModalVisible(!isRecordModalVisible);
        setRecordingStatus('idle');
        setRecordDuration(0);
        setRecordedAudioBase64(null);
        if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
        recordIntervalRef.current = null;
        }
        setPlaybackStatus('idle');
    };


  return (
    <View className="flex-1 p-4 bg-primary">
        {folder?.sounds.length > 0 ? (
            folder.sounds.map((sound) => (
                        <View
                          key={sound._id}
                          className="bg-[#444477] p-3 mb-2 rounded-lg flex-row justify-between items-center"
                          // Add this prop to ensure the View itself can become a responder
                          // This allows touches starting on this view to be handled by its parents (like ScrollView)
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
                              currentPlayingSoundId === sound._id
                                ? 'bg-gray-500'
                                : 'bg-secondary'
                            }`}
                            disabled={loadingSoundId === sound._id}
                          >
                            {loadingSoundId === sound._id && currentPlayingSoundId !== sound._id ? (
                              <ActivityIndicator size="small" color="#FFFFFF" /> // Show loader only if loading and not already playing
                            ) : (
                              <Image
                                source={
                                  currentPlayingSoundId === sound._id ? icons.pause : icons.play
                                }
                                className="w-8 h-8 tint-white"
                                resizeMode="contain"
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      ))
        ) : (
            <Text className="text-gray-400 font-pregular text-center">
                No sounds in this folder yet.
            </Text>
        )}

        {/* Fixed Bottom-Right Button */}
        <TouchableOpacity onPress={toggleCreateFolderModal}
            onPress={() => setRecordModalVisible(true)}
            className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-purple-600 justify-center items-center shadow-lg"
        >
            <Text className="text-white text-2xl font-bold">+</Text>
        </TouchableOpacity>

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
                      Record a 5-second audio clip {folder ? `for "${folder.folderName}"` : 'without a folder'}.
                    </Text>
        
                    <Text className={`text-3xl font-pbold mb-4 ${recordDuration >= MAX_RECORD_DURATION_MS ? 'text-red-500' : 'text-white'}`}>
                      {formatDuration(recordDuration)} / {formatDuration(MAX_RECORD_DURATION_MS)}
                    </Text>
        
                    {recordingStatus === 'idle' && (
                      <TouchableOpacity
                        className="bg-secondary p-4 rounded-full w-20 h-20 items-center justify-center mb-4"
                        onPress={startRecording}
                      >
                        <Image
                          source={icons.microphone}
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
                          source={icons.recording}
                          className="w-10 h-10 tint-white"
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    )}
                    {recordingStatus === 'finished' && (
                      <View className="flex-row items-center justify-center mb-4">
                        <TouchableOpacity
                          className={`p-3 rounded-full mr-2 ${playbackStatus === 'playing' ? 'bg-gray-500' : 'bg-secondary'}`}
                          onPress={async () => {
                            if (playbackStatus === 'playing') {
                              console.log('Stopping recorded audio.');
                              await CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping playback:", e));
                              setPlaybackStatus('idle');
                            } else {
                              console.log('Starting recorded audio playback.');
                              playRecordedSound(recordedAudioBase64);
                            }
                          }}
                        >
                          <Image
                            source={playbackStatus === 'playing' ? icons.pause : icons.play}
                            className="w-8 h-8 tint-white"
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="bg-gray-600 p-3 rounded-full"
                          onPress={() => {
                            setRecordingStatus('idle');
                            setRecordDuration(0);
                            setRecordedAudioBase64(null);
                            setPlaybackStatus('idle');
                          }}
                        >
                          <Image
                            source={icons.replay}
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

export default CustomFolder