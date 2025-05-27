import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert // Import Alert for confirmation dialog
} from 'react-native';
import RNFS from 'react-native-fs';
import { useModelStore } from '../../../store/modelStore';
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../constants';
import "../../../global.css";

const { width } = Dimensions.get('window');

type FileItem = {
  id: string;
  name: string;
  path: string;
  selected: boolean;
  modelName?: string;
  labels?: string[];
};

const Sound = () => {
  const navigation = useNavigation();
  const { fetchModelById, setActiveModel, useLabels, labels } = useModelStore();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const HEADER_BACKGROUND_COLOR = '#1B1B3A';
  const CARD_BACKGROUND_COLOR = '#2A2A5A';
  const ACTIVE_SWITCH_COLOR = '#8A2BE2';
  const INACTIVE_SWITCH_COLOR = '#767577';

  const GLOW_COLOR_IOS = '#6C63FF';
  const GLOW_COLOR_ANDROID = '#6C63FF';

  useLayoutEffect(() => {
    if (navigation) {
      navigation.setOptions({
        headerTitle: () => (
          <Text className="font-pbold text-2xl text-white">CUSTOM SOUNDS</Text>
        ),
        headerStyle: {
          backgroundColor: HEADER_BACKGROUND_COLOR,
          borderBottomWidth: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        },
      });
    }
  }, [navigation]);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const directoryPath = `${RNFS.DocumentDirectoryPath}/models`;

        const exists = await RNFS.exists(directoryPath);
        if (!exists) {
          await RNFS.mkdir(directoryPath);
          console.log("Created '/models' directory.");
        }

        const result = await RNFS.readDir(directoryPath);
        const filteredFiles = result.filter(file => file.isFile() && file.name.endsWith('.tflite'));

        const fileItems: FileItem[] = await Promise.all(
          filteredFiles.map(async (file) => {
            const id = file.name.replace('.tflite', '');
            let modelName;
            let labels;
            try {
              const response = await fetchModelById(id);
              modelName = response?.modelName || undefined;
              labels = response?.modelLabels || undefined;
            } catch (e) {
              console.warn(`Model metadata not found for ID: ${id}`);
            }

            return {
              id,
              name: file.name,
              path: file.path,
              selected: false,
              modelName,
              labels
            };
          })
        );

        setFiles(fileItems);
      } catch (error) {
        console.error('Failed to read files:', error);
      }
    };

    loadFiles();
    // Re-load files if a model was selected/deactivated and currentSelectedModel changed
    // This is a basic approach, you might want more granular control based on your app's flow
    const unsubscribe = navigation.addListener('focus', () => {
      loadFiles();
    });

    return unsubscribe;
  }, [navigation]); // Added navigation to dependency array to ensure listener is set up correctly

  const getSelectedModel = (): FileItem | null => {
    if (!selectedModelId) return null;
    return files.find((file) => file.id === selectedModelId) || null;
  };

  useEffect(() => {
    if (selectedModelId) {
      const selectedModel = getSelectedModel();
      console.log("Selected model labels (not displayed):", selectedModel?.labels);
    }
  }, [selectedModelId, setActiveModel]);

  const handleToggle = (index: number) => {
    const toggledFile = files[index];
    let newSelectedId: string | null = null;

    if (!toggledFile.selected) {
      newSelectedId = toggledFile.id;
    } else {
      newSelectedId = null;
    }

    const updatedFiles = files.map((file, i) => ({
      ...file,
      selected: i === index ? !file.selected : false,
    }));

    setFiles(updatedFiles);
    setSelectedModelId(newSelectedId);

    const selectedFile = newSelectedId
      ? updatedFiles.find(file => file.id === newSelectedId) ?? null
      : null;
    setActiveModel(selectedFile);
  };

  const handleDeleteModel = async (modelId: string, modelName: string) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete the model "${modelName}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const filePath = `${RNFS.DocumentDirectoryPath}/models/${modelId}.tflite`;
              const exists = await RNFS.exists(filePath);

              if (exists) {
                await RNFS.unlink(filePath);
                Alert.alert("Success", `Model "${modelName}" deleted successfully.`);

                // Remove the deleted file from the state
                setFiles(prevFiles => prevFiles.filter(file => file.id !== modelId));

                // If the deleted model was the active one, deactivate it
                if (selectedModelId === modelId) {
                  setSelectedModelId(null);
                  setActiveModel(null);
                }
              } else {
                Alert.alert("Error", `Model file not found for "${modelName}".`);
              }
            } catch (error) {
              console.error('Failed to delete file:', error);
              Alert.alert("Error", `Failed to delete model "${modelName}". Please try again.`);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const renderItem = ({ item, index }: { item: FileItem, index: number }) => (
    <TouchableOpacity
      onPress={() => handleToggle(index)}
      className={`mb-3 bg-[#2A2A5A] rounded-xl shadow- overflow-hidden ${item.selected ? 'border-2 border-violet-500' : ''}`}
      style={[
        { backgroundColor: CARD_BACKGROUND_COLOR, width: width * 0.9 },
        item.selected && {
          shadowColor: GLOW_COLOR_IOS,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 15,
        },
      ]}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between px-4 py-4">
        <View className="flex-1 mr-4">
          <Text className="text-white text-lg font-psemibold mb-1">
            {item.modelName || item.name}
          </Text>
          {item.modelName && (
            <Text className="text-gray-400 text-sm font-pregular">
              {item.path.split('/').pop()}
            </Text>
          )}
        </View>
        <View className="flex-row items-center"> 
          <Switch
            trackColor={{ false: INACTIVE_SWITCH_COLOR, true: ACTIVE_SWITCH_COLOR }}
            thumbColor={item.selected ? "#f4f3f4" : "#f4f3f4"}
            ios_backgroundColor={INACTIVE_SWITCH_COLOR}
            onValueChange={() => handleToggle(index)}
            value={item.selected}
            style={{ marginRight: 10 }} 
          />
          <TouchableOpacity onPress={() => handleDeleteModel(item.id, item.modelName || item.name)}>
            <Image
              source={icons.trash}
              className="w-6 h-6 tint-gray-400" 
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-primary" >
      <View className="px-4 py-6">
        <Text className='items-start text-lg text-white font-psemibold ml-5'>Available Custom Sound Models:</Text>
      </View>

      <FlatList
        data={files}
        keyExtractor={(item) => item.path}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <Image
              source={icons.trash}
              className="w-24 h-24 mb-4" 
              style={{ tintColor: '#808080' }}
              resizeMode="contain"
            />
            <Text className="text-gray-400 text-lg font-pregular text-center">
              No custom sound models found. Download some to get started!
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default Sound;