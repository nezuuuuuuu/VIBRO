import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './api'; // Adjust the path as needed

export const useAuthStore = create((set) => ({
    user: null,
    token: null,
    isLoading: false,

    register: async (username, email, password) => {
        
        set({ isLoading: true });
        
        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                password,
            }),
        })

        const data = await response.json();

        set({ isLoading: false });

        if(!response.ok) throw new Error(data.message || 'Registration failed!');
        
        // await AsyncStorage.setItem('user', JSON.stringify(data.user));
        // await AsyncStorage.setItem('token', data.token);


        // set({token: data.token, user:data.user, isLoading: false});

        return {success: true};
        


        } catch (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
        }

    },

    verifyOtp: async (email, otp) => {
        set({ isLoading: true });
        try {
            console.log("Attempting to verify OTP for email:", email); // Debug step 1

            const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp }),
            });
            
            const data = await response.json();

            if (response.ok) {
                set({ isLoading: false }); 
                console.log("Verification Success! User created, ready for login.");
                return { success: true };
            } else {
                // API returned an error (e.g., 400 Bad Request)
                sset({ isLoading: false });
                console.error("Verification API Error:", data.message);
                return { success: false, error: data.message };
            }
        } catch (error) {
            // Network failure or JSON parsing error
            set({ isLoading: false });
            console.error("Network or Unexpected Error during verification:", error); // Debug step 4
            return { success: false, error: "Network error or server unreachable." };
        }
    },

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });
        
            const data = await response.json();
            console.log("asdasdasd222222"+email + password)
            if(!response.ok) throw new Error(data.message || 'Something went wrong!');

            await AsyncStorage.setItem('user', JSON.stringify(data.user));
            await AsyncStorage.setItem('token', data.token);

            set({token: data.token, user:data.user, isLoading: false});

            return {success: true};


        } catch (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
        }
    },

    checkAuth: async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userJson = await AsyncStorage.getItem('user')
            const user = userJson ? JSON.parse(userJson) : null;

            set({token, user});

        } catch (error) {
            console.log("Auth check failed", error);
        }
    },

    logout: async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            set({ token: null, user: null });
        } catch (error) {
            console.log("Logout failed", error);
        }
    },
    updateProfile: async (newUserData) => {
        set({ isLoading: true });
        try {
            //  Update the user data on the server
            const response = await fetch(`${BASE_URL}/auth/update`, { //  endpoint
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useAuthStore.getState().token}`, // Include the token for authentication
                },
                body: JSON.stringify(newUserData), // Send the new user data
            });

            // **IMPORTANT CHANGE:** Awaited the response *before* reading the body
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to update profile');
            }
            
            const updatedUser = { ...useAuthStore.getState().user, ...responseData.user }; // Merge
            
            // Update AsyncStorage
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

            // Update the user state
            set({ user: updatedUser, isLoading: false });
             return { success: true };

        } catch (error) {
            set({ isLoading: false });
            console.error("Update profile failed:", error);
             return { success: false, error: error.message };
        }
    },setActiveStatus: async (isActive) => {
    console.log("Setting active status to:", isActive);
    set({ isLoading: true });
    try {
        const response = await fetch(`${BASE_URL}/auth/set-active`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${useAuthStore.getState().token}`,
            },
            body: JSON.stringify({ isActive }),
        });

        const text = await response.text();  // read as text first

        // Try parsing JSON after logging
        const responseData = JSON.parse(text);

        if (!response.ok) {
            throw new Error(responseData.message || 'Failed to update isActive status');
        }

        const updatedUser = { ...useAuthStore.getState().user, ...responseData.user };

        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser, isLoading: false });

        return { success: true };
    } catch (error) {
        set({ isLoading: false });
        console.error('Set isActive failed:', error);
        return { success: false, error: error.message };
    }
}

    
}));