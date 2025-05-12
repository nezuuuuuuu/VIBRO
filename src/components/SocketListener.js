// components/SocketListener.js
import { useEffect } from 'react';
import {useSocket} from '../../store/useSocket';

const SocketListener = () => {
  const { socket, updateOnlineStatus } = useSocket();

  useEffect(() => {
   
    if (socket) {
      
      socket.on('user-online', ({ userId }) => updateOnlineStatus(userId, true));
      socket.on('user-offline', ({ userId }) => updateOnlineStatus(userId, false));
    
    }

    return () => {
      if (socket) {
        socket.off('user-online');
        socket.off('user-offline');
      }
    };
  }, [socket, updateOnlineStatus]);

  return null; // No UI, just listens to the socket events
};

export default SocketListener;
