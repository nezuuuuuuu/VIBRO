import React, { useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { icons } from '../../constants';
    import { useGroupStore } from '../../../store/groupStore';

    
const GroupSoundsDetected = () => {
    const { groupMembersPointer } = useGroupStore();

    const route = useRoute();
    const navigation = useNavigation();

    useLayoutEffect(() => {
            if (navigation) {
                navigation.setOptions({
                    headerTitle: () => (
                        <Text className="font-psemibold text-2xl text-white">{memberName}</Text>
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
                {memberName}'s Detected Sounds
            </Text>

            <FlatList
                data={memberSounds}
                keyExtractor={(item, index) => `${memberId}-${index}`}
                renderItem={({ item }) => (
                    <View className="bg-[#2a2a5a] flex-row justify-between p-4 mb-3 rounded-lg">
                        <Text className="text-white">Sound: {item.soundType}</Text>
                        <Text className="text-white">Time: {item.time}</Text>
                        <Text className="text-white">Intensity: {item.intensity}</Text>
                    </View>
                )}
            />
        </View>
    );
};

export default GroupSoundsDetected;
