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
  Modal,
  Alert,
} from 'react-native';
import { useState, useRef } from 'react';
import { Double, Float } from 'react-native/Libraries/Types/CodegenTypes';
import MorphingCircle from "../../components/morphingCircle"; 
import PredictedCircles from "../../components/predictedCircles"; 
import BASE_URL from '../../../store/api';


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
import { useAppStore } from '../../../store/appStore';


const { AudioRecorder, Flashlight } = NativeModules;

const NOTIF_LEVEL_1_ALLOWED_LABELS = ['Police car (siren)', 'Siren', 'Ambulance (siren)', 'siren', 'Fire engine, fire truck (siren)','Fire alarm', 'Emergency vehicle'];
const NOTIF_LEVEL_2_ALLOWED_LABELS = [ 'Glass','Baby cry, infant cry','Crying, sobbing'];
const NOTIF_LEVEL_3_ALLOWED_LABELS = ['Glass','Speech','Music'];
const ACTIVE_SWITCH_COLOR = '#8A2BE2';
const INACTIVE_SWITCH_COLOR = '#767577';



const BACKGROUND_LABELS = ['Background','Silence'];

 
const CRITICAL_SOUND_LEVELS: { [key: string]: number } = {
  
  'siren': 1,
  'Ambulance (siren)': 1,
  'Police car (siren)': 1,
  'Siren': 1,
  'Fire engine, fire truck (siren)': 1,
  'Fire alarm': 1,
  'Glass': 2,
  'Speech': 3,
  'Music': 3,
  'Crying, sobbing': 2,
  'Baby cry, infant cry': 2,
  'Emergency vehicle': 1
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
  const lastDetectionTimeRef = useRef({});
  const {  fetchModelById, setActiveModel, useLabels,labels,activeModel } = useModelStore();

  const { socket, connect, disconnect,isOnline } = useSocket();
  const {getGroups, groups} = useGroupStore()
  const { addSound,isMonitoringOn,loadMonitoringState,isMonitoringLoaded} = useDetectedSoundStore();
  const { isOfflineMode, isLoadingOfflineModeToggle, toggleOfflineMode } = useAppStore();
  const [box, setBox] = useState({ width: 0, height: 0 });

  const navigation = useNavigation(); 
  const { user, token,setActiveStatus } = useAuthStore();
  const [predictions, setPredictions] = useState<any[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  
  const predictionQueue: { isCustom: boolean, label: string; confidence: number; audioBase64?: string }[] = [];
  let isProcessing = false;

  const monitoringRef = useRef(false);
  const socketRef = useRef(null);

  const [safetyModalVisible, setSafetyModalVisible] = useState(false);
  const [currentCriticalSound, setCurrentCriticalSound] = useState<string | null>(null);


  const processQueue = async () => {
    isProcessing = true;
    while (predictionQueue.length > 0) {
      const prediction = predictionQueue.shift();
      if (prediction) await handlePrediction(prediction);
    }
    isProcessing = false;
  };

   const sendGroupMessage = async (messageContent: string) => {
    // 1. Get groups from state
    // We use getState() to ensure we have the absolute latest value, not a stale render value
    let currentGroups = useGroupStore.getState().groups;

    // 2. ROBUST CHECK: If state is empty, try to fetch fresh from API immediately
    if (!currentGroups || currentGroups.length === 0) {
      console.log("⚠️ Groups list is empty. Attempting to fetch fresh groups...");
      try {
        // We assume getGroups returns { groups: [...] } based on your useEffect code
        const result = await getGroups(); 
        
        if (result && result.groups && result.groups.length > 0) {
           console.log("✅ Freshly fetched groups:", result.groups.length);
           currentGroups = result.groups;
        } else {
           // If it's STILL empty after fetching, then the user really isn't in a group
           console.warn("❌ Fetch returned no groups.");
           Alert.alert("Notice", "You are not part of any groups, so no one was notified.");
           return;
        }
      } catch (error) {
         console.error("Failed to fetch groups on demand:", error);
         return;
      }
    }

    // 3. Proceed to send
    try {
      console.log(`🚀 Broadcasting message to ${currentGroups.length} groups...`);

      const sendPromises = currentGroups.map(async (group) => {
        const messageData = {
          groupId: group._id,
          messageType: 'text',
          message: messageContent,
          imageUrl: null,
        };

        const response = await fetch(`${BASE_URL}/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(messageData),
        });

        if (!response.ok) throw new Error('Failed to send');
        return response.json();
      });

      await Promise.all(sendPromises);
      console.log("✅ Alert successfully sent to all groups.");

    } catch (err) {
      console.error('Error broadcasting message:', err);
    }
  };



  useLayoutEffect(() => {

    if (user) {
      navigation.setOptions({
        headerTitle: () => ( 
          <Text className="font-pbold text-3xl text-white">VIBRO</Text>
       ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')} 
            className="flex-row items-center gap-2 py-2 px-3 mr-6 bg-secondary/5 p-1 rounded-lg"
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
          // console.log('Model copied to internal storage successfully.');
          return destinationPath;
        } catch (error) {
          console.error('Failed to copy model to internal storage:', error);
          throw error; // Or handle more gracefully
        }
      };

useEffect(() => {
  loadMonitoringState();
}, []);
useEffect(() => {
  monitoringRef.current = isMonitoringOn;
}, [isMonitoringOn]);

useEffect(() => {
  socketRef.current = socket;
}, [socket]);
  useEffect(()=>{
  
    copyModelToInternalStorage();
    console.log(RNFS.DocumentDirectoryPath); 
    // This line initializes isMonitoringOn with user.isActive, which is correct.
    // No need to set it again outside of its initial state.
    // setIsMonitoringOn(user.isActive) 

      const fetchAndConnect = async () => {
      try {
       // Connect only if not in offline mode initially (or when component mounts)
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
  if(!isOfflineMode && socket === null) { 
    fetchAndConnect();
  }
    

  // Event listener for predictions
  DeviceEventEmitter.addListener("onPrediction", (data) => {
      console.log("YAMNET PREDICTIONS:", data.yamnetPredictions);
      console.log("CUSTOM PREDICTIONS:", data.customPredictions);

      const { customPredictions, yamnetPredictions, audioBase64 } = data;

      // Process Yamnet predictions
      if (Array.isArray(yamnetPredictions)) {
        yamnetPredictions.forEach(({ label, confidence }) => {
          console.log("Label", label)
          if(label in CRITICAL_SOUND_LEVELS){
            predictionQueue.push({ isCustom : false, label, confidence, audioBase64 });
          }

          if (!isProcessing) processQueue();
        });
      }

      // Process custom predictions
      if (Array.isArray(customPredictions)) {
        customPredictions.forEach(({ label, confidence }) => {
          // FIX: Use .includes() for array check
          if(BACKGROUND_LABELS.includes(label)){
            // console.log(`Filtered out background label: ${label}`);
          }
          else{
            predictionQueue.push({ isCustom : true, label, confidence, audioBase64 });
            if (!isProcessing) processQueue();
          }
        });
      }
    });

    // Clean up the event listener when the component unmounts
    // You should return a cleanup function from useEffect
    return () => {
      DeviceEventEmitter.removeAllListeners("onPrediction");
    };
  }, [isOfflineMode, user]); // Added user to dependency array as setIsMonitoringOn depends on it


const handlePrediction = async (prediction: { isCustom: boolean, label: string, confidence: number, audioBase64: string }) => {
        const MIN_INTERVAL = 5000; // 5 seconds

        const { isCustom, label, confidence, audioBase64 } = prediction;
        // const MIN_CONFIDENCE = 0.50;
        
      
            const currentTime = Date.now();
            const criticalLevel = CRITICAL_SOUND_LEVELS[label] || 4;
            const lastTime = lastDetectionTimeRef.current[label];

            if (lastTime && currentTime - lastTime < MIN_INTERVAL) {
                console.log(`⏳ SKIPPED: ${label} occurred again within 5 seconds`);
                return; // ❌ stop processing — skip everything
            }
            console.log("Raw prediction received:", { label, confidence, isCustom });
            lastDetectionTimeRef.current[label] = currentTime;

            console.log(`Calculated criticalLevel for "${label}": ${criticalLevel}`);

            // This is the crucial condition for deciding whether to display and notify
            if (criticalLevel !== null || isCustom) {
                console.log(`>>> ACCEPTED PREDICTION: ${label}, criticalLevel: ${criticalLevel}, isCustom: ${isCustom}`);

                setPredictions(prevPredictions => [
                    ...prevPredictions,
                    { isCustom: isCustom, label: label, confidence: confidence, timestamp: currentTime, audioBase64: audioBase64, criticalLevel: criticalLevel }
                ]);
                  console.log('🧪 SEND CHECK (REF):', {
                  isMonitoringOn: monitoringRef.current,
                  socketExists: !!socketRef.current,
                  socketConnected: socketRef.current?.connected,
                });              // Only send sound to socket if monitoring is on and socket is connected
                
                if( monitoringRef.current &&
                  socketRef.current &&
                  socketRef.current.connected &&criticalLevel == 1) {
                  console.log("Sending detected sound to socket:", { label, confidence, isCustom, audioBase64 });
                  addSound(label, confidence, audioBase64);
                }

                // --- NEW: SAFETY CHECK LOGIC (Level 1 Only) ---
                if (criticalLevel === 1 && !safetyModalVisible) {
                    // 1. Set state to show modal
                    setCurrentCriticalSound(label);
                    setSafetyModalVisible(true);

                    // 2. Automatic Socket Message
                    // "EMERGENCY ALERT: [Fire Alarm] detected..."
                    const autoMessage = `🚨 EMERGENCY ALERT: ${label} detected. Waiting for user confirmation...`;
                    sendGroupMessage(autoMessage);
                }

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
//  const blinkFlashlight = async (times = 5, interval = 200) => {
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


    if (!isMonitoringLoaded) {
      return (
        <View className="flex-1 bg-primary items-center justify-center">
          <Text className="text-white">Loading monitoring state...</Text>
        </View>
      );
    }

      const handleUserSafe = () => {
        // User clicked "I AM SAFE"
        const message = `✅ I AM SAFE. The detected ${currentCriticalSound} has been acknowledged.`;
    sendGroupMessage(message);
        
        // Close modal
        setSafetyModalVisible(false);
        setCurrentCriticalSound(null);
      };

      const handleUserHelp = () => {
        // User clicked "HELP ME"
        const message = `🆘 HELP NEEDED! Confirmed critical sound: ${currentCriticalSound}. Please assist!`;
        sendGroupMessage(message);
        
        // Close modal (or keep open depending on preference)
        setSafetyModalVisible(false);
        setCurrentCriticalSound(null);
      };

    return (
     <View className='h-full bg-primary' >
       <View className='items-center px-4'> 
         <Text className='mt-4 text-2xl font-pbold text-white'>Sounds Detected</Text>
               {/* <MorphingCircle /> */}


         <View className="text-center my-3 w-full">
           
           {/* Legend items container */}
       <View className="ml-10 flex-row flex-wrap justify-center max-w-lg"> 
         
         {Object.entries(LEGEND_INFO).map(([key, info]) => (

           <View key={key} className="w-1/2 flex-row items-start py-1"> 
             
         
             <View className="flex-shrink-0 mr-2 mt-2">
               
               <View className={`h-3.5 w-3.5 rounded-sm ${info.colorClass} border border-gray-400`} />
             </View>
             
             <View className="flex-1">
               <Text className="text-sm font-pmedium text-white">{info.label}</Text>
               <Text className="text-sm leading-tight font-pregular text-gray-300">{info.description}</Text>
             </View>
             
           </View>
         ))}
         
       </View>
                 {/* <View className="p-4">
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
                 </View> */}
         </View>

        <View
  style={{
    height: '70%',
    width: '90%',
    borderWidth: 2,
    borderColor: 'red',
  }}
  onLayout={(e) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ width, height });
  }}
>
  {box.width > 0 && (
    <PredictedCircles
      predictions={predictions}
      containerWidth={box.width}
      containerHeight={box.height}
    />
  )}
</View>
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

      <Modal
      animationType="slide"
      transparent={true}
      visible={safetyModalVisible}
      onRequestClose={() => setSafetyModalVisible(false)}
      >
      <View className="flex-1 justify-center items-center bg-black/80">
          <View className="w-[85%] bg-[#1B1B3A] border-2 border-red-500 rounded-2xl p-6 items-center shadow-lg">
          
          {/* Icon / Header */}
          <View className="h-16 w-16 bg-red-500 rounded-full items-center justify-center mb-4 animate-pulse">
              <Image source={icons.warning} className="h-10 w-10 tint-white" resizeMode="contain" /> 
              {/* If you don't have a warning icon, use a standard text '!' */}
          </View>

          <Text className="text-white text-2xl font-pbold mb-2 text-center">
              HIGH CRITICALITY ALERT!
          </Text>
          
          <Text className="text-gray-300 text-base text-center mb-6 font-pregular">
              <Text className="text-red-400 font-pbold">{currentCriticalSound}</Text> detected. 
              Are you safe?
          </Text>

          {/* Action Buttons */}
          <View className="w-full gap-4">
              
              {/* I AM SAFE BUTTON */}
              <TouchableOpacity 
              onPress={handleUserSafe}
              className="w-full bg-emerald-500 py-4 rounded-xl items-center active:bg-emerald-600"
              >
              <Text className="text-white text-lg font-pbold">I AM SAFE</Text>
              </TouchableOpacity>

              {/* HELP ME BUTTON */}
              <TouchableOpacity 
              onPress={handleUserHelp}
              className="w-full bg-red-600 py-4 rounded-xl items-center active:bg-red-700"
              >
              <Text className="text-white text-lg font-pbold">HELP ME</Text>
              </TouchableOpacity>

          </View>
          </View>
      </View>
      </Modal>
     </View>
     
   );
}

export default Home;