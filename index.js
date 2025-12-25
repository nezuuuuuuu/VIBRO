/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import './src/components/notificationBackground';
import messaging from '@react-native-firebase/messaging';


// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   console.log('📩 Background FCM:', remoteMessage);
// });
// // Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  await notifee.displayNotification({
            title: `From: ${username} (${groupName})`,
            body: `Detected:asdasd`,
          
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
