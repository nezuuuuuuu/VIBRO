// stores/useSoundStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './api'; 

export const useDetectedSoundStore = create(
  persist( 
    (set) => ({
      sounds: [],
      isLoading: false,
      error: null,
      isMonitoringOn: false,
      
      setIsMonitoringOn: (value) => set({ isMonitoringOn: value }),

      addSound: async (label, confidence, sound) => {
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
    }),
    
    // 3. Configuration object is passed as the second argument to 'persist'
    {
      name: 'detected-sound-storage', 
      storage: createJSONStorage(() => AsyncStorage), 
      partialize: (state) => ({ 
        isMonitoringOn: state.isMonitoringOn 
      }),
    }
  )
);