import RNFS from 'react-native-fs';
import axios from 'axios';
import { Buffer } from 'buffer';
import { create } from 'zustand';

// Adjust as needed
import BASE_URL from './api';
import { labels } from '../assets/data/yamnet_labels'; 

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

const API_BASE_URL = 'http://13.54.189.45'; // Replace with your server IP
// const API_BASE_URL = BASE_URL;


export const useModelStore = create((set) => ({
  isTrainingModel: false,
  model: null,
  error: null,
  labels: [],
  activeModel: null,

  setLoading: (value) => set({ isTrainingModel: value }),
  setError: (error) => set({ error }),
  setModel: (model) => set({ model }),

  fetchAndCreateModel: async (groupId, groupName) => {
  set({ isTrainingModel: true, error: null });
  console.log(`Starting model training for Group ID: ${groupId}, Group Name: ${groupName}`);
  try {
    if (!groupId) throw new Error('Group ID is required to train a model.');

    const url = `${API_BASE_URL}/folders?groupId=${groupId}`;
    const response = await fetch(url);
    console.log('Response received from server for model training request.');
    if (!response.ok) {
      throw new Error(`Failed to retrieve model: Server responded with status ${response.status}`);
    }

    // Fetch returns ArrayBuffer directly
    const arrayBuffer = await response.arrayBuffer();

    const directoryPath = `${RNFS.DocumentDirectoryPath}/models`;
    const exists = await RNFS.exists(directoryPath);
    if (!exists) await RNFS.mkdir(directoryPath);

    const filePath = `${directoryPath}/${groupId}.tflite`;

    // Convert ArrayBuffer → Base64
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    await RNFS.writeFile(filePath, base64Data, 'base64');
    console.log('Model saved at:', filePath);

    set({ isTrainingModel: false });
    return { success: true, modelPath: filePath };

  } catch (error) {
    console.error('fetchAndCreateModel error:', error.message);
    set({ isTrainingModel: false, error: error.message });
    return { success: false, error: error.message };
  }
},


  fetchModelById: async (groupId) => {
    set({ loading: true, error: null }); 
    try {
      console.log('Fetching model with ID:', groupId);
      const response = await fetch(`${BASE_URL}/model/bygroup/${groupId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Request failed with status code ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      set({ model: data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      console.error('Fetch model error:', err.message);
      return null;
    }
  },
  downloadModel :async (groupId, fileUrl) => {
  try {
    console.log("Downloading model from:", fileUrl);

    // 1. Folder path
    const directoryPath = `${RNFS.DocumentDirectoryPath}/models`;
    
    // 2. Ensure folder exists
    const exists = await RNFS.exists(directoryPath);
    if (!exists) {
      await RNFS.mkdir(directoryPath);
    }

    // 3. File output path e.g. /models/6837e7d7.tflite
    const filePath = `${directoryPath}/${groupId}.tflite`;

    // 4. Download directly from S3
    const result = await RNFS.downloadFile({
      fromUrl: fileUrl,          // direct S3 URL
      toFile: filePath,
      background: true,
    }).promise;

    if (result.statusCode === 200) {
      console.log("Model saved at:", filePath);
      return { success: true, modelPath: filePath };
    } else {
      throw new Error(`Failed to download: ${result.statusCode}`);
    }

  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);
    return { success: false, error };
  }
},

  useLabels: (labelsArray) => {
    set({ labels: labelsArray });
  },
  setActiveModel: (model) => {
    set({ activeModel: model });
    console.log('Active model set to:', model);
  }
}));