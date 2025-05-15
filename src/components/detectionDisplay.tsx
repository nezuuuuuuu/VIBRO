import React from 'react';
import { View, Text, Pressable } from 'react-native';
import RNFS from 'react-native-fs';
import { NativeModules } from 'react-native';

const { AudioRecorder } = NativeModules;

  async function playAudio(base64audio: string) {
      const path = await AudioRecorder.playAudio(base64audio);
  }
const DetectionDisplay: React.FC<DetectionDisplayProps> = ({
  time,
  confidence,
  sound,
  audioBase64,
}) => {
  return (
    <Pressable onPress={() => playAudio(audioBase64)}>
      <View className="bg-gray-100 rounded-lg py-3 px-5 flex-row justify-around items-center mx-4 mt-4">
        <Text className="text-gray-500 text-base">{sound}</Text>
        <Text className="text-gray-500 text-base">|</Text>
        <Text className="text-gray-500 text-base">{confidence}</Text>
        <Text className="text-gray-500 text-base">|</Text>
        <Text className="text-gray-500 text-base">{time}</Text>
      </View>
    </Pressable>
  );
};

export default DetectionDisplay;