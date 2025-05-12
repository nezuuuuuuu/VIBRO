// stores/useSoundStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './api'; // Adjust the path as needed

export const useDetectedSoundStore = create((set) => ({
    sounds: [],
    isLoading: false,
    error: null,

    addSound: async (label, confidence) => {
        set({ isLoading: true, error: null });
        try {
            const token = await AsyncStorage.getItem('token');

            const response = await fetch(`${BASE_URL}/detectedSound/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ label, confidence }),
            });
       
            const data = await response.json();
            

            if (!response.ok) throw new Error(data.message || 'Failed to add sound');

            // Optionally add the new sound to state
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

    clearSounds: () => set({ sounds: [] }),
}));
