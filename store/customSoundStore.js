// stores/useCustomSoundStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './api'; // Adjust the path as needed

export const useCustomSoundStore = create((set, get) => ({
    folders: [],
    isLoading: false,
    error: null,

    // --- Folder Actions ---
    addFolder: async (folderName, groupId) => {
        set({ isLoading: true, error: null });
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/customSound/addFolder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ folderName, groupId }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to add folder');

         
            return { success: true, folder: data };
        } catch (error) {
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
        }
    },

    removeFolder: async (folderId) => {
        set({ isLoading: true, error: null });
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/customSound/removeFolder`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ folderId }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to remove folder');

            // Remove the folder and its associated sounds from the state
            set((state) => ({
                folders: state.folders.filter(folder => folder._id !== folderId),
                soundsWithoutFolder: state.soundsWithoutFolder.filter(sound => sound.folderId !== folderId), // In case sounds were moved out of a folder
                isLoading: false,
            }));
            return { success: true };
        } catch (error) {
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
        }
    },

    // --- Sound Actions ---
    addSound: async (groupId, userId, folderId, filename, sound) => {
        set({ isLoading: true, error: null });
        try {
            console.log('Adding sound:', { groupId, userId, folderId, filename, sound });
         
            const token = await AsyncStorage.getItem('token');
            

            const response = await fetch(`${BASE_URL}/customSound/addSound`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    // 'Content-Type': 'multipart/form-data' is not needed; fetch sets it automatically for FormData
                },
                 body: JSON.stringify({ groupId, userId, folderId, filename, sound}),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to add sound');

            // Add the new sound to the appropriate place in the state
             set((state) => {
               const updatedFolders = state.folders.map(folder =>
                    folder._id === data.folderId
                        ? { ...folder, sounds: [...folder.sounds, data] }
                        : folder
                );
                return { folders: updatedFolders, isLoading: false };
                });
        

            return { success: true, sound: data };
        } catch (error) {
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
        }
    },

    removeSound: async (soundId) => {
        set({ isLoading: true, error: null });
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/customSound/removeSound`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ soundId }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to remove sound');

            // Remove the sound from the state
            set((state) => ({
                folders: state.folders.map(folder => ({
                    ...folder,
                    sounds: folder.sounds.filter(sound => sound._id !== soundId)
                })),
                soundsWithoutFolder: state.soundsWithoutFolder.filter(sound => sound._id !== soundId),
                isLoading: false,
            }));
            return { success: true };
        } catch (error) {
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
        }
    },
   getFolders: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/customSound/folders/${groupId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch folders');
        }
        console.log('Fetched folders:', data);

        // Fetch sounds for each folder
        const foldersWithSounds = await Promise.all(
            data.folders.map(async (folder) => {
                try {
                    const soundsResponse = await fetch(`${BASE_URL}/customSound/sounds/${folder._id}`, {  // Corrected URL
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    const soundsData = await soundsResponse.json();
                    console.log('Fetched sounds for folder:', folder._id, soundsData);
                    if (!soundsResponse.ok) {
                         //  Important:  Handle errors when fetching sounds for a folder.
                        console.error(`Failed to fetch sounds for folder ${folder._id}:`, soundsData);
                        return { ...folder, sounds: [] }; // Return the folder with empty sounds array on error
                    }
                    return { ...folder, sounds: soundsData.sounds };
                } catch (error) {
                    console.error(`Error fetching sounds for folder ${folder._id}:`, error);
                    return { ...folder, sounds: [] }; // Return the folder with empty sounds array on error
                }
            })
        );

        set({
            folders: foldersWithSounds, //  Use the new array with sounds
            isLoading: false,
        });
        return { success: true };
    } catch (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
    }
},
getSoundById: async (soundId) => {
    set({ isLoading: true, error: null });
    try {
        const token = await AsyncStorage.getItem('token');

        const response = await fetch(`${BASE_URL}/customSound/sound/${soundId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch sound');
        }
        console.log('Fetched sound:', data.sound);

        set({ isLoading: false });
        return { sound: data.sound };
    } catch (error) {
        console.error('Error fetching sound by ID:', error.message);
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
    }
},
    clearAll: () => set({ folders: [], soundsWithoutFolder: [] }),
}));