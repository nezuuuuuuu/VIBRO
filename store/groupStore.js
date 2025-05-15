// stores/groupStore.js or groupStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './api'; // Adjust the path as needed
import { useAuthStore } from './authStore';

// Corrected create function signature to include 'get'
export const useGroupStore = create((set, get) => ({
    isLoading: false,
    groups: [],
    groupPointer: null ,
    groupMembersPointer: [],

   
    getGroupId: () => {
        return get().groupPointer?.groupid || get().groupPointer?._id || null;
    },

    createGroup: async (groupName, groupPhoto = '') => {
        set({ isLoading: true });
        try {
            const token = await AsyncStorage.getItem('token');

            const response = await fetch(`${BASE_URL}/group/createGroup`, {
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
    },
    getGroups: async () => {
        set({ isLoading: true });
        try {
            const token = await AsyncStorage.getItem('token');

            const response = await fetch(`${BASE_URL}/group/getGroups`, {
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
            const response = await fetch(`${BASE_URL}/group/${groupId}`, {
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
    joinGroup: async (groupId) => {
        set({ isLoading: true });
        try {
            const token = await AsyncStorage.getItem('token');

            const response = await fetch(`${BASE_URL}/group/${groupId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                 const errorMessage = data.message || `Server responded with status ${response.status}`;
                 console.error("API error joining group:", errorMessage, data);
                 set({ isLoading: false });
                 // Return false success status and the error message from the server
                 return { success: false, error: errorMessage };
            }

            // --- Success case (Server returned 2xx) ---
            // Add the newly joined group to the groups list if successful
            // Assuming the server returns the full group object on success
            if (data.group) {
                 set((state) => ({
                     // Prevent adding duplicate if backend logic somehow allows
                     groups: [...state.groups.filter(g => g._id !== data.group._id), data.group],
                     isLoading: false,
                 }));
                 // Return true success status and the joined group data
                 return { success: true, group: data.group };
            } else {
                 // Handle unexpected success response without group data
                 console.warn("Join group successful but no group data returned:", data);
                 set({ isLoading: false });
                 return { success: true, message: data.message || "Joined group successfully." }; // Still success, but data missing
            }


        } catch (error) {
            console.error("Network or unexpected error joining group:", error);
            set({ isLoading: false });
            return { success: false, error: error.message || "An unexpected error occurred while joining group." };
        }
    },


    getMembers: async(groupId) => {
        console.log(groupId)
        set({ isLoading: true });
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/group/getMembers/${groupId}`, {
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
    },
    updateGroupName: async (groupId, newGroupName) => {
        set({ isLoading: true });
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                set({ isLoading: false });
                return { success: false, error: "Authentication token not found." };
            }

            const response = await fetch(`${BASE_URL}/group/${groupId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ groupName: newGroupName }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Capture the specific error message from the server response
                const errorMessage = data.message || `Server responded with status ${response.status}`;
                console.error("API error updating group name:", errorMessage, data);
                set({ isLoading: false });
                return { success: false, error: errorMessage }; // Return the specific error
            }

            // Success case: Update local state
            // 'get()' is now available here because it's in the create signature
            set({
                groupPointer: { ...get().groupPointer, groupName: data.group.groupName },
                groups: get().groups.map(group =>
                    group._id === groupId ? { ...group, groupName: data.group.groupName } : group
                ),
                isLoading: false,
            });

            return { success: true }; // Indicate success

        } catch (error) {
            console.error("Network or unexpected error updating group name:", error);
            set({ isLoading: false });
            // Return a generic error for network issues, or the error message itself
            return { success: false, error: error.message || "An unexpected error occurred." };
        }
    },


    leaveGroup: async (groupId) => {
        set({ isLoading: true });
        try {
            const token = await AsyncStorage.getItem('token');
            // Get the current user ID from the auth store
             // THIS LINE NOW WORKS BECAUSE useAuthStore IS IMPORTED ABOVE
            const userId = useAuthStore.getState().user?._id;

            if (!userId) {
                 set({ isLoading: false });
                 return { success: false, error: "User not authenticated." };
            }
             if (!groupId) {
                 set({ isLoading: false });
                 return { success: false, error: "Group ID is missing." };
             }

            // Use your backend endpoint for removing a member
            const response = await fetch(`${BASE_URL}/group/${groupId}/members/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.message || `Server responded with status ${response.status}`;
                console.error("API error leaving group:", errorMessage, data);
                set({ isLoading: false });
                return { success: false, error: errorMessage };
            }

            // Success case: Remove the group from the 'groups' list in the store
            set((state) => ({
                groups: state.groups.filter(group => group._id !== groupId),
                groupPointer: null, // Clear the groupPointer if the user left the current group
                groupMembersPointer: [], // Clear members list
                isLoading: false,
            }));

            return { success: true, message: data.message || 'Left group successfully.' };

        } catch (error) {
            console.error("Network or unexpected error leaving group:", error);
            set({ isLoading: false });
            return { success: false, error: error.message || "An unexpected error occurred." };
        }
    },
}));