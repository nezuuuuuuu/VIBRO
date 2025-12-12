// stores/useSoundStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './api'; // Adjust the path as needed

export const useDetectedSoundStore = create((set) => ({
    sounds: [],
    isLoading: false,
    error: null,
   isMonitoringOn: false,

  setIsMonitoringOn: async (value) => {
    try {
   
      await AsyncStorage.setItem('isMonitoringOn', JSON.stringify(value));
      // Update Zustand state
      set({ isMonitoringOn: value });
    } catch (error) {
      console.error('Failed to save isMonitoringOn to AsyncStorage', error);
    }
  },
  loadMonitoringState: async () => {
    try {
      const storedValue = await AsyncStorage.getItem('isMonitoringOn');
      if (storedValue !== null) {
        set({ isMonitoringOn: JSON.parse(storedValue) });
      }
    } catch (error) {
      console.error('Failed to load isMonitoringOn from AsyncStorage', error);
    }
  }, addSound: async (label, confidence, sound) => {
        set({ isLoading: true, error: null });

        try {
          const token = await AsyncStorage.getItem('token');

          const response = await fetch(`${BASE_URL}/detectedSound/add`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ label, confidence, sound }),
          });

          const data = await response.json();

          if (!response.ok) throw new Error(data.message || 'Failed to add sound');

          set((state) => ({
            sounds: [data.sound, ...state.sounds],
            isLoading: false,
          }));

          return { success: true };

        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      fetchUserSounds: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const token = await AsyncStorage.getItem('token');

          const response = await fetch(`${BASE_URL}/detectedSound/${userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) throw new Error(data.message || 'Failed to fetch sounds');

          set({ sounds: data.sounds, isLoading: false });
          return { success: true };

        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },
      
      clearSound: async () => {
        set({ isLoading: true, error: null });
        set({ sounds: null, isLoading: false });
      },

      clearSounds: () => set({ sounds: [] }),
}));
