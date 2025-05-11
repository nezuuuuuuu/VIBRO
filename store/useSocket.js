import { useState, useEffect } from 'react';
import { create } from 'zustand';

import io from 'socket.io-client';
import BASE_URL from './api'; // Adjust the path as needed

const SOCKET_URL =  'http://192.168.1.3:3000'; // Replace with your server IP

export const useSocket = create((set, get) => ({
  socket: null,
  onlineUsers: new Set(),
  updateOnlineStatus: (userId, isOnline) => {
    console.log("ADDING ONLINE USER"+userId)
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
      set({ socket: newSocket });
      const heartbeatInterval = setInterval(() => {
        if (newSocket && newSocket.connected) {
          newSocket.emit('heartbeat');
          }
        }, 15000);

        newSocket.on('user-online', ({ userId }) => {
          get().updateOnlineStatus(userId, true);
        });

        newSocket.on('user-offline', ({ userId }) => {
          get().updateOnlineStatus(userId, false);
        });
        set({ socket: newSocket });


    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

      
  },

   disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },




}));
