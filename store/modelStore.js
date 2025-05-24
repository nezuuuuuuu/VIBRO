import RNFS from 'react-native-fs';
import axios from 'axios';
import { Buffer } from 'buffer';
import { create } from 'zustand';
import BASE_URL from './api'; // Adjust as needed
import { labels } from '../assets/data/yamnet_labels';

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

const API_BASE_URL = 'http://192.168.1.3:5000'; // Replace with your server IP

export const useModelStore = create((set) => ({
  loading: false,
  model: null,
  error: null,
  labels: [],
  activeModel: null,

  setLoading: (value) => set({ loading: value }),
  setError: (error) => set({ error }),
  setModel: (model) => set({ model }),

  fetchAndCreateModel: async (groupId, groupName) => {
    set({ loading: true, error: null });
    try {
      if (!groupId) throw new Error('groupId is required');

      const response = await axios.get(`${API_BASE_URL}/folders`, {
        params: { groupId },
        responseType: 'arraybuffer',
      });

      if (response.status === 200) {
        const directoryPath = `${RNFS.DocumentDirectoryPath}/models`;
        const exists = await RNFS.exists(directoryPath);
        if (!exists) await RNFS.mkdir(directoryPath);

        const sanitizedGroupName = groupName.replace(/\s+/g, '');
        const filePath = `${directoryPath}/${groupId}.tflite`;
        const base64Data = Buffer.from(response.data, 'binary').toString('base64');

        await RNFS.writeFile(filePath, base64Data, 'base64');
        console.log('Model saved at:', filePath);

        set({ loading: false });
        return { success: true, modelPath: filePath };
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }
    } catch (error) {
      console.error('fetchAndCreateModel error:', error.message);
      set({ loading: false, error: error.message });
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

  useLabels: (labelsArray) => {
    set({ labels: labelsArray });
  },
  setActiveModel: (model) => {
    
    set({ activeModel: model });
    console.log('Active model set to:', model);
  }


}));

