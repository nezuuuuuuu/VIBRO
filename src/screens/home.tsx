import React, { useEffect } from 'react';
import { View, Text, Button, DeviceEventEmitter, TouchableOpacity,ScrollView  } from 'react-native';
import { useState, useRef } from 'react';
import { NativeModules } from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import { Double, Float } from 'react-native/Libraries/Types/CodegenTypes';
const { AudioRecorder } = NativeModules;
import RNFS from 'react-native-fs';
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

function App() {
  
  useEffect(()=>{
    
    DeviceEventEmitter.addListener("onPrediction",(data)=>
    {
      handlePrediction(data)
      console.log(data)
    })
  },[]);


  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState<string[]>([]);


  const handlePrediction = (prediction: string | null) => {
    if (prediction) {
        setPredictions(prevPredictions => [...prevPredictions, prediction]);
    }
};

  
  async function startRecording() {
      const path = await AudioRecorder.startRecording();

   
   
  }
  async function stopRecording() {
    const path = await AudioRecorder.stopRecording();

 
 
}
  async function playRecording() {
    const path = await AudioRecorder.playRecording();
    console.log(path)
}

  return (
    <View>
         <View>
         <ScrollView >
                {predictions.map((prediction, index) => (
                    <Text key={index}>Detected: {prediction}</Text>
                ))}
            </ScrollView>
        </View>
      <Button title="Start Recording" onPress={startRecording}  />
      <Button title="Start Recording" onPress={stopRecording}  />


    </View>
  );
}

export default App;
