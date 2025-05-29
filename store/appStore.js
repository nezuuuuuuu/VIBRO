// store/appStore.js
import { create } from 'zustand';
import { useSocket } from './useSocket';
import { useAuthStore } from './authStore';
import { useGroupStore } from './groupStore';

export const useAppStore = create((set, get) => ({
  isOfflineMode: false,
  isLoadingOfflineModeToggle: false,

  toggleOfflineMode: async () => {
    set({ isLoadingOfflineModeToggle: true });

    const currentIsOfflineMode = get().isOfflineMode;

    const { connect, disconnect } = useSocket.getState();
    const { user } = useAuthStore.getState();
    const userId = user?._id;
    const { groups } = useGroupStore.getState();
    const groupIds = groups.map(group => group._id);

    try {
      if (!currentIsOfflineMode) {
        disconnect();
        console.log("Disconnected from socket server for offline mode.");
      } else {
        if (userId) {
          await connect(userId, groupIds);
        } else {
          console.warn("Socket not connected: No user ID available for connection.");
        }
      }

      set((state) => ({
        isOfflineMode: !state.isOfflineMode
      }));

    } catch (error) {
      console.error("Error during offline mode toggle:", error);
    } finally {
      set({ isLoadingOfflineModeToggle: false });
    }
  },
}));