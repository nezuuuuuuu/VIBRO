import { create } from 'zustand';
import io from 'socket.io-client';
import { Alert } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native'; // You likely need this
// import BASE_URL from './api'; // Not used here
const SOCKET_URL = 'https://mern-vibro.onrender.com';
// const SOCKET_URL = 'http://192.168.1.104:3000';

export const useSocket = create((set, get) => ({
  socket: null,
  onlineUsers: new Set(),
  isOnline: false,

  updateOnlineStatus: (userId, isOnline) => {
    console.log("Updating online status for:", userId, "Status:", isOnline);
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      if (isOnline) newSet.add(userId);
      else newSet.delete(userId);
      return { onlineUsers: newSet };
    });
  },

  connect: (userId, groupIds = []) => {
    const newSocket = io(SOCKET_URL, {
      query: {
        userId,
        groups: groupIds.join(','),
      },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to socket server:', newSocket.id);
      set({ socket: newSocket, isOnline: true });

      // Heartbeat
      const heartbeatInterval = setInterval(() => {
        if (newSocket && newSocket.connected) {
          newSocket.emit('heartbeat');
        }
      }, 15000);

      // User online/offline status updates
      newSocket.on('user-online', ({ userId }) => {
        get().updateOnlineStatus(userId, true);
      });

      newSocket.on('user-offline', ({ userId }) => {
        get().updateOnlineStatus(userId, false);
      });

      // Handle incoming sound events
      newSocket.on('new-sound', async ({ userId, username, groupId, groupName, label, confidence, sound }) => {
         const NOTIF_LEVEL_1_ALLOWED_LABELS = ['Police car (siren)', 'Siren'];
       

        if (NOTIF_LEVEL_1_ALLOWED_LABELS.includes(label)) {
          try {
            await notifee.displayNotification({
              title: `From: ${username} (${groupName})`,
              body: `Detected: ${label}\nConfidence: ${(confidence * 100).toFixed(2)}% - LEVEL 1`,
              android: {
                channelId: 'sound-alerts3',
                importance: AndroidImportance.HIGH,
              },
            });
          } catch (err) {
            console.error('❌ Error showing notification:', err);
          }
        }
      });

      newSocket.on('notifyNewMessage',  async ({groupName, senderId,senderUsername}) => {
        try {
          if(senderId != userId) {
          console.log('New message notification:', groupName, senderUsername);
           await notifee.displayNotification({
          title: `New message in ${groupName}`,
          body: `${senderUsername} sent a message`,
          android: {
             channelId: 'chat-alerts-v2',
            importance: AndroidImportance.HIGH,

          },
        });
        }
        } catch (err) {
          console.error('❌ Error showing notification:', err);
        }
      });

      
    });

    

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
      set({ isOnline: false });
    });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isOnline: false });
    }
  },
}));
