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

import { icons } from '../../constants';

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
  const navigation = useNavigation(); 
  const { user, token } = useAuthStore();

  const [isRecording, setIsRecording] = useState(false);
  const ALLOWED_LABELS = ['siren', 'Ambulance (siren)', 'Police car (siren)', 'Glass_break'];
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
    
    DeviceEventEmitter.addListener("onPrediction",(data)=>
    {
      const { time, label, confidence } = data;
      handlePrediction(data)
      console.log(data)
    })
  },[]);


  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState<any[]>([]);


  const handlePrediction = (prediction: string ) => {
    const MIN_CONFIDENCE = 0.6; // adjust as needed (60%)

    if (prediction.confidence >= MIN_CONFIDENCE && ALLOWED_LABELS.includes(prediction.label)){
      setPredictions(prevPredictions => [...prevPredictions, prediction]);
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
