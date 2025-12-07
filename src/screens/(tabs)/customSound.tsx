import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Modal, Alert, Platform, PermissionsAndroid, NativeModules, DeviceEventEmitter, TouchableWithoutFeedback, ActivityIndicator } from 'react-native'; // Import ActivityIndicator
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../constants';
import { useAuthStore } from '../../../store/authStore';
import { useGroupStore } from '../../../store/groupStore';
import { useCustomSoundStore } from '../../../store/customSoundStore';
import { useModelStore } from '../../../store/modelStore';

const { CustomAudioRecorderModule } = NativeModules;

const CustomSounds = () => {
  const { fetchAndCreateModel, isTrainingModel,downloadModel } = useModelStore(); // Get isTrainingModel state
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
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isRecordModalVisible, setRecordModalVisible] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [recordDuration, setRecordDuration] = useState(0);
  const recordIntervalRef = useRef(null);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState(null);
  const [currentPlayingSoundId, setCurrentPlayingSoundId] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState('idle');
  const [loadingSoundId, setLoadingSoundId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const MAX_RECORD_DURATION_MS = 5000;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
      <View className="flex-col items-left">
        {/* Main Title */}
        <Text className="font-pregular text-sm text-gray-200">
          {groupPointer?.groupName}
        </Text>
        
        {/* Subtitle */}
          <Text className="font-pbold text-xl text-white">
          Custom Sounds
        </Text>
      </View>
    ),
      headerStyle: {
        backgroundColor: '#1B1B3A',
      },
    });
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

  useEffect(() => {
    const recordingListener = DeviceEventEmitter.addListener('onRecordingFinished', (data) => {
      console.log('Native onRecordingFinished event received:', data);
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
        recordIntervalRef.current = null;
      }
      setRecordedAudioBase64(data.base64);
      setRecordingStatus('finished');
      setRecordDuration(0);
    });

    const playbackListener = DeviceEventEmitter.addListener('onPlaybackFinished', () => {
      console.log('Native onPlaybackFinished event received');
      setPlaybackStatus('idle');
      setCurrentPlayingSoundId(null);
    });

    return () => {
      recordingListener.remove();
      playbackListener.remove();
      CustomAudioRecorderModule.stopRecording()
        .catch(e => console.log("Error stopping recording on unmount:", e));
      CustomAudioRecorderModule.stopPlayback()
        .catch(e => console.log("Error stopping playback on unmount:", e));
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
        recordIntervalRef.current = null;
      }
    };
  }, []);

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
      getFolders(currentGroupId);
      toggleCreateFolderModal();
    } else {
      console.error('Failed to create folder:', result.error);
      Alert.alert('Creation Error', result.error || 'Failed to create folder.');
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
            try {
              const result = await removeFolder(folderId);

              // 1. Check if the specific 'filter' error occurred
              // This error means the store state was empty, so we assume the folder is gone or we just need to refresh.
              const isStateError = result.error && String(result.error).includes("'filter' of undefined");

              if (result.success || isStateError) {
                // If it was the state error, we force a refresh from the server to fix the UI
                if (isStateError) {
                  console.log("State desync detected (filter error). Refreshing folder list...");
                  getFolders(currentGroupId); 
                }

                Alert.alert('Success', `Folder "${folderName}" removed!`);

                // Clean up if the deleted folder was currently open
                if (selectedFolder?._id === folderId) {
                  setSelectedFolder(null);
                  setCurrentPlayingSoundId(null);
                  CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping playback on folder delete:", e));
                }
              } else {
                // Handle legitimate errors (e.g., server returned 500)
                console.error('Failed to remove folder:', result.error);
                Alert.alert('Deletion Error', result.error || 'Failed to remove folder.');
              }
            } catch (err) {
              console.error("Unexpected error in handleRemoveFolder:", err);
              // Even if it crashes here, try to refresh to ensure UI is up to date
              getFolders(currentGroupId);
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

  const openFolder = (folder) => {
    navigation.navigate('CustomFolder',{folder});
    // console.log('Opening folder:', folder);
    // setSelectedFolder(folder);
    // CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping playback on folder open:", e));
    // setCurrentPlayingSoundId(null);
  };

  const closeFolder = () => {
    setSelectedFolder(null);
    
    CustomAudioRecorderModule.stopPlayback().catch(e => console.log("Error stopping playback on folder close:", e));
    setCurrentPlayingSoundId(null);
  };

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
      `Are you sure you want to upload "${defaultFileName}"${selectedFolder ? ` to "${selectedFolder.folderName}"` : ' without a folder'}?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => { } },
        {
          text: "Upload",
          onPress: async () => {
            const folderIdToUse = selectedFolder ? selectedFolder._id : null;
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

  // Main loading state for the whole component
  if (isLoading && selectedFolder == null) {
    return (
      <View className='flex-1 justify-center items-center bg-primary'>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text className='mt-10 text-white font-pregular text-lg'>Loading custom sounds...</Text>
      </View>
    );
  }

    const handleDownloadModel = async () => {
        try {
          setIsDownloading(true);
          await downloadModel(currentGroupId, groupPointer.groupModelUrl);
          Alert.alert('Success', 'Model downloaded successfully! Check your Custom Sound Models Tab.');
        } catch (error) {
          console.error("Download failed", error);
          Alert.alert('Error', 'Failed to download model.');
        } finally {
          setIsDownloading(false); // Stop loading (success or fail)
        }
      };

    const handleTrainModel = async () => {
      try {
        await fetchAndCreateModel(currentGroupId, groupPointer.groupName);
        Alert.alert('Success', 'Model training complete! Ready for Download!');
        
      } catch (error) {
        console.error("Training failed", error);
        Alert.alert('Error', 'Failed to train model. Please try again.');
      }
    };

  return (
    <View className='bg-primary p-4 flex-1'>
      <TouchableOpacity
        className={`p-4 rounded-lg mb-4 items-center ${isTrainingModel ? 'bg-gray-500' : 'bg-secondary'}`}
        onPress={handleTrainModel}
        disabled={isTrainingModel} // Disable button during training
      >
        {isTrainingModel ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="text-white font-psemibold text-lg">Train Model</Text>
        )}
      </TouchableOpacity>
      
      
      <Text className="text-lightsecondary font-psemibold text-lg mb-2 text-center">Download Your Model Here:</Text>

    {/* Check if the model URL exists and is not 'PENDING' or empty */}
    {groupPointer?.groupModelUrl && 
    groupPointer.groupModelUrl !== "" &&
    groupPointer.groupModelUrl !== "PENDING" ? (
    
      // Download Model button (Active State)
      <TouchableOpacity
        className={`p-4 rounded-lg mb-4 items-center ${
          isTrainingModel || isDownloading ? 'bg-gray-500' : 'bg-secondary'
        }`}
        onPress={handleDownloadModel}
        disabled={isTrainingModel || isDownloading}
      >
        {isTrainingModel || isDownloading ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#fff" />
            <Text className="text-gray-200 font-pmedium">
              {isDownloading ? "Downloading..." : "Training..."}
            </Text>
          </View>
        ) : (
          <Text className="text-white font-psemibold text-lg">
            Download Model
          </Text>
        )}
      </TouchableOpacity>

    ) : (
      // Model Not Ready button (Disabled/Lower Opacity State)
      <TouchableOpacity
        className={`p-4 rounded-lg mb-4 items-center bg-secondary 
          ${isTrainingModel ? 'opacity-100 bg-gray-500' : 'opacity-50'} 
        `}
        onPress={() => {}} 
        disabled={true} 
      >
        {isTrainingModel ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="text-white font-psemibold text-lg">
            Model Not Ready
          </Text>
        )}
      </TouchableOpacity>
    )}

      {/* Loading overlay for model training */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isTrainingModel}
        onRequestClose={() => {}} // Disable closing by back button
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View className="bg-primary p-6 rounded-lg flex items-center justify-center">
            <ActivityIndicator size="large" color="#8A2BE2" />
            <Text className="text-white font-psemibold text-xl mt-4">Training Model...</Text>
            <Text className="text-gray-400 font-pregular text-sm mt-2 text-center">This may take a moment.</Text>
          </View>
        </View>
      </Modal>

      <Text className='text-white my-3 font-psemibold text-lg'>Sound Folders:</Text>
     <ScrollView className='w-full mb-4 flex-1'>
        {/* Check if there are no folders and not loading */}
        {folders.length === 0 && !isLoading ? (
          <Text className="text-gray-400 text-center mt-5">No folders or sounds yet. Create one or record a sound!</Text>
        ) : (
          <>
            {/* List of Folders */}
            {folders.map((folder) => (
              <TouchableOpacity
                key={folder._id}
                className='bg-[#333366] p-4 mb-2 rounded-lg flex-row justify-between items-center'
                onPress={() => openFolder(folder)}
                disabled={isTrainingModel} // Disable folder interaction during training
              >
                <View className="flex-row items-center space-x-3 flex-1">
                  <Image
                    source={icons.folder}
                    className="w-6 h-6 tint-white mr-2"
                    resizeMode="contain"
                  />
                  <Text className="text-white font-pregular text-lg flex-shrink">{folder.folderName}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => handleRemoveFolder(folder._id, folder.folderName)} 
                  className="ml-4 p-2" 
                  disabled={isTrainingModel}
                >
                  <Image
                    source={icons.trash}
                    className="w-6 h-6 tint-red-500"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}
        <TouchableOpacity
          className={`border-2 border-secondary p-4 rounded-lg mt-4 items-center ${
            isTrainingModel ? 'opacity-50' : '' 
          }`}
          onPress={toggleCreateFolderModal}
          disabled={isTrainingModel}
        >
          {/* 👇 FIX: Use a View to contain the icon and text */}
          <View className="flex-row items-center justify-center space-x-2 gap-5">
            <Text className="text-lightsecondary font-pbold text-2xl">+</Text>
            <Text className="text-lightsecondary font-psemibold text-lg">Create New Folder</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isCreateFolderModalVisible}
        onRequestClose={toggleCreateFolderModal}
      >
        <TouchableWithoutFeedback onPress={toggleCreateFolderModal}>
          <View className="flex-1 justify-center items-center bg-black/70">
            <TouchableWithoutFeedback onPress={() => { }}>
              <View className="bg-primary p-6 py-10 rounded-lg w-3/4">
                <Text className="text-white text-center text-xl font-psemibold mb-6">Create New Folder</Text>
                <TextInput
                  className="bg-white text-primary p-4 font-pregular rounded-md mb-4"
                  placeholder="Enter folder name"
                  placeholderTextColor="#ccc"
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                />
                <TouchableOpacity
                  onPress={handleCreateFolder}
                  className="bg-secondary p-4 rounded-lg w-full items-center mb-4"
                >
                  <Text className="text-white text-base font-psemibold">Create</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggleCreateFolderModal}
                  className="mt-2"
                >
                  <Text className="text-gray-400 font-psemibold mt-2 text-center">Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedFolder !== null}
        onRequestClose={closeFolder}
      >
        <TouchableWithoutFeedback onPress={closeFolder}>
          <View className="flex-1 justify-center items-center bg-black/50">
            {/* REMOVE the inner TouchableWithoutFeedback here */}
            <View
              className="bg-primary p-6 py-10 rounded-lg w-3/4"
              onStartShouldSetResponder={() => true} // Add this to prevent modal closing when tapping content
            >
              <Text className="text-white text-center text-xl font-psemibold mb-6">
                {selectedFolder?.folderName}
              </Text>
              <ScrollView style={{ maxHeight: 200 }} className="mb-4">
              {selectedFolder?.sounds.length > 0 ? (
                selectedFolder.sounds.map((sound) => (
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
                        {sound.filename} {sound.userId?.username || 'Unknown'}
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
            </ScrollView>
              <TouchableOpacity
                className="bg-secondary py-4 rounded-lg w-full items-center mb-4"
                onPress={() => {
                  toggleRecordModal();
                }}
              >
                <Text className="text-white font-psemibold text-base">
                  Record Sound to Folder
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="mt-2" onPress={closeFolder}>
                <Text className="text-gray-400 font-psemibold mt-2 text-center">
                  Close Folder
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
              Record a 5-second audio clip {selectedFolder ? `for "${selectedFolder.folderName}"` : 'without a folder'}.
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
  );
};

export default CustomSounds;