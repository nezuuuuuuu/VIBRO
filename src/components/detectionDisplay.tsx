import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { NativeModules } from 'react-native';
import "../../global.css";

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

async function playAudio(base64audio?: string) {
  if (!base64audio) return;
  try {
    await AudioRecorder.playAudio(base64audio);
  } catch (err) {
    console.warn("Audio playback failed:", err);
  }
}

const DetectionDisplay: React.FC<DetectionDisplayProps> = ({
  time,
  confidence,
  sound,
  audioBase64,
  criticalLevel,
}) => {
  const borderClass = criticalLevel ? `border-2 ${LEVEL_BORDER_COLOR[criticalLevel]}` : '';
  const backgroundClass = criticalLevel ? BACKGROUND_COLOR[criticalLevel] : '';

  const containerClass = `bg-gray-100 rounded-lg py-5 px-5 flex-row justify-around items-center mx-3 mt-3 shadow-sm ${backgroundClass} ${borderClass}`.trim();

  return (
    <Pressable onPress={() => playAudio(audioBase64)}>
      <View className={containerClass}>
        <Text className="text-primary font-psemibold text-base">{sound}</Text>
        <Text className="text-primary font-psemibold text-base">{time}</Text>
      </View>
    </Pressable>
  );
};

export default DetectionDisplay;
