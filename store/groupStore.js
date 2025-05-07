// stores/groupStore.js or groupStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useGroupStore = create((set) => ({
    isLoading: false,
    groups: [],

    createGroup: async (groupName, groupPhoto = '') => {
        set({ isLoading: true });
        try {
            const token = await AsyncStorage.getItem('token');

            const response = await fetch("https://mern-vibro.onrender.com/api/group/createGroup", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ groupName, groupPhoto }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Failed to create group");

            // Optionally update group list state
            set((state) => ({
                groups: [...state.groups, data.group],
                isLoading: false,
            }));

            return { success: true, group: data.group };

        } catch (error) {
            console.error("Error creating group:", error);
            set({ isLoading: false });
            return { success: false, error: error.message };
        }
    },getGroups: async () => {
        set({ isLoading: true });
        try {
            const token = await AsyncStorage.getItem('token');

            const response = await fetch("https://mern-vibro.onrender.com/api/group/getGroups", {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            console.log("Groups data:", data); // Debugging line

            if (!response.ok) throw new Error(data.message || "Failed to fetch groups");

            set({
                groups: data.groups, // Update the groups state
                isLoading: false,
            });
        } catch (error) {
            console.error("Error fetching groups:", error);
            set({ isLoading: false });
        }
    },
    


}));
