import React, { useLayoutEffect, useEffect, useCallback } from 'react'; // 1. Added useCallback
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, NativeModules } from 'react-native'; // 2. Added NativeModules
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'; // 3. Added useFocusEffect
import { icons } from '../../constants';
import { useGroupStore } from '../../../store/groupStore';
import { useDetectedSoundStore } from '../../../store/detectedSoundStore';
import { useSocket } from '../../../store/useSocket';
import DetectionDisplay from '../../components/detectionDisplay';

// 4. Extract the Native Module
const { AudioRecorder } = NativeModules;

const GroupSoundsDetected = () => {
    const { fetchUserSounds, sounds, clearSound } = useDetectedSoundStore();
    const { socket } = useSocket();

    const route = useRoute();
    const { userId, username } = route.params;
    const { groupPointer } = useGroupStore();

    const navigation = useNavigation();

    // 5. ADD THIS: Stop audio when switching tabs (losing focus)
    useFocusEffect(
        useCallback(() => {
            // This return function runs when the user leaves this tab
            return () => {
                if (AudioRecorder && AudioRecorder.stopAudio) {
                    AudioRecorder.stopAudio();
                }
            };
        }, [])
    );

    useEffect(() => {
        clearSound();
        fetchUserSounds(userId);

        socket.on('new-sound', ({ userId: newSoundUserId }) => {
            if (newSoundUserId === userId) {
                fetchUserSounds(userId);
            }
        });
        
        // Cleanup socket listener on unmount
        return () => {
             socket.off('new-sound');
        };
    }, [userId]);


    const CRITICAL_SOUND_LEVELS: { [key: string]: number } = {
        'siren': 1,
        'Ambulance (siren)': 1,
        'Police car (siren)': 1,
        'Siren': 1,
        'Fire engine, fire truck (siren)': 1,
        'Fire alarm': 1,
        'Glass': 2,
        'Speech': 3,
        'Music': 3,
        'Crying, sobbing': 2,
        'Baby cry, infant cry': 2,
        'Emergency vehicle': 1
    };

    useLayoutEffect(() => {
        console.log(sounds);

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
                timeZone: 'Asia/Manila',
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
                renderItem={({ item, index }) => { 
                    if (!item) {
                        console.warn(`Skipping rendering undefined or null item at index ${index}`);
                        return null; 
                    }

                    return (
                        <DetectionDisplay
                            time={formatTime(item.createdAt)}
                            confidence={(item.confidence * 100).toFixed(2) + '%'}
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