import React, { useLayoutEffect, useEffect  } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { icons } from '../../constants';
import { useGroupStore } from '../../../store/groupStore';
import {useDetectedSoundStore} from '../../../store/detectedSoundStore';
import { useSocket } from '../../../store/useSocket';
import DetectionDisplay from '../../components/detectionDisplay';

const GroupSoundsDetected = () => {
    const { fetchUserSounds,sounds} = useDetectedSoundStore();
    const {socket} =useSocket()

    const route = useRoute();
    const {userId, username} = route.params

    const navigation = useNavigation();
    
    useEffect(() => {
        fetchUserSounds(userId);
     
        socket.on('new-sound', ({ userId: newSoundUserId }) => { 
        if (newSoundUserId === userId) {
        fetchUserSounds(userId);
        }
  });    }, [userId]);

    useLayoutEffect(() => {
        console.log(sounds)

        
            if (navigation) {
                navigation.setOptions({
                    headerTitle: () => (
                        <Text className="font-psemibold text-2xl text-white">{username}</Text>
                    ),
                    headerStyle: {
                        backgroundColor: '#1a1a3d',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    // headerRight: () => (
                    //     <View className="flex-row gap-2 justify-between">
                    //         <TouchableOpacity className="mr-4">
                    //             <Image
                    //                 source={icons.chat}
                    //                 className="w-6 h-6 tint-white"
                    //                 resizeMode="contain"
                    //             />
                    //         </TouchableOpacity>
    
                    //         <TouchableOpacity className="mr-4">
                    //             <Image
                    //                 source={icons.sound}
                    //                 className="w-6 h-6 tint-white"
                    //                 resizeMode="contain"
                    //             />
                    //         </TouchableOpacity>
    
                    //         <TouchableOpacity className="mr-4">
                    //             <Image
                    //                 source={icons.info}
                    //                 className="w-6 h-6 tint-white"
                    //                 resizeMode="contain"
                    //             />
                    //         </TouchableOpacity>
                    //     </View>
                    // ),
                });
            }
    }, [navigation]);
     const formatTime = (isoTime) => {
    try {
      const date = new Date(isoTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "N/A";
    }
  };

    return (
        <View className="flex-1 bg-primary p-4">
            <Text className="text-white text-xl font-psemibold mb-4">
                {username} 's Detected Sounds
            </Text>
            {/* <ScrollView className="h-3/4 w-full " >
     
                { predictions.slice().reverse().map((prediction, index) => (
                    <DetectionDisplay key={index} time={new Date(prediction.timestamp).toLocaleTimeString()} confidence={prediction.label} sound={ (prediction.confidence * 100).toFixed(2) + '%'}/>
                  
                ))}

            </ScrollView> */}
            <FlatList
                data={sounds}
                keyExtractor={(item, index) => `${userId}-${index}`}
                renderItem={({ item }) => (
                   

                
                <DetectionDisplay  time={formatTime(item.createdAt)} confidence={(item.confidence * 100).toFixed(2)+ '%'} sound={item.label} 
                 audioBase64={item.sound}
                />
                    
                )}
            />
        </View>
    );
};

export default GroupSoundsDetected;
