import notifee, { EventType } from '@notifee/react-native';
import { navigate } from './navigationRef';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../store/api';
notifee.onBackgroundEvent(async ({ type, detail }) => {
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
    // First, navigate to the Tabs stack and open the "Group" tab
  navigate('Tabs', {
    screen: 'Group', // This is the tab you want
  });

  // Then, push ChatScreen onto the stack
  // Use a small delay to ensure the tab has mounted
 setTimeout(async () => {
  const token = await AsyncStorage.getItem('token');

  navigate('ChatScreen', {
    groupId: data?.groupId,
    groupName: data?.groupName,
    currentUserId: data?.currentUserId,
   
  });
}, 1000);

}else if (actionId === 'help_me') {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found');

       

        console.log('Auto "Are you okay?" message sent successfully');
      } catch (err) {
        console.error('Failed to send auto message in background:', err);
      }


}

  }
});
