import React, { memo, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { icons } from '../../constants';
import { useGroupStore } from '../../../store/groupStore';
// import { Member } from '../../constants/constants'; // This import seems unused/incorrect
import { useAuthStore } from '../../../store/authStore';
import { useSocket } from '../../../store/useSocket'; // Import the socket hook


// --- Main Screen Component ---

const GroupDetails = () => {
    const { getGroups, groups, isLoading, setGroupNavigation, groupPointer, getMembers, groupMembersPointer,getContributions,contributions } = useGroupStore();
    const { socket, connect, disconnect, updateOnlineStatus, onlineUsers } = useSocket(); // Use the socket hook
    const navigation = useNavigation();

    const { user, token, isLoadingAuth } = useAuthStore();
    const currentUserId = user?._id;
    const route = useRoute();
    const [isRefreshing, setIsRefreshing] = useState(false);


    const loadMembers = async () => {
        setIsRefreshing(true);
        try {
            await getMembers(groupPointer._id);
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false); // 🟢 SIGN: Hide spinner
        }
    };

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
            // getContributions(groupPointer?._id);
        }
    }, [groupPointer,getMembers]);

    const onRefresh = useCallback(async () => {
        await loadMembers();
    }, [groupPointer, getMembers]);

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
                        {/* Chat Icon */}
                        <TouchableOpacity
                            className="mr-4"
                            onPress={() => {
                                if (groupPointer?._id && currentUserId && token) {
                                    console.log('Navigating to ChatScreen...');
                                    navigation.navigate('ChatScreen', {
                                        groupId: groupPointer._id,
                                        groupName: groupPointer.groupName,
                                        currentUserId: currentUserId,
                                        token: token,
                                    });
                                } else {
                                    console.log('Navigation to ChatScreen prevented. Missing data.');
                                }
                            }}
                        >
                            <Image
                                source={icons.chat}
                                className="w-6 h-6 tint-white"
                                resizeMode="contain"
                            />
                        </TouchableOpacity>

                        {/* Sound Icon */}
                        <TouchableOpacity className="mr-4"
                            onPress={() =>
                                navigation.navigate("CustomSounds")
                            }
                        >
                            <Image
                                source={icons.sound}
                                className="w-6 h-6 tint-white"
                                resizeMode="contain"
                            />
                        </TouchableOpacity>

                        {/* Info Icon */}
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
    }, [navigation, groupPointer, groupMembersPointer, currentUserId, token]);

    return (
        <View className='bg-primary flex-1'>
            {/* ScrollView for the entire content */}
            <ScrollView
                className='w-full'
                contentContainerStyle={{ padding: 10 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor='#8A2BE2'
                        colors={['#8A2BE2']}
                    />
                }
            >

                {/* 2. Monitoring On Section */}
                <Text className='text-white font-pregular my-5 px-4'>Monitoring on:</Text>
                <View style={{paddingHorizontal: 10}}>
                    {groupMembersPointer.filter((member) => member.isActive && member._id !== currentUserId).map((member) => (
                        <TouchableOpacity
                            key={member._id}
                            className='flex-row justify-between items-center bg-[#2a2a5a] p-4 mb-3 rounded-lg'
                            onPress={() =>
                                navigation.navigate('GroupSoundsDetected', { userId: member._id, username: member.username })
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
                </View>
            </ScrollView>
        </View>
    );
};

// Merged Stylesheet
const styles = StyleSheet.create({
    // --- Contributions Styles ---
    contributionsContainer: { // New container style for the ContributionsSection
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginHorizontal: 10, // Adjusted to fit better with the main screen padding
        marginBottom: 20,
    },
    contributionsTitle: { // Renamed from 'title' to avoid clash
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 15,
    },
    listContainer: {
        marginBottom: 15,
        gap: 10,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    rankText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4F46E5',
        width: 30,
        textAlign: 'center',
        marginRight: 10,
    },
    infoContainer: {
        flex: 1,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
    metricText: {
        fontSize: 13,
        color: '#666666',
    },
    viewAllButton: {
        marginTop: 10,
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    viewAllButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // --- Original GroupDetails Styles (Keeping the original structure) ---
    // Note: Most of the original styles were Tailwind classes (className), 
    // so only the new styles from the Contributions UI are added here.
});


export default GroupDetails;