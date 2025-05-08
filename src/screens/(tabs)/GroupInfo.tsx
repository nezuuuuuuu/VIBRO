import React, { useLayoutEffect } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { icons } from '../../constants';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useGroupStore } from '../../../store/groupStore';

const GroupInfo = () => {
    const {setGroupNavigation, groupPointer,getMembers,groupMembersPointer } = useGroupStore();
    
    const navigation = useNavigation();
        
        
    useLayoutEffect(() => {
            if (navigation) {
                navigation.setOptions({
                    headerTitle: () => (
                        <Text className="font-psemibold text-2xl text-white">{groupPointer.groupName}</Text>
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

    return (
        <View className='bg-primary p-4 flex-1'>
            <ScrollView className='w-full rounded-lg'>
                {/* <Text className='text-white font-bold text-2xl text-center my-5'>{groupName}</Text> */}
                        
            </ScrollView>
        </View>
    )
}

export default GroupInfo;