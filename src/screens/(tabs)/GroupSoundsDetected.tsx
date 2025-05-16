import React, { useLayoutEffect, useEffect  } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { icons } from '../../constants';
import { useGroupStore } from '../../../store/groupStore';
import {useDetectedSoundStore} from '../../../store/detectedSoundStore';
import { useSocket } from '../../../store/useSocket';
import DetectionDisplay from '../../components/detectionDisplay';

const GroupSoundsDetected = () => {
    const { fetchUserSounds,sounds} = useDetectedSoundStore();
    const {socket} =useSocket()

    const route = useRoute();
    const {userId, username} = route.params

    const navigation = useNavigation();

    useEffect(() => {
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
                        <Text className="font-psemibold text-2xl text-white">{username}</Text>
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
    }, [navigation]);
     const formatTime = (isoTime) => {
    try {
      const date = new Date(isoTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "N/A";
    }
  };

    return (
        <View className="flex-1 bg-primary p-4">
            <Text className="text-white text-xl font-psemibold mb-4">
                {username} 's Detected Sounds
            </Text>
            <FlatList
                data={sounds}
                keyExtractor={(item, index) => `${userId}-${index}`}
                renderItem={({ item }) => (


                <DetectionDisplay  time={formatTime(item.createdAt)} confidence={(item.confidence * 100).toFixed(2)+ '%'} sound={item.label}
                 audioBase64={item.sound} criticalLevel={CRITICAL_SOUND_LEVELS[item.label] || null}
                />

                )}
            />
        </View>
    );
};

export default GroupSoundsDetected;