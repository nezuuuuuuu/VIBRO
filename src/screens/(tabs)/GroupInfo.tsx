import React, { memo, useState, useLayoutEffect, useEffect } from 'react';
import {
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    Modal,
    TextInput,
    Button,
    FlatList,
    Alert,
    Clipboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { icons } from '../../constants';
import { useNavigation } from '@react-navigation/native';
import { useGroupStore } from '../../../store/groupStore';
import { useAuthStore } from '../../../store/authStore';

// --- ContributionCard (Unchanged) ---
const ContributionCard = memo(({ name, sounds }) => (
    <View
        className="flex-row items-center p-3 bg-primary-100 rounded-lg border border-white/20"
    >
        <View className="flex-1">
            <Text className="text-base font-semibold text-white">{name}</Text>
            <Text className="text-sm text-gray-400">{sounds} Sounds</Text>
        </View>
    </View>
));

// --------------------------------------------------------------------------------------
// --- Full Contributors Modal Component (Unchanged) ---
// --------------------------------------------------------------------------------------
const FullContributorsModal = ({ isVisible, onClose, contributionsData }) => {
    const renderModalContributionItem = ({ item, index }) => (
        <View className="flex-row items-center p-4 mb-2 rounded-lg bg-primary-100">
            <Text className="text-secondary text-lg font-pbold mr-4">{index + 1}.</Text>
            <View className="flex-1">
                <Text className="text-white text-base font-psemibold">{item.name}</Text>
                <Text className="text-gray-400 text-sm font-pregular">{item.sounds} Sounds</Text>
            </View>
        </View>
    );

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 justify-center items-center p-1 bg-black/70">
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View className="bg-primary p-6 rounded-lg w-11/12 h-3/4">
                            <Text className="text-white text-center text-xl font-psemibold mb-6">Sound Contributors</Text>
                            <FlatList
                                data={contributionsData}
                                renderItem={renderModalContributionItem}
                                keyExtractor={(item) => item._id || item.name}
                                nestedScrollEnabled={true}
                                ListEmptyComponent={() => (
                                    <Text className="text-gray-400 text-center mt-4">No contributions found yet.</Text>
                                )}
                            />
                            <TouchableOpacity
                                onPress={onClose}
                                className="mt-6 bg-secondary p-3 rounded-lg"
                            >
                                <Text className="text-white font-psemibold text-center">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// --------------------------------------------------------------------------------------
// --- ContributionsSection (Unchanged) ---
// --------------------------------------------------------------------------------------
const ContributionsSection = memo(({ top3Data, onPress }) => {
    // Only displays the already filtered top3Data

    return (
        // Changed main container to View, removing unused activeOpacity
        <View
            className="p-5 bg-secondary/5 rounded-xl"
        >
            <Text className="text-white text-2xl font-psemibold mb-4">Top Contributors</Text>

            <View className="mb-4 gap-y-3">
                {top3Data?.length > 0 ? (
                    top3Data.map((item, index) => (
                        <ContributionCard
                            key={item._id || index.toString()}
                            name={item.name}
                            sounds={item.sounds}
                        />
                    ))
                ) : (
                    <Text className="text-gray-400 text-center py-6">No contributions found yet.</Text>
                )}
            </View>
            
            {/* FIX: Wrap the Text in a TouchableOpacity */}
            <TouchableOpacity
                onPress={onPress} // Use the onPress handler passed from GroupInfo
                className="mt-2"
                activeOpacity={0.7}
            >
                <Text className="text-secondary font-psemibold text-center">
                    View All Contributors ({top3Data?.length || 0} visible)
                </Text>
            </TouchableOpacity>
        </View>
    );
});


// --------------------------------------------------------------------------------------
// --- GroupInfo Main Component (FIXED) ---
// --------------------------------------------------------------------------------------

const GroupInfo = () => {
    const { groupPointer, getMembers, groupMembersPointer, updateGroupName: updateGroupNameStore, getGroupId, leaveGroup, getContributions, contributions } = useGroupStore();
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const currentUserId = user?._id;

    const [isSeeMembersModalVisible, setSeeMembersModalVisible] = useState(false);
    const [isChangeGroupNameModalVisible, setChangeGroupNameModalVisible] = useState(false);
    const [isGroupCodeModalVisible, setGroupCodeModalVisible] = useState(false);
    const [isFullContributorsModalVisible, setFullContributorsModalVisible] = useState(false); 
    const [newGroupName, setNewGroupName] = useState('');
    const [joinGroupCode, setJoinGroupCode] = useState('');
    const [isJoinGroupModalVisible, setJoinGroupModalVisible] = useState(false);

    // Filter contributions data to only show the top 3 items
    const top3Contributions = contributions?.slice(0, 3);

    // Get the group ID using the new selector function
    const currentGroupId = getGroupId();
    const memberCount = groupMembersPointer?.length || 0;

    useEffect(() => {
        if (groupPointer?._id) {
            getMembers(groupPointer._id); 
            getContributions(groupPointer?._id);
        }
    }, [groupPointer, getMembers]);

    useLayoutEffect(() => {
        if (navigation && groupPointer) {
            navigation.setOptions({
                headerTitle: () => (
                    <Text className="font-psemibold text-2xl text-white">Group Profile</Text>
                ),
                headerStyle: {
                    backgroundColor: '#1a1a3d',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                headerRight: () => (
                    <TouchableOpacity onPress={() => setJoinGroupModalVisible(true)} className="mr-4">
                        <Image source={icons.add_group} className="w-6 h-6 tint-white" resizeMode="contain" />
                    </TouchableOpacity>
                ),
            });
            setNewGroupName(groupPointer.groupName || '');
        }
    }, [navigation, groupPointer]);

    const handleSeeMembers = () => {
        getMembers(groupPointer?._id); // Ensure latest members are fetched
        setSeeMembersModalVisible(true);
    };

    const handleChangeGroupName = () => {
        setNewGroupName(groupPointer?.groupName || '');
        setChangeGroupNameModalVisible(true);
    };

    const handleUpdateGroupName = async () => {
        if (!newGroupName.trim()) { 
            Alert.alert('Warning', 'Group name cannot be empty.');
            return; 
        }
        if (!groupPointer?._id) { 
            Alert.alert('Error', 'Group information not available.');
            return; 
        }

        const result = await updateGroupNameStore(groupPointer._id, newGroupName); 

        if (result.success) {
            setChangeGroupNameModalVisible(false);
            Alert.alert('Success', 'Group name updated successfully.'); 
        } else {
            Alert.alert('Error', result.error || 'Failed to update group name.');
        }
    };


    const handleGroupCode = () => {
        setGroupCodeModalVisible(true);
    };

    const handleCopyGroupCode = () => {
        if (currentGroupId) {
            Clipboard.setString(currentGroupId);
            Alert.alert('Copied!', 'Group code copied to clipboard.');
        } else {
            Alert.alert('Error', 'No group code available.');
        }
    };

    const renderMemberItem = ({ item }) => {
        return (
            <View className="flex-row items-center p-4 mb-2 rounded-lg bg-primary">
                <Image
                    source={{ uri: `https://api.dicebear.com/7.x/personas/png?seed=${item?.username || 'guest'}` }}
                    className="w-10 h-10 rounded-full bg-gray-300 mr-4"
                    resizeMode="cover"
                />
                <Text className="text-white font-pregular text-lg">
                    {item.username}
                    {item.isAdmin && <Text className="text-secondary text-sm ml-2 font-pbold">(Admin)</Text>}
                </Text>
            </View>
        );
    };

    return (
        <View className='bg-primary flex-1'>
            <ScrollView className='w-full'>

                {/* 1. Profile Info Section (FIXED: Group Photo & Name) */}
                <View className="w-full justify-center items-center gap-3 flex-column mt-10">
                    <View className="w-full justify-center items-center gap-3 flex-column">
                        {groupPointer && groupPointer.groupName && (
                            <Image
                                className="rounded-full bg-gray-300"
                                style={{ width: 100, height: 100, borderRadius: 100 }}
                                source={{ uri: `https://api.dicebear.com/9.x/shapes/png?seed=${groupPointer.groupName}` }} 
                                resizeMode="cover"
                            />
                        )}
                        {groupPointer && groupPointer.groupName && (
                            <Text className="text-center text-4xl font-pbold text-white px-4">
                                {groupPointer.groupName} 
                            </Text>
                        )}
                    </View>
                
                  
                   <View className="flex-row items-center justify-center gap-2"> 
                        {/* See Members Button (Styled as a link) */}
                        <TouchableOpacity
                            onPress={handleSeeMembers} 
                            className="flex-row items-center p-2 px-1 rounded-full"
                        >
                            <Text className="text-sm font-psemibold text-secondary">
                                See Members
                            </Text>
                        </TouchableOpacity>
                        {/* Bullet Separator */}
                        <Text className="text-gray-600 text-lg font-pregular">•</Text> 
                        {/* Member Count (Static Text) */}
                        <Text className="text-gray-400 text-sm font-pmedium">
                            {memberCount} members
                        </Text>
                    </View>
                </View>

                {/* --- 2. Action Buttons (Dashboard View - Side by Side) --- */}
                <View className="flex-row justify-between p-6 gap-4 m-2">
                    <TouchableOpacity
                        onPress={handleGroupCode}
                        className="flex-1 border bg-secondary/2 border-secondary p-4 rounded-lg items-center"
                    >
                        <Text className="text-secondary font-psemibold text-sm">Share Group Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleChangeGroupName}
                        className="flex-1 bg-secondary p-4 rounded-lg items-center"
                    >
                        <Text className="text-white font-psemibold text-sm">Change Name</Text>
                    </TouchableOpacity>
                </View>

                {/* --- 3. Top Contributions Widget (Now fully interactive with modal) --- */}
                <View className='mt-2 p-4'> 
                    <ContributionsSection 
                        top3Data={top3Contributions} // Only pass top 3
                        onPress={() => setFullContributorsModalVisible(true)} // Open full list modal
                    />
                </View>


                {/* --- 4. Danger Zone (Leave Group) --- */}
                <View className="p-4 pt-2 mb-10">
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                "Leave Group",
                                `Are you sure you want to leave "${groupPointer?.groupName || 'this group'}"?`,
                                [
                                    {
                                        text: "Cancel",
                                        style: "cancel"
                                    },
                                    {
                                        text: "Leave",
                                        onPress: async () => { 
                                            console.log("Attempting to leave group:", currentGroupId);
                                            const result = await leaveGroup(currentGroupId);

                                            if (result.success) {
                                                Alert.alert('Success', result.message || 'You have left the group.');
                                                navigation.navigate('GroupsList'); 
                                            } else {
                                                Alert.alert('Error', result.error || 'Failed to leave group.');
                                            }
                                        },
                                        style: "destructive"
                                    }
                                ]
                            );
                        }}
                        className="py-4 border border-red-500 rounded-lg bg-red-800/10 items-center mt-4"
                    >
                        <Text className="text-red-500 font-pregular text-lg">Leave group</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>


            {/* ---------------------------------- */}
            {/* --- MODALS --- */}
            {/* ---------------------------------- */}
            
            {/* Full Contributors Modal */}
            <FullContributorsModal
                isVisible={isFullContributorsModalVisible}
                onClose={() => setFullContributorsModalVisible(false)}
                contributionsData={contributions} 
            />

            {/* See Members Modal (UNCHANGED logic for opening/closing, but updated via handleSeeMembers) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isSeeMembersModalVisible}
                onRequestClose={() => setSeeMembersModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setSeeMembersModalVisible(false)}>
                    <View className="flex-1 justify-center items-center p-1 bg-black/70">
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View className="bg-primary p-6 rounded-lg w-3/4 h-96">
                                <Text className="text-white text-center text-xl font-psemibold mb-4">Group Members</Text>
                                <FlatList
                                    data={groupMembersPointer}
                                    renderItem={renderMemberItem}
                                    keyExtractor={(item) => item._id}
                                    ListEmptyComponent={() => (
                                        <Text className="text-gray-400 text-center">No members found.</Text>
                                    )}
                                />
                                <TouchableOpacity
                                    onPress={() => setSeeMembersModalVisible(false)}
                                    className="mt-3"
                                >
                                    <Text className="text-secondary font-pregular text-center">Close</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Change Group Name Modal (Unchanged) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isChangeGroupNameModalVisible}
                onRequestClose={() => setChangeGroupNameModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setChangeGroupNameModalVisible(false)}>
                    <View className="flex-1 justify-center items-center bg-black/70">
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View className="bg-primary p-6 py-10 rounded-lg w-3/4">
                                <Text className="text-white text-center text-xl font-psemibold mb-6">Change Group Name</Text>
                                <TextInput
                                    value={newGroupName}
                                    onChangeText={setNewGroupName}
                                    placeholder="New group name"
                                    placeholderTextColor="#ccc"
                                    className="bg-white text-primary p-4 font-pregular rounded-md mb-4"
                                />
                                <TouchableOpacity
                                    onPress={handleUpdateGroupName}
                                    className="bg-secondary p-4 rounded-lg w-full items-center mb-4"
                                >
                                    <Text className="text-white text-base font-psemibold">Update Name</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setChangeGroupNameModalVisible(false)}
                                    className="mt-2"
                                >
                                    <Text className="text-gray-400 font-psemibold mt-2 text-center">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Group Code Modal (Unchanged) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isGroupCodeModalVisible}
                onRequestClose={() => setGroupCodeModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setGroupCodeModalVisible(false)}>
                    <View className="flex-1 justify-center items-center bg-black/70">
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View className="bg-primary p-6 rounded-lg w-3/4">
                                <Text className="text-white text-xl font-psemibold mb-10">Group Code</Text>
                                <Text className="text-white font-pmedium text-lg mb-3 text-center">{currentGroupId || 'No code available'}</Text>
                                {currentGroupId && (
                                    <TouchableOpacity
                                        onPress={() => handleCopyGroupCode()}
                                        className="bg-secondary p-4 rounded-lg w-full items-center mt-4 mb-4"
                                    >

                                        <Text className="text-white font-pmedium text-center">Tap to copy</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => setGroupCodeModalVisible(false)}
                                    className="mt-3"
                                >
                                    <Text className="text-secondary font-pregular text-center">Close</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Join Group Modal (Unchanged) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isJoinGroupModalVisible}
                onRequestClose={() => setJoinGroupModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setJoinGroupModalVisible(false)}>
                    <View className="flex-1 justify-center items-center bg-black/70">
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View className="bg-white p-6 rounded-lg w-80">
                                <Text className="text-black text-xl font-semibold mb-4 text-center">ADD GROUP</Text>
                                <Text className="text-gray-600 mb-2">Group Code</Text>
                                <TextInput
                                    value={joinGroupCode}
                                    onChangeText={setJoinGroupCode}
                                    placeholder="Enter group code"
                                    placeholderTextColor="#ccc"
                                    className="bg-gray-100 text-black p-3 rounded-md mb-4"
                                />
                                <Button title="Join Group" onPress={() => {
                                    console.log('Joining group with code:', joinGroupCode);
                                    setJoinGroupModalVisible(false);
                                }} color="#6c5ce7" />
                                <TouchableOpacity
                                    onPress={() => {
                                        setJoinGroupModalVisible(false);
                                        console.log('Navigate to New Group screen');
                                        navigation.navigate('CreateGroup'); 
                                    }}
                                    className="mt-3"
                                >
                                    <Text className="text-gray-600 text-center">Create a new group instead? <Text className="text-blue-500">New Group</Text></Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};


export default GroupInfo;