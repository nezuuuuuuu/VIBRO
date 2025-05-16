// Merged and optimized Home.tsx
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  DeviceEventEmitter,
  TouchableOpacity,
  ScrollView,
  Image,
  PermissionsAndroid,
  Platform,
  NativeModules,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../store/authStore';
import { useGroupStore } from '../../../store/groupStore';
import { useDetectedSoundStore } from '../../../store/detectedSoundStore';
import { useSocket } from '../../../store/useSocket';
import DetectionDisplay from '../../components/detectionDisplay';
import notifee from '@notifee/react-native';
import RNFS from 'react-native-fs';
import '../../../global.css';
import { icons } from '../../constants';
import { Buffer } from 'buffer';
import Sound from 'react-native-sound';
import { AndroidImportance } from '@notifee/react-native';
import Torch from 'react-native-torch';

const { AudioRecorder, Flashlight } = NativeModules;

const ALLOWED_LABELS = ['siren', 'Ambulance (siren)', 'Police car (siren)', 'Glass', 'Siren', 'Speech'];
const NOTIF_LEVEL_1_ALLOWED_LABELS = ['Speech'];
const NOTIF_LEVEL_2_ALLOWED_LABELS = ['siren', 'Ambulance (siren)', 'Police car (siren)'];
const NOTIF_LEVEL_3_ALLOWED_LABELS = ['Glass',];

export async function requestMicPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'App needs access to your microphone to record audio.',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

function Home() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { getGroups } = useGroupStore();
  const { addSound } = useDetectedSoundStore();
  const { connect } = useSocket();

  const [isRecording, setIsRecording] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);

  const predictionQueue: { label: string; confidence: number; audioBase64?: string }[] = [];
  let isProcessing = false;

  const processQueue = async () => {
    isProcessing = true;
    while (predictionQueue.length > 0) {
      const prediction = predictionQueue.shift();
      if (prediction) await handlePrediction(prediction);
    }
    isProcessing = false;
  };

  const playBase64Audio = async (base64Audio: string) => {
    try {
      const audioBuffer = Buffer.from(base64Audio, 'base64');
      const filePath = `${RNFS.TemporaryDirectoryPath}/audio.wav`;
      await RNFS.writeFile(filePath, audioBuffer.toString('base64'), 'base64');
      const sound = new Sound(filePath, '', (error) => {
        if (error) return console.error('Failed to load sound:', error);
        sound.play((success) => {
          if (!success) console.error('Playback failed');
          sound.release();
        });
      });
    } catch (err) {
      console.error('Audio play error:', err);
    }
  };

  useLayoutEffect(() => {
    if (user) {
      navigation.setOptions({
        headerTitle: () => <Text className="font-pbold text-2xl text-white">VIBRO</Text>,
        headerRight: () => (
          <View className="flex-row items-center gap-2 mr-4">
            <Image
              style={{ width: 20, height: 20, borderRadius: 50 }}
              source={{ uri: `https://api.dicebear.com/7.x/bottts/png?seed=${user?.username || 'guest'}` }}
              resizeMode="cover"
            />
            <Text className="text-white font-psemibold">{user.username}</Text>
          </View>
        ),
        headerStyle: { backgroundColor: '#1B1B3A' },
      });
    }
  }, [navigation, user]);

  const copyModelToInternalStorage = async () => {
    try {
      const assetPath = 'VIBRO.tflite';
      const destinationPath = `${RNFS.DocumentDirectoryPath}/VIBRO.tflite`;
      await RNFS.copyFileAssets(assetPath, destinationPath);
      console.log('Model copied successfully.');
      return destinationPath;
    } catch (error) {
      console.error('Model copy failed:', error);
    }
  };

  useEffect(() => {
    copyModelToInternalStorage();
    const setupSocket = async () => {
      try {
        const result = await getGroups();
        if (result?.groups) {
          const groupIds = result.groups.map((group: { _id: string }) => group._id);
          connect(user._id, groupIds);
        }
      } catch (err) {
        console.error('Socket connection error:', err);
      }
    };
    setupSocket();

    DeviceEventEmitter.addListener('onPrediction', (data) => {
      const { customPredictions = [], yamnetPredictions = [], audioBase64 } = data;
      [...customPredictions, ...yamnetPredictions].forEach(({ label, confidence }) => {
        predictionQueue.push({ label, confidence, audioBase64 });
        if (!isProcessing) processQueue();
      });
    });
  }, []);

  const handlePrediction = async ({ label, confidence, audioBase64 }: { label: string; confidence: number; audioBase64?: string }) => {
    if (confidence >= 0.8 && ALLOWED_LABELS.includes(label)) {
      const timestamp = Date.now();
      setPredictions((prev) => [...prev, { label, confidence, timestamp, audioBase64 }]);
      addSound(label, confidence, audioBase64);

      if (NOTIF_LEVEL_1_ALLOWED_LABELS.includes(label)) {
        await notifee.displayNotification({
          title: `Detected: ${label}`,
          body: `Confidence: ${(confidence * 100).toFixed(2)}%`,
          android: {
            channelId: 'sound-alerts1',
            importance: AndroidImportance.MIN,
          },
        });
      }

      if (NOTIF_LEVEL_2_ALLOWED_LABELS.includes(label)) {
        await notifee.displayNotification({
          title: `Detected: ${label}`,
          body: `Confidence: ${(confidence * 100).toFixed(2)}% - STAY ALERT`,
          android: {
            channelId: 'sound-alerts2',
            importance: AndroidImportance.DEFAULT,
          },
        });
        await blinkFlashlight(3, 300);
      }

      if (NOTIF_LEVEL_3_ALLOWED_LABELS.includes(label)) {
        await notifee.displayNotification({
          title: `Detected: ${label}`,
          body: `Confidence: ${(confidence * 100).toFixed(2)}% - STAY ALERT`,
          android: {
            channelId: 'sound-alerts3',
            importance: AndroidImportance.HIGH,
          },
        });
        await blinkFlashlight(5, 200);
      }

      // if (label.toLowerCase().includes('siren')) await flashLight();
      
    }
  };

  // Flashlight Di mugana
  const blinkFlashlight = async (times = 5, interval = 200) => {
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
          title: 'Camera Permission',
          message: 'App needs access to the camera to flash the light.',
          buttonPositive: 'OK',
        });
    
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Camera permission denied.');
          return;
        }
      }
    
      for (let i = 0; i < times; i++) {
        Torch.switchState(true);  // ON
        await new Promise(res => setTimeout(res, interval));
        Torch.switchState(false); // OFF
        await new Promise(res => setTimeout(res, interval));
      }
    };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      await AudioRecorder.stopRecording();
    } else {
      setIsRecording(true);
      await AudioRecorder.startRecording();
    }
  };

  return (
    <View className="bg-primary h-full">
      <View className="items-center justify-center">
        <Text className="text-white text-lg">Sound Detected</Text>
        <ScrollView className="h-3/4 w-full">
          {predictions.slice().reverse().map((pred, idx) => (
            <DetectionDisplay
              key={idx}
              time={new Date(pred.timestamp).toLocaleTimeString()}
              confidence={(pred.confidence * 100).toFixed(2) + '%'}
              sound={pred.label}
              audioBase64={pred.audioBase64}
            />
          ))}
        </ScrollView>
      </View>
      <View className="justify-center items-center mt-4">
        <View className="bg-secondary rounded-full items-center justify-center" style={{ width: 60, height: 60 }}>
          <TouchableOpacity onPress={toggleRecording}>
            <Image source={isRecording ? icons.recording : icons.microphone} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default Home;