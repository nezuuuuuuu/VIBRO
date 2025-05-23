import React, { useEffect } from 'react';
import { View, Text, Button, DeviceEventEmitter, TouchableOpacity, ScrollView, Image  } from 'react-native';
import { useState, useRef } from 'react';
import { NativeModules } from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import { Double, Float } from 'react-native/Libraries/Types/CodegenTypes';
const { AudioRecorder } = NativeModules;
import RNFS from 'react-native-fs';
import "../../../global.css"
import DetectionDisplay from '../../components/detectionDisplay';

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
  const [isRecording, setIsRecording] = useState(false);
  
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


  const handlePrediction = (prediction: string | null) => {
    if (prediction) {
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
    <View className='bg-secondary h-full' >
         <View className=' items-center justify-center'>
      <Text className='text-white text-lg'>Sound Detected</Text>
          
      <ScrollView className="h-3/4 w-full " >
     
                { predictions.slice().reverse().map((prediction, index) => (
                    <DetectionDisplay key={index} time={new Date(prediction.time).toLocaleTimeString()} confidence={prediction.label} sound={ (prediction.confidence * 100).toFixed(2) + '%'}/>
                  
                ))}

            </ScrollView>
        </View>
        <View className=' justify-center items-center mt-4'>
        <View className="bg-tertiary  rounded-full items-center justify-center" style={{ width: 60, height: 60 }}>
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
