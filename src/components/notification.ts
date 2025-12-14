import notifee, { EventType } from '@notifee/react-native';
import { navigate } from './navigationRef';
 import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../store/api';
import { Alert } from 'react-native';

import { useGroupStore } from '../../store/groupStore';

  const sendGroupMessage = async (messageContent: string,token:any) => {
    // 1. Get groups from state
    // We use getState() to ensure we have the absolute latest value, not a stale render value
    let currentGroups = useGroupStore.getState().groups;
    let getGroups = useGroupStore.getState().getGroups;

    // 2. ROBUST CHECK: If state is empty, try to fetch fresh from API immediately
    if (!currentGroups || currentGroups.length === 0) {
      console.log("⚠️ Groups list is empty. Attempting to fetch fresh groups...");
      try {
        // We assume getGroups returns { groups: [...] } based on your useEffect code
        const result = await getGroups(); 
        
        if (result && result.groups && result.groups.length > 0) {
           console.log("✅ Freshly fetched groups:", result.groups.length);
           currentGroups = result.groups;
        } else {
           // If it's STILL empty after fetching, then the user really isn't in a group
           console.warn("❌ Fetch returned no groups.");
           Alert.alert("Notice", "You are not part of any groups, so no one was notified.");
           return;
        }
      } catch (error) {
         console.error("Failed to fetch groups on demand:", error);
         return;
      }
    }

    // 3. Proceed to send
    try {
      console.log(`🚀 Broadcasting message to ${currentGroups.length} groups...`);

      const sendPromises = currentGroups.map(async (group) => {
        const messageData = {
          groupId: group._id,
          messageType: 'text',
          message: messageContent,
          imageUrl: null,
        };

        const response = await fetch(`${BASE_URL}/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(messageData),
        });

        if (!response.ok) throw new Error('Failed to send');
        return response.json();
      });

      await Promise.all(sendPromises);
      console.log("✅ Alert successfully sent to all groups.");

    } catch (err) {
      console.error('Error broadcasting message:', err);
    }
  };

const handleUserSafe = (currentCriticalSound:any,token:any) => {
// User clicked "I AM SAFE"
    const message = `✅ I AM SAFE. The detected ${currentCriticalSound} has been acknowledged.`;
    sendGroupMessage(message,token);

    // Close modal

    };

const handleUserHelp = (currentCriticalSound:any,token:any) => {
// User clicked "HELP ME"
    const message = `🆘 HELP NEEDED! Confirmed critical sound: ${currentCriticalSound}. Please assist!`;
    sendGroupMessage(message,token);
};

export function registerNotificationListeners() {
  notifee.onForegroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS) {
      const actionId = detail.pressAction?.id;
      const data = detail.notification?.data;

     if (actionId === 'inquire_okay') {
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
            groupId: data?.groupId,
            messageType: 'text',
            message: 'Are you okay?',
            imageUrl: null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Send message failed in background:', errorData);
          return;
        }

        console.log('Auto "Are you okay?" message sent successfully');
      } catch (err) {
        console.error('Failed to send auto message in background:', err);
      }

  // First, navigate to the Tabs stack and open the "Group" tab
  navigate('Tabs', {
    screen: 'Group', // This is the tab you want
  });

  // Then, push ChatScreen onto the stack
  // Use a small delay to ensure the tab has mounted
  setTimeout(() => {
    navigate('ChatScreen', {
      groupId: data?.groupId,
      groupName: data?.groupName,
      currentUserId: data?.userId,
    });
  }, 200); // 100ms delay usually works
}else if (actionId === 'help_me') {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found');

       handleUserHelp(data?.currentCriticalSound,token);


        console.log('Auto "Are you okay?" message sent successfully');
      } catch (err) {
        console.error('Failed to send auto message in background:', err);
      }


}else if (actionId === 'i_am_safe') {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found');

       handleUserSafe(data?.currentCriticalSound,token);


        console.log('Auto "Are you okay?" message sent successfully');
      } catch (err) {
        console.error('Failed to send auto message in background:', err);
      }


}

    }
  });
}
