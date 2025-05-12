import React from 'react';
import { View, Text } from 'react-native';

const DetectionDisplay = ({ time, confidence, sound }) => {
  return (
    
        <View className="bg-gray-100 rounded-lg py-3 px-5 flex-row justify-around items-center mx-4 mt-4">
          <Text className="text-gray-500 text-base">{sound}</Text>
        
          <Text className="text-gray-500 text-base">|</Text>
          <Text className="text-gray-500 text-base">{confidence}</Text>
          <Text className="text-gray-500 text-base">|</Text>
            <Text className="text-gray-500 text-base">{time}</Text>
        </View>
  );
};

export default DetectionDisplay;