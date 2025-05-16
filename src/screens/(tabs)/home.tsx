import React, { useEffect, useLayoutEffect } from 'react';
import { View, Text, Button, DeviceEventEmitter, TouchableOpacity, ScrollView, Image  } from 'react-native';
import { useState, useRef } from 'react';
import { NativeModules } from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import { Double, Float } from 'react-native/Libraries/Types/CodegenTypes';
const { AudioRecorder } = NativeModules;
import "../../../global.css"
import DetectionDisplay from '../../components/detectionDisplay';
import { useAuthStore } from "../../../store/authStore";
import { useNavigation } from '@react-navigation/native';
import { useGroupStore } from '../../../store/groupStore';
import { useModelStore } from '../../../store/modelStore';

import { icons } from '../../constants';
import {useDetectedSoundStore} from '../../../store/detectedSoundStore';

import {useSocket} from '../../../store/useSocket';

import RNFS from 'react-native-fs';

import { Buffer } from 'buffer';
import Sound from 'react-native-sound';


export async function requestMicPermission() {



  

  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'App needs access to your microphone to record audio.',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

function Home() {
      const {  fetchModelById, setActiveModel, useLabels,labels,activeModel } = useModelStore();

  const [isHandligPrediction,setIsHandlingPrediction]= useState(false);
  const { socket, connect, disconnect,isOnline } = useSocket();
  const {getGroups} = useGroupStore()
  const { addSound} = useDetectedSoundStore();

  const navigation = useNavigation(); 
  const { user, token } = useAuthStore();
  const [predictions, setPredictions] = useState<any[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const ALLOWED_LABELS = ['siren', 'Ambulance (siren)', 'Police car (siren)', 'Glass','Siren'];
  
  const predictionQueue: { label: string; confidence: number; audioBase64?: string }[] = [];
  let isProcessing = false;
  const processQueue = async () => {
  isProcessing = true;

  while (predictionQueue.length > 0) {
    const prediction = predictionQueue.shift(); // get next item

    if (prediction) {
      await handlePrediction(prediction); // process one at a time
    }
  }

  isProcessing = false;
};


const playBase64Audio = async (base64Audio: string) => {
  try {
    // 1. Decode base64 to binary (using Buffer correctly)
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // 2. Save it as a temporary WAV file
    const filePath = `${RNFS.TemporaryDirectoryPath}/audio.wav`;
    // RNFS.writeFile expects binary data, not a base64 string.  This is the key change.
    await RNFS.writeFile(filePath, audioBuffer, 'utf8');

    // 3. Play the audio
    const playBase64Audio = async (base64Audio: string) => {
      try {
        // 1. Decode base64 to binary (using Buffer correctly)
        const audioBuffer = Buffer.from(base64Audio, 'base64');
    
        // 2. Save it as a temporary WAV file
        const filePath = `${RNFS.TemporaryDirectoryPath}/audio.wav`;
        // RNFS.writeFile expects binary data, not a base64 string.
        await RNFS.writeFile(filePath, audioBuffer);
    
        // 3. Play the audio
        const sound = new Sound(filePath, '', (error) => {
          if (error) {
            console.error('Failed to load the sound', error);
            return;
          }
          sound.play((success) => {
            if (!success) {
              console.error('Playback failed');
            }
            sound.release();
          });
        });
      } catch (err) {
        console.error('Error decoding or playing audio:', err);
      }
    };
    
    
  } catch (err) {
    console.error('Error decoding or playing audio:', err);
  }
};

  useLayoutEffect(() => {
    

    if (user) {
      navigation.setOptions({
        headerTitle: () => ( 
          <Text className="font-pbold text-2xl text-white">VIBRO</Text>
       ),
        headerRight: () => (
          <View className="flex-row items-center gap-2 mr-4">
            <Image
                style={{ width: 20, height: 20, borderRadius: 50 }}
                source={{ uri: `https://api.dicebear.com/7.x/bottts/png?seed=${user?.username || "guest"}` }}
                resizeMode="cover"
              />
            <Text className="text-white font-psemibold">{user.username}</Text>
          </View>
        ),
        headerStyle: {
          backgroundColor: '#1B1B3A',
        },
      });
    }
  }, [navigation, user]);
  
  
  const copyModelToInternalStorage = async () => {
  try {
    // Path to the model in the assets folder
const assetPath = 'VIBRO.tflite';    // Path where the model will be copied to in internal storage
    const destinationPath = `${RNFS.DocumentDirectoryPath}/VIBRO.tflite`;

    // Check if the file already exists in internal storage
    const fileExists = await RNFS.exists(destinationPath);
    // if (fileExists) {
    //   console.log('Model already copied to internal storage.');
    //   return destinationPath;
    // }

    // Copy the model from assets to internal storage
    await RNFS.copyFileAssets(assetPath, destinationPath);
    console.log('Model copied to internal storage successfully.');
    return destinationPath;
  } catch (error) {
    console.error('Failed to copy model to internal storage:', error);
    throw error;
  }
};
  useEffect(()=>{
    copyModelToInternalStorage();
    console.log(RNFS.DocumentDirectoryPath); // Usually maps to filesDir


      const fetchAndConnect = async () => {
    try {
      const result = await getGroups(); // Calls your getGroups() above

      if (result && result.groups) {
        const groupIds = result.groups.map(group => group._id);
     
        const userId = user._id; // Or however you're storing user info

        connect(userId, groupIds); 


      
      }
    } catch (error) {
      console.error("Error connecting socket:", error);
    }
    console.log("safeee")
  };

  // Fetch groups and connect socket when the component mounts
  fetchAndConnect();
    


DeviceEventEmitter.addListener("onPrediction", (data) => {
  console.log("YAMNET PREDICTIONS:", data.yamnetPredictions);
  console.log("CUSTOM PREDICTIONS:", data.customPredictions);

  // If you want to work with the custom predictions:
  const { customPredictions, yamnetPredictions, audioBase64 } = data;

  // Example: Push predictions and audio data together
  if (Array.isArray(customPredictions)) {
    customPredictions.forEach(({ label, confidence }) => {
      predictionQueue.push({ label, confidence, audioBase64 });
      if (!isProcessing) processQueue();
    });
  }

  if (Array.isArray(yamnetPredictions)) {
    yamnetPredictions.forEach(({ label, confidence }) => {
      predictionQueue.push({ label, confidence, audioBase64 });
      if (!isProcessing) processQueue();
    });
  }
});


  },[]);



const handlePrediction = async (prediction: { label: string, confidence: number, audioBase64: string  }) => {
  const MIN_CONFIDENCE = 0.80;
  console.log(prediction.audioBase64)
 

  if (prediction.confidence >= MIN_CONFIDENCE ) {
    const currentTime = Date.now();


    setPredictions(prevPredictions => [
      ...prevPredictions,
      { label: prediction.label, confidence: prediction.confidence, timestamp: currentTime, audioBase64: prediction.audioBase64  }
    ]);
   
    addSound(prediction.label,prediction.confidence,prediction.audioBase64)

    
  }
};


  
  async function startRecording() {
    console.log("start recording",activeModel)
    if(isRecording) {
    stopRecording()
      return;
    }
    setIsRecording(true);
    if(!activeModel) {

      const path = await AudioRecorder.startRecording(0, [], 'asd');
    }
    if(activeModel.labels.length>0){
      const path = await AudioRecorder.startRecording(activeModel.labels.length, activeModel.labels, activeModel.name);

    }

   
   
  }
    async function playAudio(base64audio: string) {
      const path = await AudioRecorder.playAudio(base64audio);
  }
  async function stopRecording() {
    setIsRecording(false);
    const path = await AudioRecorder.stopRecording(); 
}



  return (
    <View className='bg-primary h-full' >
         <View className=' items-center justify-center'>
      <Text className='text-white text-lg'>Sound Detected</Text>
          
      <ScrollView className="h-3/4 w-full " >
     
                { predictions.slice().reverse().map((prediction, index) => (
                    
                    <DetectionDisplay key={index} time={new Date(prediction.timestamp).toLocaleTimeString()} confidence={ (prediction.confidence * 100).toFixed(2) + '%'} sound={prediction.label}
                    audioBase64={prediction.audioBase64}
                    />  
                    
              
                  
                ))}

            </ScrollView>
        </View>
        <View className=' justify-center items-center mt-4'>
        <View className="bg-secondary rounded-full items-center justify-center" style={{ width: 60, height: 60 }}>
        {isRecording ? (

                <TouchableOpacity onPress={stopRecording}>
                <Image source={icons.recording} />
                </TouchableOpacity>
              
                
              ) : (  
              <TouchableOpacity onPress={startRecording}>
                <Image source={icons.microphone} />
                </TouchableOpacity>
              
              )}
          </View>
        </View>


    </View>
  );
}

export default Home;
