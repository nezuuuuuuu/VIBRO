import React, { useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  DeviceEventEmitter,
  TouchableOpacity,
  ScrollView,
  Image,
  PermissionsAndroid,
  Platform,
  NativeModules,
} from 'react-native';
import { useState, useRef } from 'react';
import { Double, Float } from 'react-native/Libraries/Types/CodegenTypes';

import "../../../global.css"
import DetectionDisplay from '../../components/detectionDisplay';
import { useAuthStore } from "../../../store/authStore";
import { useNavigation } from '@react-navigation/native';
import { useGroupStore } from '../../../store/groupStore';
import notifee from '@notifee/react-native';
import { icons } from '../../constants';
import {useDetectedSoundStore} from '../../../store/detectedSoundStore';

import {useSocket} from '../../../store/useSocket';

import RNFS from 'react-native-fs';

import { Buffer } from 'buffer';
import Sound from 'react-native-sound';
import { AndroidImportance } from '@notifee/react-native';


const { AudioRecorder, Flashlight } = NativeModules;

const ALLOWED_LABELS = ['siren', 'Ambulance (siren)', 'Police car (siren)', 'Glass', 'Siren', 'Speech'];
const NOTIF_LEVEL_1_ALLOWED_LABELS = ['Police car (siren)', 'Siren', 'Baby cry, infant cry'];
const NOTIF_LEVEL_2_ALLOWED_LABELS = ['Speech'];
const NOTIF_LEVEL_3_ALLOWED_LABELS = ['Glass'];


const CRITICAL_SOUND_LEVELS: { [key: string]: number } = {
  'siren': 1,
  'Ambulance (siren)': 1,
  'Police car (siren)': 1,
  'Siren': 1,
  'Glass': 2,
  'Speech': 3,
};

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



const LEGEND_INFO: {
  [key: number]: { label: string; colorClass: string; description: string };
} = {
  1: {
    label: "Level 1",
    colorClass: "bg-rose-500", 
    description: "High Criticality",
  },
  2: {
    label: "Level 2",
    colorClass: "bg-amber-400", 
    description: "Medium Criticality",
  },
  3: {
    label: "Level 3",
    colorClass: "bg-sky-500",
    description: "Informational",
  },
};


