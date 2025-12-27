/**
 * @format
 */
import './src/components/notificationBackground';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';


messaging().setBackgroundMessageHandler(async remoteMessage => {
   const data = remoteMessage.data;

  // ✅ Guard clauses (VERY IMPORTANT)
  if (!data) return;
  if (data.type !== 'SOUND') return;

  const title =
    data.title || `🚨 Sound Detected`;
  const body =
    data.body || `A sound was detected in your group`;

  await notifee.displayNotification({
    title,
    body,
    data: remoteMessage.data,

    android: {
    channelId: 'sound-alerts3',
    actions: [
      {
        title: 'Are you okay?',
        pressAction: { id: 'inquire_okay' },
      },
    ],
  },
  });

});


AppRegistry.registerComponent(appName, () => App);
