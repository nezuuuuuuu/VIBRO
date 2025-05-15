import React, { useState, useLayoutEffect } from 'react';
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

const GroupInfo = () => {
    const { groupPointer, getMembers, groupMembersPointer, updateGroupName: updateGroupNameStore, getGroupId, leaveGroup} = useGroupStore();
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const currentUserId = user?._id;

    const [isSeeMembersModalVisible, setSeeMembersModalVisible] = useState(false);
    const [isChangeGroupNameModalVisible, setChangeGroupNameModalVisible] = useState(false);
    const [isGroupCodeModalVisible, setGroupCodeModalVisible] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [joinGroupCode, setJoinGroupCode] = useState('');
    const [isJoinGroupModalVisible, setJoinGroupModalVisible] = useState(false);

    // Get the group ID using the new selector function
    const currentGroupId = getGroupId();

    useLayoutEffect(() => {
        if (navigation && groupPointer) {
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
                    <TouchableOpacity onPress={() => setJoinGroupModalVisible(true)} className="mr-4">
                        <Image source={icons.add_group} className="w-6 h-6 tint-white" resizeMode="contain" />
                    </TouchableOpacity>
                ),
            });
             // Also update the initial state of newGroupName when groupPointer changes
            setNewGroupName(groupPointer.groupName || '');
        }
    }, [navigation, groupPointer]);

    const handleSeeMembers = () => {
        getMembers(groupPointer?._id);
        setSeeMembersModalVisible(true);
        console.log('See members pressed');
    };

    const handleChangeGroupName = () => {
        // Set initial value when opening the modal
        setNewGroupName(groupPointer?.groupName || '');
        setChangeGroupNameModalVisible(true);
        console.log('Change group name pressed');
    };

    const handleUpdateGroupName = async () => {
        if (!newGroupName.trim()) { // Check for empty name first
             Alert.alert('Warning', 'Group name cannot be empty.');
             return; // Stop execution if name is empty
        }
        if (!groupPointer?._id) { // Check if groupPointer and its ID exist
             Alert.alert('Error', 'Group information not available.');
             return; // Stop execution if group info is missing
        }

        const result = await updateGroupNameStore(groupPointer._id, newGroupName); // Get the result object

        if (result.success) {
            setChangeGroupNameModalVisible(false);
            Alert.alert('Success', 'Group name updated successfully.'); // Optional success message
        } else {
            // Use the specific error message from the store
            Alert.alert('Error', result.error || 'Failed to update group name.');
        }
    };


    const handleGroupCode = () => {
        setGroupCodeModalVisible(true);
        console.log('Group code pressed');
    };

    const handleCopyGroupCode = () => {
        // Use the currentGroupId obtained from the selector
        if (currentGroupId) {
            Clipboard.setString(currentGroupId);
            Alert.alert('Copied!', 'Group code copied to clipboard.');
        } else {
            Alert.alert('Error', 'No group code available.');
        }
    };

    const renderMemberItem = ({ item }) => (
        <View className="flex-row items-center p-4 mb-2 rounded-lg bg-primary">
            <Image
                source={{ uri: `https://api.dicebear.com/7.x/personas/png?seed=${item?.username || 'guest'}` }}
                className="w-10 h-10 rounded-full bg-gray-300 mr-4"
                resizeMode="cover"
            />
            <Text className="text-white font-pregular text-lg">{item.username}</Text>
        </View>
    );

    return (
        <View className='bg-primary p-4 flex-1'>
            <ScrollView className='w-full rounded-lg'>
                {groupPointer && (
                    <View className="mb-6">
                        <View className="flex-row gap-20 justify-center mb-10 mt-6">
    

                            <TouchableOpacity
                                onPress={handleSeeMembers}
                                className="items-center"
                            >
                                <View className="bg-gray-600 p-3 rounded-full mb-2">
                                    <Image source={icons.group} className="w-6 h-6 tint-white" resizeMode="contain" />
                                </View>
                                <Text className="text-white font-pregular text-sm">See Members</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleChangeGroupName}
                            className="py-4"
                        >
                            <Text className="text-white font-pregular text-lg">Change group name</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleGroupCode}
                            className="py-4"
                        >
                            <Text className="text-white font-pregular text-lg">Group code</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View>
                    <TouchableOpacity
                        onPress={() => {
                            // Implement leave group functionality
                            console.log('Leave group pressed');
                            // You would likely dispatch an action to leave the group and navigate away
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
                                             onPress: async () => { // <-- Make this function async
                                                 console.log("Attempting to leave group:", currentGroupId);
                                                 // Call the leaveGroup action from the store
                                                 const result = await leaveGroup(currentGroupId);

                                                 if (result.success) {
                                                     Alert.alert('Success', result.message || 'You have left the group.');
                                                     // Navigate away after successfully leaving
                                                     // Choose an appropriate screen, like the list of groups or home
                                                     navigation.navigate('GroupsList'); // Replace 'GroupsScreen' with your actual screen name
                                                 } else {
                                                     Alert.alert('Error', result.error || 'Failed to leave group.');
                                                 }
                                             },
                                             style: "destructive"
                                         }
                                     ]
                                 );
                        }}
                        className="py-4"
                    >
                        <Text className="text-red-500 font-pregular text-lg">Leave group</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* See Members Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isSeeMembersModalVisible}
                onRequestClose={() => setSeeMembersModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setSeeMembersModalVisible(false)}>
                    <View className="flex-1 justify-center items-center p-1 bg-black/70">
                        <TouchableWithoutFeedback onPress={() => {}}>
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

            {/* Change Group Name Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isChangeGroupNameModalVisible}
                onRequestClose={() => setChangeGroupNameModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setChangeGroupNameModalVisible(false)}>
                    <View className="flex-1 justify-center items-center bg-black/70">
                        <TouchableWithoutFeedback onPress={() => {}}>
                            <View className="bg-primary p-6 py-10 rounded-lg w-3/4">
                                <Text className="text-white text-xl font-psemibold mb-4">Change Group Name</Text>
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
                                    <Text className="text-secondary font-pregular mt-2 text-center">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Group Code Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isGroupCodeModalVisible}
                onRequestClose={() => setGroupCodeModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setGroupCodeModalVisible(false)}>
                    <View className="flex-1 justify-center items-center bg-black/70">
                        <TouchableWithoutFeedback onPress={() => {}}>
                            <View className="bg-primary p-6 rounded-lg w-3/4">
                                <Text className="text-white text-xl font-psemibold mb-10">Group Code</Text>
                                <Text className="text-white font-pmedium text-lg mb-3 text-center">{currentGroupId  || 'No code available'}</Text>
                                {currentGroupId  && (
                                    <TouchableOpacity
                                        onPress={ () => handleCopyGroupCode()}
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

            {/* Join Group Modal (Opened from Header Right Button) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isJoinGroupModalVisible}
                onRequestClose={() => setJoinGroupModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setJoinGroupModalVisible(false)}>
                    <View className="flex-1 justify-center items-center bg-black/70">
                        <TouchableWithoutFeedback onPress={() => {}}>
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
                                    // Call your join group action with joinGroupCode
                                    // e.g., useGroupStore.getState().joinGroup(joinGroupCode);
                                    setJoinGroupModalVisible(false);
                                }} color="#6c5ce7" />
                                <TouchableOpacity
                                    onPress={() => {
                                        setJoinGroupModalVisible(false);
                                        // Navigate to create new group screen/modal
                                        console.log('Navigate to New Group screen');
                                        navigation.navigate('CreateGroup'); // Replace 'CreateGroup' with your actual screen name
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