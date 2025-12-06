import React, { useLayoutEffect, useEffect  } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { icons } from '../../constants';
import { useGroupStore } from '../../../store/groupStore';
import {useDetectedSoundStore} from '../../../store/detectedSoundStore';
import { useSocket } from '../../../store/useSocket';
import DetectionDisplay from '../../components/detectionDisplay';

const GroupSoundsDetected = () => {
    const { fetchUserSounds,sounds,clearSound} = useDetectedSoundStore();
    const {socket} =useSocket()

    const route = useRoute();
    const {userId, username} = route.params
    const { groupPointer } = useGroupStore();

    const navigation = useNavigation();

    useEffect(() => {
        clearSound()
        fetchUserSounds(userId);

        socket.on('new-sound', ({ userId: newSoundUserId }) => {
        if (newSoundUserId === userId) {
        fetchUserSounds(userId);
        }
  });    }, [userId]);


    const CRITICAL_SOUND_LEVELS: { [key: string]: number } = {
      'siren': 1,
      'Ambulance (siren)': 1,
      'Police car (siren)': 1,
      'Siren': 1,
      'Glass': 2,
      'Speech': 3,
    };

    useLayoutEffect(() => {
        console.log(sounds)


            if (navigation) {
                navigation.setOptions({
                    headerTitle: () => (
                          <View className="flex-col items-left">
                            <Text className="font-pregular text-sm text-gray-200">
                              {groupPointer?.groupName}
                            </Text>
                            
                            <Text className="font-psemibold text-2xl text-white">{username}</Text>
                          </View>
                      ),
                    headerStyle: {
                        backgroundColor: '#1a1a3d',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                });
            }
    }, [navigation, groupPointer]);
   const formatTime = (isoTime) => {
  try {
    const date = new Date(isoTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',  // Adjust this if you're in a different time zone
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "N/A";
  }
};
if (sounds == null) {
    return (
      <View className='flex-1 justify-center items-center bg-primary'>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text className='mt-10 text-white font-pregular text-lg'>Loading detected sounds...</Text>
      </View>
    );
  }
  

   return (
  
        <View className="flex-1 bg-primary p-4">
            <Text className="text-white text-center text-xl font-psemibold mb-4">
                Detected Sounds
            </Text>

            
            <FlatList
                data={sounds}
                keyExtractor={(item, index) => `${userId}-${index}`}
                renderItem={({ item }) => { // Modified to add a check
                    // Add this check for undefined or null items
                    if (!item) {
                        console.warn(`Skipping rendering undefined or null item at index ${index}`);
                        return null; // Don't render anything for this invalid item
                    }

                    // Only render if the item is valid
                    return (
                        <DetectionDisplay
                            time={formatTime(item.createdAt)}
                            confidence={(item.confidence * 100).toFixed(2)+ '%'}
                            sound={item.label}
                            audioBase64={item.sound}
                            criticalLevel={CRITICAL_SOUND_LEVELS[item.label] || null}
                        />
                    );
                }}
            />
        </View>
    );
};

export default GroupSoundsDetected;