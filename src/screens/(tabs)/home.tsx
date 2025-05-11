import React, { useEffect, useLayoutEffect } from 'react';
import { View, Text, Button, DeviceEventEmitter, TouchableOpacity, ScrollView, Image  } from 'react-native';
import { useState, useRef } from 'react';
import { NativeModules } from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import { Double, Float } from 'react-native/Libraries/Types/CodegenTypes';
const { AudioRecorder } = NativeModules;
import RNFS from 'react-native-fs';
import "../../../global.css"
import DetectionDisplay from '../../components/detectionDisplay';
import { useAuthStore } from "../../../store/authStore";
import { useNavigation } from '@react-navigation/native';
import { useGroupStore } from '../../../store/groupStore';

import { icons } from '../../constants';
import {useDetectedSoundStore} from '../../../store/detectedSoundStore';

import {useSocket} from '../../../store/useSocket';


 

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
    
  const { socket, connect, disconnect } = useSocket();
  const {getGroups} = useGroupStore()
  const { addSound} = useDetectedSoundStore();

  const navigation = useNavigation(); 
  const { user, token } = useAuthStore();

  const [isRecording, setIsRecording] = useState(false);
  const ALLOWED_LABELS = ['siren', 'Ambulance (siren)', 'Police car (siren)', 'Glass'];
  const CUSTOM_ALLOWED_LABELS = ['siren', 'Ambulance (siren)', 'Police car (siren)', 'Glass'];
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
  
  useEffect(()=>{
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
    
    
    DeviceEventEmitter.addListener("onPrediction",(data)=>
    {
      const { time, label, confidence } = data;
      handlePrediction(data)
      // console.log(data)
    })
  },[]);


  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState<any[]>([]);


  const handlePrediction = async (prediction: { label: string, confidence: number, timestamp: number }) => {
    const MIN_CONFIDENCE = 0.6; // adjust as needed (60%)
    const TIME_LIMIT = 10000; // 10 seconds in milliseconds
    console.log(prediction.label)
    // Ensure prediction has valid data
    if (prediction.confidence >= MIN_CONFIDENCE && ALLOWED_LABELS.includes(prediction.label)) {
        // Get the current time (timestamp)
        const currentTime = Date.now();

        // Check if the label already exists and if it's within the time window
        const lastPrediction = predictions.find(pred => pred.label === prediction.label);
        
        if (lastPrediction && (currentTime - lastPrediction.timestamp) <= TIME_LIMIT) {
            console.log('Prediction with the same label is too soon, skipping...');
            return; // Skip the prediction
        }

        // Add sound to your store or handle accordingly
        addSound(prediction.label, prediction.confidence);

        // Update predictions state (add the timestamp to the prediction)
        setPredictions(prevPredictions => [
            ...prevPredictions,
            { ...prediction, timestamp: currentTime }
        ]);
    }
};


  
  async function startRecording() {
    if(isRecording) {
    stopRecording()
      return;
    }
    setIsRecording(true);
      const path = await AudioRecorder.startRecording();

   
   
  }
  async function stopRecording() {
    setIsRecording(false);
    const path = await AudioRecorder.stopRecording(); 
}
  async function playRecording() {
    const path = await AudioRecorder.playRecording();
    console.log(path)
}


  return (
    <View className='bg-primary h-full' >
         <View className=' items-center justify-center'>
      <Text className='text-white text-lg'>Sound Detected</Text>
          
      <ScrollView className="h-3/4 w-full " >
     
                { predictions.slice().reverse().map((prediction, index) => (
                    <DetectionDisplay key={index} time={new Date(prediction.time).toLocaleTimeString()} confidence={prediction.label} sound={ (prediction.confidence * 100).toFixed(2) + '%'}/>
                  
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
