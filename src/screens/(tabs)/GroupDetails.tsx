import React, { memo, useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { icons } from '../../constants';
import { useGroupStore } from '../../../store/groupStore';
import { Member } from '../../constants/constants';

const GroupDetails = () => {
      const { getGroups, groups, isLoading,setGroupNavigation, groupPointer,getMembers,groupMembersPointer } = useGroupStore();
    
    
    const navigation = useNavigation();
    
    useEffect(() => {
        if (groupPointer?._id) {
            getMembers(groupPointer._id); // Fetch members only when groupPointer is ready
        }
    }, [groupPointer]);
    useLayoutEffect(() => {
        
        if (navigation && groupPointer ) {
            
         
            navigation.setOptions({
                headerTitle: () => (
                    <Text className="font-psemibold text-2xl text-white">{groupPointer.groupName}</Text>
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

                        <TouchableOpacity 
                            className="mr-4"
                            onPress={() => 
                                navigation.navigate("GroupInfo")
                            }
                        >
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
    }, [navigation,groupPointer,groupMembersPointer]);

    return (
        <View className='bg-primary p-4 flex-1'>
            <Text className='text-white my-5'>Monitoring on:</Text>
            <ScrollView className='w-full rounded-lg'>
                
                {groupMembersPointer.map((member) => (
                    // NAVIGATE TO GROUPSOUNDSDETECTED.TSX
                    <TouchableOpacity 
                        key={member._id}
                        className='flex-row justify-between items-center bg-[#2a2a5a] p-4 mb-3 rounded-lg'
                        onPress={() => 
                            navigation.navigate('GroupSoundsDetected',{userId: member._id, username: member.username})
                        }
                    >
                        <View className="flex-row items-center space-x-4">
                            <Image
                                source={{ uri: `https://api.dicebear.com/7.x/bottts/png?seed=${member?.username || "guest"}` }}
                                className="w-12 h-12 rounded-full bg-gray-300"
                                resizeMode="cover"
                            />
                            <Text className="text-white px-4 text-lg font-pregular">{member.username}</Text>
                        </View>

                        <View>
                            {member.isMonitoring ? (
                                <Text className="text-green-400 text-sm">Monitoring</Text>
                            ) : (
                                <Text className="text-gray-400 text-sm">Offline</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default GroupDetails;