function Home() {
  const { socket, connect, disconnect,isOnline } = useSocket();
  const {getGroups} = useGroupStore()
  const { addSound} = useDetectedSoundStore();

  const navigation = useNavigation(); 
  const { user, token } = useAuthStore();
  const [predictions, setPredictions] = useState<any[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  
  const predictionQueue: { label: string; confidence: number; audioBase64?: string }[] = [];
  let isProcessing = false;


  const processQueue = async () => {
    isProcessing = true;
    while (predictionQueue.length > 0) {
      const prediction = predictionQueue.shift();
      if (prediction) await handlePrediction(prediction);
    }
    isProcessing = false;
  };


// const playBase64Audio = async (base64Audio: string) => {
//   try {
//     // 1. Decode base64 to binary (using Buffer correctly)
//     const audioBuffer = Buffer.from(base64Audio, 'base64');

//     // 2. Save it as a temporary WAV file
//     const filePath = `${RNFS.TemporaryDirectoryPath}/audio.wav`;
//     // RNFS.writeFile expects binary data, not a base64 string.  This is the key change.
//     await RNFS.writeFile(filePath, audioBuffer, 'utf8');

//     // 3. Play the audio
//     const playBase64Audio = async (base64Audio: string) => {
//       try {
//         // 1. Decode base64 to binary (using Buffer correctly)
//         const audioBuffer = Buffer.from(base64Audio, 'base64');
    
//         // 2. Save it as a temporary WAV file
//         const filePath = `${RNFS.TemporaryDirectoryPath}/audio.wav`;
//         // RNFS.writeFile expects binary data, not a base64 string.
//         await RNFS.writeFile(filePath, audioBuffer);
    
//         // 3. Play the audio
//         const sound = new Sound(filePath, '', (error) => {
//           if (error) {
//             console.error('Failed to load the sound', error);
//             return;
//           }
//           sound.play((success) => {
//             if (!success) {
//               console.error('Playback failed');
//             }
//             sound.release();
//           });
//         });
//       } catch (err) {
//         console.error('Error decoding or playing audio:', err);
//       }
//     };
    
    
//   } catch (err) {
//     console.error('Error decoding or playing audio:', err);
//   }
// };

  useLayoutEffect(() => {
    

    if (user) {
      navigation.setOptions({
        headerTitle: () => ( 
          <Text className="font-pbold text-2xl text-white">VIBRO</Text>
       ),
        headerRight: () => (
          <View className="flex-row items-center gap-2 mr-4">
              <Image
                  className="w-12 h-12 rounded-full bg-gray-300"
                  style={{ width: 30, height: 30, borderRadius: 50 }}
                  source={{ uri: `https://api.dicebear.com/9.x/personas/png?seed=${user?.username || "guest"}` }}
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
          const assetPath = 'VIBRO.tflite';
          const destinationPath = `${RNFS.DocumentDirectoryPath}/VIBRO.tflite`;
          // const fileExists = await RNFS.exists(destinationPath); // Optional: skip if exists
          // if (fileExists) {
          //  console.log('Model already copied to internal storage.');
          //  return destinationPath;
          // }
          await RNFS.copyFileAssets(assetPath, destinationPath);
          console.log('Model copied to internal storage successfully.');
          return destinationPath;
        } catch (error) {
          console.error('Failed to copy model to internal storage:', error);
          throw error; // Or handle more gracefully
        }
      };


  useEffect(()=>{
    copyModelToInternalStorage();
    console.log(RNFS.DocumentDirectoryPath); 


      const fetchAndConnect = async () => {
    try {
      const result = await getGroups();

      if (result && result.groups) {
        const groupIds = result.groups.map(group => group._id);
     
        const userId = user._id; 

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
  // if (Array.isArray(customPredictions)) {
  //   customPredictions.forEach(({ label, confidence }) => {
  //     predictionQueue.push({ label, confidence, audioBase64 });
  //     if (!isProcessing) processQueue();
  //   });
  // }

  if (Array.isArray(yamnetPredictions)) {
    yamnetPredictions.forEach(({ label, confidence }) => {
      predictionQueue.push({ label, confidence, audioBase64 });
      if (!isProcessing) processQueue();
    });
  }
});


  },[]);



const handlePrediction = async (prediction: { label: string, confidence: number, audioBase64: string  }) => {

  const { label, confidence, audioBase64 } = prediction; // Extract properties here
  const MIN_CONFIDENCE = 0.50;

  if (confidence >= MIN_CONFIDENCE ) {

    const currentTime = Date.now();

    const criticalLevel = CRITICAL_SOUND_LEVELS[label] || null;

    console.log(`Handling prediction: ${label}, criticalLevel: ${criticalLevel}`);

    setPredictions(prevPredictions => [
      ...prevPredictions,
      { label: label, confidence: confidence, timestamp: currentTime, audioBase64: audioBase64, criticalLevel: criticalLevel }
    ]);

    addSound(label, confidence, audioBase64);

      if (NOTIF_LEVEL_1_ALLOWED_LABELS.includes(label)) {
        await notifee.displayNotification({
          title: `Detected: ${label}`,
          body: `Confidence: ${(confidence * 100).toFixed(2)}% - LEVEL 1`,
          android: {
            channelId: 'sound-alerts3',
            importance: AndroidImportance.HIGH,
          },
        });
      }

      if (NOTIF_LEVEL_2_ALLOWED_LABELS.includes(label)) {
        await notifee.displayNotification({
          title: `Detected: ${label}`,
          body: `Confidence: ${(confidence * 100).toFixed(2)}% - LEVEL 2`,
          android: {
            channelId: 'sound-alerts1',
            importance: AndroidImportance.LOW,
          },
        });
        // await blinkFlashlight(3, 300);
      }

      if (NOTIF_LEVEL_3_ALLOWED_LABELS.includes(label)) {
        await notifee.displayNotification({
          title: `Detected: ${label}`,
          body: `Confidence: ${(confidence * 100).toFixed(2)}% - LEVEL 3`,
          android: {
            channelId: 'sound-alerts1',
            importance: AndroidImportance.DEFAULT,
          },
        });
        // await blinkFlashlight(5, 200);
      }

      // if (label.toLowerCase().includes('siren')) await flashLight();
      
    }
  };

// // Flashlight Di mugana
//   const blinkFlashlight = async (times = 5, interval = 200) => {
//       if (Platform.OS === 'android' && Platform.Version >= 23) {
//         const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
//           title: 'Camera Permission',
//           message: 'App needs access to the camera to flash the light.',
//           buttonPositive: 'OK',
//         });
    
//         if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//           console.warn('Camera permission denied.');
//           return;
//         }
//       }
    
//       for (let i = 0; i < times; i++) {
//         Torch.switchState(true);  // ON
//         await new Promise(res => setTimeout(res, interval));
//         Torch.switchState(false); // OFF
//         await new Promise(res => setTimeout(res, interval));
//       }
//     };
  
  async function startRecording() {
    if(isRecording) {
    stopRecording()
      return;
    }
    setIsRecording(true);
      const path = await AudioRecorder.startRecording();

   
   
  }
    async function playAudio(base64audio: string) {
      const path = await AudioRecorder.playAudio(base64audio);
  }
  async function stopRecording() {
    setIsRecording(false);
    const path = await AudioRecorder.stopRecording(); 
}



   return (
    <View className='h-full bg-primary' >
      <View className='items-center px-4'> 
        <Text className='mt-4 text-xl font-psemibold text-white'>Sounds Detected</Text>

        <View className="text-center my-3 w-full">
          
          <View className="flex-row flex-wrap items-center justify-center rounded-lg p-2 gap-x-10 gap-y-2">
            {Object.entries(LEGEND_INFO).map(([key, info]) => (
              <View key={key} className="flex-row items-center justify-center">
                <View className={`mr-1.5 h-3.5 w-3.5 rounded-sm ${info.colorClass} border border-gray-400`} />
                <View>
                  <Text className="text-xs font-pmedium text-white">{info.label}</Text>
                  <Text className="text-[10px] leading-tight font-pregular text-gray-300">{info.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <ScrollView className="w-full" style={{ height: '70%' }}> 
          
          {predictions.slice().reverse().map((prediction, index) => {
            return (
              <DetectionDisplay
                key={`${prediction.timestamp}-${index}`} 
                time={new Date(prediction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                confidence={`${(prediction.confidence * 100).toFixed(1)}%`}
                sound={prediction.label}
                audioBase64={prediction.audioBase64}
                criticalLevel={prediction.criticalLevel}
              />
            );
          })}
        </ScrollView>
      </View>

      <View className='absolute bottom-6 left-0 right-0 flex-row items-center justify-center'>
        <TouchableOpacity
            onPress={startRecording}
            className={`h-16 w-16 items-center justify-center rounded-full ${isRecording ? 'bg-red-500' : 'bg-secondary'}`}
            activeOpacity={0.7}
        >
            <Image source={isRecording ? icons.recording : icons.microphone} className="h-8 w-8" resizeMode='contain' />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default Home;
