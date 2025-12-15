import React, { useLayoutEffect, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    NativeScrollEvent,
    NativeSyntheticEvent
} from 'react-native';
import "../../../global.css"
import { useSocket } from '../../../store/useSocket'; 
import BASE_URL from '../../../store/api';
import { useAuthStore } from "../../../store/authStore";
import { icons } from '../../constants';

const API_BASE_URL = BASE_URL; 

interface User {
    _id: string;
    username: string;
    profilePicture?: string;
}

interface MessagePayload {
    _id: string;
    senderId: User;
    groupId: string;
    messageType: 'text' | 'image';
    messageText?: string | null;
    imageUrl?: string | null;
    createdAt: string;
}

interface ChatScreenProps {
    route: {
        params: {
            groupId: string;
            groupName?: string;
            currentUserId: string;
            token: string;
        };
    };
    navigation: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
    const { groupId, groupName } = route.params;
    const { user } = useAuthStore();
    const currentUserId = user?._id;
    const { token } = useAuthStore();

    const [messages, setMessages] = useState<MessagePayload[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showScrollBottomButton, setShowScrollBottomButton] = useState(false);

    const flatListRef = useRef<FlatList<MessagePayload>>(null);
    const { socket } = useSocket();

    // --- CRITICAL: Reverse messages for Inverted List ---
    // We reverse the array so the Latest message is at Index 0 (Visual Bottom)
    const reversedMessages = useMemo(() => {
        return [...messages].reverse();
    }, [messages]);

    useLayoutEffect(() => {
        if (navigation) {
          navigation.setOptions({
            headerTitle: () => (
                <Text className="font-psemibold text-2xl text-white">{ groupName }</Text>
            ),
            headerStyle: { backgroundColor: '#1a1a3d' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          });
        }
    }, [navigation, groupName]);

    // --- NEW: Scroll to Bottom is now "Scroll to Offset 0" ---
    const scrollToBottom = () => {
        // animated: true gives a smooth slide to the latest message
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        setShowScrollBottomButton(false);
    };

    useEffect(() => {
        if (socket) {
            const handleNewMessage = (newMessage: MessagePayload) => {
                if (newMessage.groupId === groupId) {
                    setMessages(prevMessages => {
                        if (prevMessages.find(msg => msg._id === newMessage._id)) return prevMessages;
                        return [...prevMessages, newMessage];
                    });
                    
                    // In an inverted list, adding a new item to the "end" of the state (which is the "start" of the list)
                    // usually handles itself well. If the user is at offset 0, they see it immediately.
                }
            };
            socket.on('newMessage', handleNewMessage);
            return () => {
                socket.off('newMessage', handleNewMessage);
            };
        }
    }, [socket, groupId]);

    const fetchMessages = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/messages/${groupId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const fetchedMessages: MessagePayload[] = await response.json();
            setMessages(fetchedMessages);
        } catch (error) {
            console.error('Fetch messages error:', error);
            Alert.alert('Error', 'Could not load messages.');
        } finally {
            setIsLoading(false);
        }
    }, [groupId, token]);

    useEffect(() => {
        setMessages([]);
        setIsLoading(true);
        fetchMessages();
        return () => {
             setMessages([]);
             setIsLoading(false);
        }
    }, [groupId, fetchMessages]);

    const handleSend = async (type: 'text' | 'image', content?: string | null, imageUrl?: string | null) => {
        if (isSending) return;
        const messageContent = type === 'text' ? content?.trim() : content;
        if (type === 'text' && (!messageContent || messageContent === '')) return;
        if (type === 'image' && !imageUrl) return;

        setIsSending(true);

        const messageData = {
            groupId,
            messageType: type,
            message: type === 'text' ? messageContent : null, 
            imageUrl: type === 'image' ? imageUrl : null,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/messages/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(messageData),
            });

            if (!response.ok) throw new Error("Failed");

            const sentMessage: MessagePayload = await response.json(); 
            
            setMessages(prevMessages => {
                 if (prevMessages.find(msg => msg._id === sentMessage._id)) return prevMessages;
                 return [...prevMessages, sentMessage];
             });
             
             // If we send a message, snap to bottom (offset 0)
             setShowScrollBottomButton(false);
             flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

            if (type === 'text') setInputText(''); 

        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not send message.');
        } finally {
            setIsSending(false);
        }
    };

    const renderMessage = ({ item }: { item: MessagePayload }) => {
        let isMyMessage;
        if(!item.senderId){
            item.senderId={username: "Deleted User", _id: "deleted"};
        } else {
            isMyMessage = item.senderId._id === currentUserId;
        }
        return (
            <View
                className={`max-w-[75%] p-2.5 rounded-[15px] my-1.5 ${
                    isMyMessage ? 'bg-secondary self-end rounded-br-md' : 'bg-gray-200 self-start rounded-bl-md'
                }`}
            >
                {!isMyMessage && (
                    <Text className="text-xs text-gray-600 mb-0.5 font-semibold">
                        {item.senderId.username}
                    </Text>
                )}
                {item.messageType === 'text' && item.messageText && (
                    <Text className={isMyMessage ? 'text-base text-white' : 'text-base text-black'}>
                        {item.messageText}
                    </Text>
                )}
                {item.messageType === 'image' && item.imageUrl && (
                    <Image
                        source={{ uri: item.imageUrl }}
                        className="w-[200px] h-[200px] rounded-lg mt-1"
                        resizeMode="contain"
                    />
                )}
                <Text className="text-[10px] text-gray-400 self-end mt-1">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
            >
                <View className="flex-1 relative">
                    <FlatList
                        ref={flatListRef}
                        // --- INVERTED MODE ---
                        inverted 
                        data={reversedMessages} // We use the reversed array
                        renderItem={renderMessage}
                        keyExtractor={(item) => item._id}
                        
                        className="flex-1 px-2.5 bg-gray-100"
                        contentContainerStyle={{ paddingVertical: 10 }}
                        
                        // --- SIMPLIFIED SCROLL LOGIC ---
                        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                            const offsetY = event.nativeEvent.contentOffset.y;
                            // In inverted mode, Y=0 is the bottom.
                            // If Y > 30, user has scrolled "up" to see history.
                            if (offsetY > 30) {
                                setShowScrollBottomButton(true);
                            } else {
                                setShowScrollBottomButton(false);
                            }
                        }}
                        scrollEventThrottle={16} 
                    />

                    {/* Scroll Down Button */}
                    {showScrollBottomButton && (
                        <TouchableOpacity
                            onPress={scrollToBottom}
                            className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg border border-gray-200 z-50 items-center justify-center h-12 w-12"
                            style={{
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                        >
                            <Image 
                                source={icons.downarrow} 
                                className="w-6 h-6"
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Input Area */}
                <View className="flex-row items-center py-2 px-2.5 border-t border-gray-300 bg-white">
                    <TextInput
                        className={`flex-1 min-h-[40px] max-h-[120px] bg-gray-100 rounded-2xl px-4 text-base mr-2.5 text-black ${Platform.OS === 'ios' ? 'py-2.5' : 'py-1.5'}`}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor="#8e8e93"
                        multiline
                        editable={!isSending}
                    />
                    <TouchableOpacity
                        className={`rounded-2xl py-2.5 px-4 justify-center items-center ${
                            isSending || inputText.trim() === '' ? 'bg-lightsecondary' : 'bg-secondary'
                        }`}
                        onPress={() => handleSend('text', inputText)}
                        disabled={isSending || inputText.trim() === ''}
                    >
                        {isSending ? (
                             <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text className="text-white text-base font-semibold">Send</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatScreen;