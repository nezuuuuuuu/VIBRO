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
  Switch,
  Vibration,
  StatusBar,
} from 'react-native';
import { useState, useRef } from 'react';
import { Double, Float } from 'react-native/Libraries/Types/CodegenTypes';

import "../../../global.css"
import DetectionDisplay from '../../components/detectionDisplay';
import { useAuthStore } from "../../../store/authStore";
import { useNavigation } from '@react-navigation/native';
import { useGroupStore } from '../../../store/groupStore';
import { useModelStore } from '../../../store/modelStore';

import notifee from '@notifee/react-native';
import { icons } from '../../constants';
import {useDetectedSoundStore} from '../../../store/detectedSoundStore';

import {useSocket} from '../../../store/useSocket';

import RNFS from 'react-native-fs';

import { Buffer } from 'buffer';
import Sound from 'react-native-sound';
import { AndroidImportance } from '@notifee/react-native';
import Index from '../(welcome)';
import Profile from '../(tabs)/profile';


const { AudioRecorder, Flashlight } = NativeModules;

const NOTIF_LEVEL_1_ALLOWED_LABELS = ['Emergency vehicle',"Fire alarm", "Police car (siren)", "Ambulance (siren)", "Fire engine, fire truck (siren)",];
const NOTIF_LEVEL_2_ALLOWED_LABELS = [ 'Glass','Baby cry, infant cry','Crying, sobbing'];
const NOTIF_LEVEL_3_ALLOWED_LABELS = ['Speech','Music','Water','Water tap, faucet','Raindrop','Rain','Dog'];
const ACTIVE_SWITCH_COLOR = '#8A2BE2';
const INACTIVE_SWITCH_COLOR = '#767577';


const CRITICAL_SOUND_LEVELS: { [key: string]: number } = {
  
  'Emergency vehicle':1,
  'Fire alarm': 1,
  'Police car (siren)': 1,
  'Ambulance (siren)': 1,
  'Fire engine, fire truck (siren)': 1,

  'Crying, sobbing': 2,
  'Baby cry, infant cry': 2,
  'Glass': 2,


  'Speech': 3,
  'Music': 3,
  'Water tap, faucet': 3,
  'Raindrop': 3,
  'Water': 3,
  'Rain': 3,
  'Dog': 3,

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
    colorClass: "bg-yellow-300", 
    description: "Medium Criticality",
  },
  3: {
    label: "Level 3",
    colorClass: "bg-sky-500",
    description: "Informational",
  },
  4: {
    label: "Custom",
    colorClass: "bg-secondary",
    description: "Custom Group Model",
  },
};


function Home() {
  const {  fetchModelById, setActiveModel, useLabels,labels,activeModel } = useModelStore();

  const { socket, connect, disconnect,isOnline } = useSocket();
  const {getGroups} = useGroupStore()
  const { addSound} = useDetectedSoundStore();

  const navigation = useNavigation(); 
  const { user, token,setActiveStatus } = useAuthStore();
  const [predictions, setPredictions] = useState<any[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isMonitoringOn, setIsMonitoringOn] = useState(false);
  
  const predictionQueue: { isCustom: boolean, label: string; confidence: number; audioBase64?: string }[] = [];
  let isProcessing = false;


  const processQueue = async () => {
    isProcessing = true;
    while (predictionQueue.length > 0) {
      const prediction = predictionQueue.shift();
      if (prediction) await handlePrediction(prediction);
    }
    isProcessing = false;
  };



  useLayoutEffect(() => {

    if (user) {
      navigation.setOptions({
        headerTitle: () => ( 
          <Text className="font-pbold text-2xl text-white">VIBRO</Text>
       ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')} 
            className="flex-row items-center gap-2 mr-6"
          >
            <Image
              className="w-12 h-12 rounded-full bg-gray-300"
              style={{ width: 30, height: 30, borderRadius: 50 }}
              source={{ uri: `https://api.dicebear.com/9.x/personas/png?seed=${user?.username || "guest"}` }}
              resizeMode="cover"
            />
            <Text className="text-white font-psemibold">{user?.username || "Guest"}</Text>
          </TouchableOpacity>
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
    setIsMonitoringOn(user.isActive)

      const fetchAndConnect = async () => {
    try {
      const result = await getGroups();

      if (result && result.groups) {
        const groupIds = result.groups.map(group => group._id);
     
        const userId = user._id; 
        if(socket==null) {
        connect(userId, groupIds); 
        }


      
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

      const { customPredictions, yamnetPredictions, audioBase64 } = data;

      // Create a Set to track unique labels that have been added to the queue
      // This helps prevent duplicates if one event provides multiple very similar labels
      const processedLabels = new Set();

      if (Array.isArray(yamnetPredictions)) {
        yamnetPredictions.forEach(({ label, confidence }) => {
          if (!processedLabels.has(label)) { // Check if this label has already been processed
            predictionQueue.push({ isCustom: false, label, confidence, audioBase64 });
            processedLabels.add(label); // Add label to the set
          }
        });
      }

      if (Array.isArray(customPredictions)) {
        customPredictions.forEach(({ label, confidence }) => {
          // For custom predictions, also ensure uniqueness, possibly prefixing to differentiate
          const uniqueCustomLabel = `custom_${label}`;
          if (!processedLabels.has(uniqueCustomLabel)) {
            predictionQueue.push({ isCustom: true, label, confidence, audioBase64 });
            processedLabels.add(uniqueCustomLabel);
          }
        });
      }

      // Start processing the queue only if there are new items and it's not already running
      if (predictionQueue.length > 0 && !isProcessing) {
        processQueue();
      }
    });

    // Clean up the event listener when the component unmounts
    return () => {
      DeviceEventEmitter.removeAllListeners("onPrediction");
    };

  }, []);



const handlePrediction = async (prediction: { isCustom: boolean, label: string, confidence: number, audioBase64: string }) => {
        const { isCustom, label, confidence, audioBase64 } = prediction;
        // const MIN_CONFIDENCE = 0.50;

        console.log("Raw prediction received:", { label, confidence, isCustom });

     
            const currentTime = Date.now();
            const criticalLevel = CRITICAL_SOUND_LEVELS[label] || null;

            console.log(`Calculated criticalLevel for "${label}": ${criticalLevel}`);

            // This is the crucial condition for deciding whether to display and notify
            if (criticalLevel !== null || isCustom) {
                console.log(`>>> ACCEPTED PREDICTION: ${label}, criticalLevel: ${criticalLevel}, isCustom: ${isCustom}`);

                setPredictions(prevPredictions => [
                    ...prevPredictions,
                    { isCustom: isCustom, label: label, confidence: confidence, timestamp: currentTime, audioBase64: audioBase64, criticalLevel: criticalLevel }
                ]);
                addSound(label, confidence, audioBase64);
                // --- VIBRATION LOGIC ADDED HERE ---
                if (NOTIF_LEVEL_1_ALLOWED_LABELS.includes(label)) {
                    Vibration.vibrate([0, 500, 200, 500]); // Vibrate for 500ms, pause 200ms, vibrate 500ms (High urgency)
                    await notifee.displayNotification({
                        title: `Detected: ${label}`,
                        body: `Confidence: ${(confidence * 100).toFixed(2)}% - LEVEL 1`,
                        android: {
                            channelId: 'sound-alerts3',
                            importance: AndroidImportance.HIGH,
                        },
                    });
                } else if (NOTIF_LEVEL_2_ALLOWED_LABELS.includes(label)) {
                    Vibration.vibrate(500); // Vibrate for 500ms (Medium urgency)
                    await notifee.displayNotification({
                        title: `Detected: ${label}`,
                        body: `Confidence: ${(confidence * 100).toFixed(2)}% - LEVEL 2`,
                        android: {
                            channelId: 'sound-alerts3',
                            importance: AndroidImportance.MIN,
                        },
                    });
                } else if (NOTIF_LEVEL_3_ALLOWED_LABELS.includes(label)) {
                    // Vibration.vibrate(200); // Vibrate for 200ms (Low urgency)
                    await notifee.displayNotification({
                        title: `Detected: ${label}`,
                        body: `Confidence: ${(confidence * 100).toFixed(2)}% - LEVEL 3`,
                        android: {
                            channelId: 'sound-alerts1',
                            importance: AndroidImportance.LOW,
                        },
                    });
                } else if (isCustom) {
                    Vibration.vibrate([0, 1000]); // Vibrate for 1000ms (Distinct for custom sounds)
                    await notifee.displayNotification({
                        title: `Detected Custom Sound: ${label}`,
                        body: `Confidence: ${(confidence * 100).toFixed(2)}% - Custom Model`,
                        android: {
                            channelId: 'sound-alerts2',
                            importance: AndroidImportance.HIGH,
                        },
                    });
                }
            } else {
                console.log(`--- FILTERED OUT: "${label}" (Not Critical and Not Custom). Confidence: ${(confidence * 100).toFixed(2)}%`);
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
    console.log("start recording",activeModel)
    if(isRecording) {
    stopRecording()
      return;
    }
      // Request permission *before* attempting to start recording
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      console.warn("Microphone permission denied. Cannot start recording.");
      // Optionally, show a user-friendly message or alert
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
const handleToggle = () => {
  if (isMonitoringOn) {
   setActiveStatus(false);
  } else {
    setActiveStatus(true);
  }
  // Toggle the state
setIsMonitoringOn(!isMonitoringOn);
}



   return (
    <View className='h-full bg-primary' >
      <View className='items-center px-4'> 
        <Text className='mt-4 text-xl font-psemibold text-white'>Sounds Detected</Text>

        <View className="text-center my-3 w-full">
          
          {/* Legend items container */}
      <View className="ml-10 flex-row flex-wrap justify-center max-w-lg"> 
        
        {Object.entries(LEGEND_INFO).map(([key, info]) => (

          <View key={key} className="w-1/2 flex-row items-start py-1"> 
           
        
            <View className="flex-shrink-0 mr-2 mt-2">
              
              <View className={`h-3.5 w-3.5 rounded-sm ${info.colorClass} border border-gray-400`} />
            </View>
           
            <View className="flex-1">
              <Text className="text-xs font-pmedium text-white">{info.label}</Text>
              <Text className="text-xs leading-tight font-pregular text-gray-300">{info.description}</Text>
            </View>
            
          </View>
        ))}
        
      </View>
                <View className="p-4">
                  <View className="flex flex-row items-center justify-between py-2">
                    <View className="flex-1 mr-4">
                      <Text className="text-base font-pmedium text-gray-200">
                        Enable Group Monitoring
                      </Text>
                      <Text className="text-xs font-pregular text-gray-400 mt-1">
                        When enabled, detected sounds will be visible to your group members.
                      </Text>
                    </View>
                    <Switch
                      onValueChange={() => handleToggle()}
                      trackColor={{ false: INACTIVE_SWITCH_COLOR, true: ACTIVE_SWITCH_COLOR }}
                      thumbColor={isMonitoringOn ? "#f4f3f4" : "#f4f3f4"} 
                      value={isMonitoringOn}
                      ios_backgroundColor={INACTIVE_SWITCH_COLOR} //
                    />
                  </View>
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
      <StatusBar className='bg-primary' />
    </View>
  );
}

export default Home;
