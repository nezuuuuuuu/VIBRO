import React, { use, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Switch,
} from 'react-native';
import RNFS from 'react-native-fs';
import { useModelStore } from '../../../store/modelStore';

type FileItem = {
  id: string;
  name: string;
  path: string;
  selected: boolean;
  modelName?: string;
  labels?: string[]; // Optional from backend
};

const Sound = () => {
  
  const {  fetchModelById, setActiveModel, useLabels,labels } = useModelStore();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

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
              console.log("Model name:", response);
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
  }, []);
   const getSelectedModel = (): FileItem | null => {
  if (!selectedModelId) return null;
  return files.find((file) => file.id === selectedModelId) || null;
};

  // When selectedModelId changes, fetch & set active model
  useEffect(() => {
    if (selectedModelId) {
  const selectedModel = getSelectedModel();
  
      useLabels(selectedModel?.labels || []);
      console.log("Selected model labels:", labels);
      
    }
  }, [selectedModelId, setActiveModel]);

 const handleToggle = (index: number) => {
  const toggledFile = files[index];
  let newSelectedId: string | null = null;

  if (!toggledFile.selected) {
    // Selecting this model
    newSelectedId = toggledFile.id;
  }

  // Update files array with correct selection states
  const updatedFiles = files.map((file, i) => ({
    ...file,
    selected: i === index ? !file.selected : false,
  }));

  setFiles(updatedFiles);
  setSelectedModelId(newSelectedId);

  // Find the selected file object (or null)
  const selectedFile = newSelectedId
    ? updatedFiles.find(file => file.id === newSelectedId) ?? null
    : null;
  setActiveModel(selectedFile);  // <-- Add this line
  


  console.log('Selected model:', selectedFile);
 
};

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Models</Text>
      <FlatList
        data={files}
        keyExtractor={(item) => item.path}
        renderItem={({ item, index }) => (
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.item}>
                {item.modelName || item.name}
              </Text>
              <Text style={styles.path}>{item.path}</Text>
            </View>
            <Switch
              value={item.selected}
              onValueChange={() => handleToggle(index)}
            />
          </View>
        )}
        ListEmptyComponent={<Text>No model files found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  item: { fontSize: 16 },
  path: { fontSize: 12, color: 'gray' },
});

export default Sound;
