import React, { memo, useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { icons } from '../../constants';
import { useGroupStore } from '../../../store/groupStore';
import { Member } from '../../constants/constants';
import { useAuthStore } from '../../../store/authStore';
import  {useSocket}  from '../../../store/useSocket'; // Import the socket hook

const GroupDetails = () => {
      const { getGroups, groups, isLoading,setGroupNavigation, groupPointer,getMembers,groupMembersPointer } = useGroupStore();
      const { socket, connect, disconnect,updateOnlineStatus,onlineUsers } = useSocket(); // Use the socket hook
        const navigation = useNavigation();

        const { user, token, isLoadingAuth } = useAuthStore();
        const currentUserId = user?._id;
        const route = useRoute();
    
    useEffect(() => {
         
        if (socket) {
            socket.on('user-online', ({ userId }) => updateOnlineStatus(userId, true));
            socket.on('user-offline', ({ userId }) => updateOnlineStatus(userId, false));
           
        }
        return () => {
            if (socket) {
                socket.off('user-online');
                socket.off('user-offline');
            }
        };
    }, [socket]);
 
    useEffect(() => {


        if (groupPointer?._id) {
            getMembers(groupPointer._id); // Fetch members only when groupPointer is ready
        }
    }, [groupPointer]);
    useLayoutEffect(() => {
        
         if (navigation && groupPointer && !isLoadingAuth) {
            
         
            navigation.setOptions({
                headerTitle: () => (
                    <Text className="font-psemibold text-xl text-white">{groupPointer.groupName}</Text>
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
                        <TouchableOpacity 
                            className="mr-4"
                            onPress={() => {
                                if (groupPointer?._id && currentUserId && token) {
                                    console.log('Navigating to ChatScreen with:');
                                    console.log('  groupId:', groupPointer._id);
                                    console.log('  groupName:', groupPointer.groupName);
                                    console.log('  currentUserId:', currentUserId);
                                    console.log('  token:', token ? 'Token Exists' : 'Token Missing!'); // Log existence

                                    navigation.navigate('ChatScreen', {
                                        groupId: groupPointer._id,
                                        groupName: groupPointer.groupName,
                                        currentUserId: currentUserId, // <-- Pass the user ID
                                        token: token, // <-- Pass the token!
                                    });
                                } else {
                                    // Add this else block for debugging
                                    console.log('Navigation to ChatScreen prevented. Check values:');
                                    console.log('groupPointer?._id:', groupPointer?._id);
                                    console.log('currentUserId:', currentUserId); // This will likely show undefined
                                }
                            }}
                        >
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
    }, [navigation,groupPointer,groupMembersPointer,currentUserId, token]);

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
                                source={{ uri: `https://api.dicebear.com/7.x/personas/png?seed=${member?.username || "guest"}` }}
                                className="w-12 h-12 rounded-full bg-gray-300"
                                resizeMode="cover"
                            />
                            <Text className="text-white px-4 text-lg font-pregular">{member.username}</Text>
                        </View>

                        <View>
                            {onlineUsers.has(member._id) ? (
                                <Text className="text-green-400 text-sm">Online</Text>
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
