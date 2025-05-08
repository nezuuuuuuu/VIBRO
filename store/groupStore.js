// stores/groupStore.js or groupStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useGroupStore = create((set) => ({
    isLoading: false,
    groups: [],
    groupPointer: null ,
    groupMembersPointer: [],

    createGroup: async (groupName, groupPhoto = '') => {
        set({ isLoading: true });
        try {
            const token = await AsyncStorage.getItem('token');

            const response = await fetch("http://192.168.1.103:3000/api/group/createGroup", {
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
    
            const response = await fetch("http://192.168.1.103:3000/api/group/getGroups", {
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
    
            return data;  // You might want to return the data so the calling code can handle it
        } catch (error) {
            console.error("Error fetching groups:", error);
            set({ isLoading: false });
            return { success: false, error: error.message };  // Optional return on error
        }
    },
    setGroupNavigation: async(groupId) => {
        set({ isLoading: true });
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.103:3000/api/group/${groupId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });


            const data = await response.json();
         
            console.log(data)
            if (!response.ok) throw new Error(data.message || "Failed to fetch group");

            set({
                groupPointer: data.group, // Update the groups state
                isLoading: false,
            });
        } catch (error) {
            console.error("Error fetching groups:", error);
            set({ isLoading: false });
        }
    },
    getMembers: async(groupId) => {
        console.log(groupId)
        set({ isLoading: true });
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.103:3000/api/group/getMembers/${groupId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });


            const data = await response.json();
         
            
            if (!response.ok) throw new Error(data.message || "Failed to fetch group members");

            set({
                groupMembersPointer: data.users, // Update the groups state
                isLoading: false,
            });
        } catch (error) {
            console.error("Error fetching members :", error);
            set({ isLoading: false });
        }
    }
    


}));
