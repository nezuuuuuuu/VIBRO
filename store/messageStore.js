import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './api';

export const useMessageStore = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch messages
  const fetchMessages = useCallback(async (groupId) => {
    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token:', token);
      if (!token) throw new Error('Authentication token not found');

      const response = await fetch(`${BASE_URL}/messages/${groupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async ({ groupId, messageType, message, imageUrl = '' }) => {
  setLoading(true); 
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication token not found');

    const response = await fetch(`${BASE_URL}/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        groupId,
        messageType,
        message: messageType === 'text' ? message : null,
        imageUrl: messageType === 'image' ? imageUrl : null,
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'Could not parse error body' };
      }
      console.error('Send message failed:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setMessages(prev => [...prev, data]); // Optimistic update
  } catch (err) {
    console.error('Error sending message:', err);
    setError(err.message || 'Failed to send message');
    // Optional: Revert optimistic update in case of error
  } finally {
    setLoading(false);
  }
}, []);

  return {
    messages,
    loading,
    error,
    fetchMessages,
    sendMessage,
  };
};
