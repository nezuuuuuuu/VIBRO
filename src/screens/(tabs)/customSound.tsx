import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Modal, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../constants';

const CustomSounds = () => {
    const navigation = useNavigation();
    const [isCreateFolderModalVisible, setCreateFolderModalVisible] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [isUploadModalVisible, setUploadModalVisible] = useState(false);

    const toggleCreateFolderModal = () => {
        setCreateFolderModalVisible(!isCreateFolderModalVisible);
        setNewFolderName('');
    };

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            setFolders([...folders, { name: newFolderName, files: [] }]);
            toggleCreateFolderModal();
        }
    };

    const openFolder = (folder) => {
        setSelectedFolder(folder);
    };

    const closeFolder = () => {
        setSelectedFolder(null);
    };

    const toggleUploadModal = () => {
        setUploadModalVisible(!isUploadModalVisible);
    };

    const handleUploadFile = () => {
        // Implement your file upload logic here
        if (selectedFolder) {
            const newFile = { name: 'New Sound ' + (selectedFolder.files.length + 1) }; // Placeholder
            const updatedFolders = folders.map(folder =>
                folder.name === selectedFolder.name ? { ...folder, files: [...folder.files, newFile] } : folder
            );
            setFolders(updatedFolders);
            toggleUploadModal();
        }
    };

    return (
        <View className='bg-primary p-4 flex-1'>
            <TouchableOpacity
                className="bg-[#2a2a5a] p-4 rounded-lg mb-4"
                onPress={toggleCreateFolderModal}
            >
                <Text className="text-white font-psemibold text-lg">Create New Folder</Text>
            </TouchableOpacity>

            <Text className='text-white my-3 font-psemibold'>Folders:</Text>
            <ScrollView className='w-full'>
                {folders.map((folder, index) => (
                    <TouchableOpacity
                        key={index}
                        className='bg-[#333366] p-4 mb-2 rounded-lg'
                        onPress={() => openFolder(folder)}
                    >
                        <View className="flex-row items-center space-x-3">
                            <Image
                                source={icons.folder}
                                className="w-6 h-6 tint-white"
                                resizeMode="contain"
                            />
                            <Text className="text-white font-pregular text-lg">{folder.name}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
                {folders.length === 0 && <Text className="text-gray-400">No folders created yet.</Text>}
            </ScrollView>

            {/* Create Folder Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isCreateFolderModalVisible}
                onRequestClose={toggleCreateFolderModal}
            >
                <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
                    <View className="bg-primary p-6 rounded-lg w-80">
                        <Text className="text-white font-psemibold text-xl mb-4">Create New Folder</Text>
                        <TextInput
                            className="bg-[#2a2a5a] text-white p-3 rounded-md mb-4"
                            placeholder="Folder Name"
                            placeholderTextColor="#ccc"
                            value={newFolderName}
                            onChangeText={setNewFolderName}
                        />
                        <View className="flex-row justify-end">
                            <TouchableOpacity className="py-2 px-4 rounded-md mr-2" onPress={toggleCreateFolderModal}>
                                <Text className="text-gray-400">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-accent py-2 px-4 rounded-md"
                                onPress={handleCreateFolder}
                            >
                                <Text className="text-white font-psemibold">Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Folder Content Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={selectedFolder !== null}
                onRequestClose={closeFolder}
            >
                <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
                    <View className="bg-primary p-6 rounded-lg w-80">
                        <Text className="text-white font-psemibold text-xl mb-4">{selectedFolder?.name}</Text>
                        <ScrollView style={{ maxHeight: 200 }}>
                            {selectedFolder?.files.map((file, index) => (
                                <Text key={index} className="text-white mb-2">{file.name}</Text>
                            ))}
                            {selectedFolder?.files.length === 0 && <Text className="text-gray-400">No sounds in this folder yet.</Text>}
                        </ScrollView>
                        <TouchableOpacity
                            className="bg-accent py-2 px-4 rounded-md mt-4"
                            onPress={toggleUploadModal}
                        >
                            <Text className="text-white font-psemibold">Upload Sound</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="py-2 px-4 rounded-md mt-2" onPress={closeFolder}>
                            <Text className="text-gray-400">Close Folder</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Upload Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isUploadModalVisible}
                onRequestClose={toggleUploadModal}
            >
                <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
                    <View className="bg-primary p-6 rounded-lg w-80">
                        <Text className="text-white font-psemibold text-xl mb-4">Upload Sound</Text>
                        <Text className="text-gray-400 mb-3">Select a sound file to upload to "{selectedFolder?.name}"</Text>
                        {/* Implement file selection here */}
                        <TouchableOpacity className="bg-[#2a2a5a] p-3 rounded-md mb-4">
                            <Text className="text-white">Browse Files</Text>
                        </TouchableOpacity>
                        <View className="flex-row justify-end">
                            <TouchableOpacity className="py-2 px-4 rounded-md mr-2" onPress={toggleUploadModal}>
                                <Text className="text-gray-400">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-accent py-2 px-4 rounded-md"
                                onPress={handleUploadFile}
                            >
                                <Text className="text-white font-psemibold">Upload</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default CustomSounds;