import React, { useLayoutEffect, useEffect  } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { icons } from '../../constants';
import { useGroupStore } from '../../../store/groupStore';
import {useDetectedSoundStore} from '../../../store/detectedSoundStore';

    
const GroupSoundsDetected = () => {
    const { fetchUserSounds,sounds} = useDetectedSoundStore();

    const route = useRoute();
    const {userId, username} = route.params

    const navigation = useNavigation();
    
    useEffect(() => {
        fetchUserSounds(userId);
        console.log("herereradasdasdasd")
    }, [userId]);

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
                    headerRight: () => (
                        <View className="flex-row gap-2 justify-between">
                            <TouchableOpacity className="mr-4">
                                <Image
                                    source={icons.chat}
                                    className="w-6 h-6 tint-white"
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
    
                            <TouchableOpacity className="mr-4">
                                <Image
                                    source={icons.sound}
                                    className="w-6 h-6 tint-white"
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
    
                            <TouchableOpacity className="mr-4">
                                <Image
                                    source={icons.info}
                                    className="w-6 h-6 tint-white"
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        </View>
                    ),
                });
            }
    }, [navigation]);

    return (
        <View className="flex-1 bg-primary p-4">
            <Text className="text-white text-xl font-psemibold mb-4">
                {username} 's Detected Sounds
            </Text>

            <FlatList
                data={sounds}
                keyExtractor={(item, index) => `${userId}-${index}`}
                renderItem={({ item }) => (
                    <View className="bg-[#2a2a5a] flex-row justify-between p-4 mb-3 rounded-lg">
                        <Text className="text-white">Sound: {item.label}</Text>
                        <Text className="text-white">Time: {item.time}</Text>
                        <Text className="text-white">Intensity: {item.createdAt}</Text>
                    </View>
                )}
            />
        </View>
    );
};

export default GroupSoundsDetected;
