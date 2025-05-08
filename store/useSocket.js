import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import BASE_URL from './api'; // Adjust the path as needed

const SOCKET_URL =  BASE_URL; // Replace with your server IP

const useSocket = () => {
  const [socket, setSocket] = useState(null);

  const connect = (userId) => {
    const newSocket = io(SOCKET_URL, {
      query: { userId },
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server:', newSocket.id);
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return { socket, connect, disconnect };
};

export default useSocket;
