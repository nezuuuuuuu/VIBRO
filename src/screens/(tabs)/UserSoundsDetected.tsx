import React, { useLayoutEffect, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, NativeModules } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useGroupStore } from '../../../store/groupStore';
import { useDetectedSoundStore } from '../../../store/detectedSoundStore';
import { useSocket } from '../../../store/useSocket';
import { useAuthStore } from '../../../store/authStore'; // <--- 1. Import AuthStore
import DetectionDisplay from '../../components/detectionDisplay';

const { AudioRecorder } = NativeModules;

const UserSoundsDetected = () => {
    const { fetchUserSounds, sounds, clearSound, hydrateStore, predictionQueue} = useDetectedSoundStore();
    const { socket } = useSocket();
    const { user } = useAuthStore(); // <--- 2. Get current logged-in user
    const { groupPointer } = useGroupStore();
    
    const route = useRoute();
    const navigation = useNavigation();

    // <--- 3. FIX: Handle missing params (fallback to current user if coming from Profile)
    const params = route.params || {}; 
    const targetUserId = params.userId || user?._id; 
    // const targetUsername = params.username || user?.username; // Optional if needed for display

    useEffect(() => {
        hydrateStore();
        console.log("Sounds: ", predictionQueue);
    }, [predictionQueue]); // Updated dependency to targetUserId


    // Stop audio when switching tabs
    useFocusEffect(
        useCallback(() => {
            return () => {
                if (AudioRecorder && AudioRecorder.stopAudio) {
                    AudioRecorder.stopAudio();
                }
            };
        }, [])
    );

    useEffect(() => {
        if (!targetUserId) return; // Guard clause

        clearSound();
        fetchUserSounds(targetUserId);

        if (socket) {
            socket.on('new-sound', ({ userId: newSoundUserId }) => {
                if (newSoundUserId === targetUserId) {
                    fetchUserSounds(targetUserId);
                }
            });
        }
        
        return () => {
             if (socket) socket.off('new-sound');
        };
    }, [targetUserId, socket]); // Updated dependency to targetUserId


    const CRITICAL_SOUND_LEVELS = {
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
        if (navigation) {
            navigation.setOptions({
                headerTitle: () => (
                    <View className="flex-col items-left">
                        {/* 4. Dynamic Title based on context */}
                        <Text className="font-psemibold text-2xl text-white">
                             My Sound Logs
                        </Text>
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
    }, [navigation, params]);

    const formatTime = (isoTime) => {
        try {
            const date = new Date(isoTime);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: 'Asia/Manila', // Ensure this matches your needs
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
            <FlatList
                data={sounds}
                keyExtractor={(item, index) => `${targetUserId}-${index}`}
                renderItem={({ item, index }) => { 
                    if (!item) return null; 

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
                ListEmptyComponent={() => (
                     <View className="mt-10 items-center">
                        <Text className="text-gray-400 font-pregular">No sounds detected yet.</Text>
                     </View>
                )}
            />
        </View>
    );
};

export default UserSoundsDetected;