import React from 'react';
import { View, Text, Pressable } from 'react-native';
import RNFS from 'react-native-fs';
import { NativeModules } from 'react-native';
import { Buffer } from 'buffer';
import Sound from 'react-native-sound'; 
import "../../global.css"

const { AudioRecorder } = NativeModules;


interface DetectionDisplayProps {
  time: string;
  confidence: string;
  sound: string;
  audioBase64?: string; 
  criticalLevel?: number | null; 
}

const LEVEL_BORDER_COLOR: { [key: number]: string } = {
  1: 'border-red-500',  
  2: 'border-green-500', 
  3: 'border-yellow-500', 
};

const BACKGROUND_COLOR: { [key: number]: string } = {
  1: 'bg-rose-400',  
  2: 'bg-amber-300', 
  3: 'bg-sky-300', 
};



async function playAudio(base64audio: string) {
      const path = await AudioRecorder.playAudio(base64audio);
  }

const DetectionDisplay: React.FC<DetectionDisplayProps> = ({
  time,
  confidence,
  sound,
  audioBase64,
  criticalLevel, 
}) => {
  console.log(`DetectionDisplay received: sound: ${sound}, criticalLevel: ${criticalLevel}`); 



  const borderClasses = criticalLevel ? `border-2 ${LEVEL_BORDER_COLOR[criticalLevel]}` : '';
  const backgroundClasses = criticalLevel ? `${BACKGROUND_COLOR[criticalLevel]}` : '';

  console.log(`Applied borderClasses: "${borderClasses}" for sound: ${sound}`); 

  return (
    <Pressable onPress={() => playAudio(audioBase64)}>
      <View className={`bg-gray-100 rounded-lg py-5 px-5 flex-row justify-around items-center mx-3 mt-3 shadow-sm ${backgroundClasses}`}>
        <Text className="text-primary font-psemibold text-base">{sound}</Text>
        <Text className="text-primary font-psemibold text-base">|</Text> 
        <Text className="text-primary font-psemibold text-base">{confidence}</Text>
        <Text className="text-primary font-psemibold text-base">|</Text> 
        <Text className="text-primary font-psemibold text-base">{time}</Text>
      </View>
    </Pressable>
  );
};

export default DetectionDisplay;