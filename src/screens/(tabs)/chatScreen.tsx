// ChatScreen.tsx
import React, { useLayoutEffect, useState, useEffect, useCallback, useRef } from 'react';
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
} from 'react-native';
import "../../../global.css"
import { useSocket } from '../../../store/useSocket'; // Adjust the import path as needed

import BASE_URL from '../../../store/api';


const API_BASE_URL = BASE_URL; // Replace with your API base URL

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
    const { groupId, groupName, currentUserId, token } = route.params;

    const [messages, setMessages] = useState<MessagePayload[]>([]);
    const [inputText, setInputText] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const flatListRef = useRef<FlatList<MessagePayload>>(null);
    const shouldScrollToBottomRef = useRef(true);

    const { socket } = useSocket();
     useLayoutEffect(() => {
        if (navigation) {
          navigation.setOptions({
            headerTitle: () => ((
                <Text className="font-psemibold text-2xl text-white">{ groupName }</Text>
              )
            ),
            headerStyle: {
              backgroundColor: '#1a1a3d',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          });
        }
      }, [navigation]);
    useEffect(() => {
        if (groupName) {
            navigation.setOptions({ title: groupName });
        }
    }, [groupName, navigation]);

    useEffect(() => {
        if (socket) {
            console.log('ChatScreen using global socket:', socket.id);

            const onSocketConnect = () => {
                 console.log('ChatScreen: Global socket re-connected, joining group', groupId);
                 socket.emit('joinGroup', groupId);
            };

            if (socket.connected) {
                 socket.emit('joinGroup', groupId);
                 console.log(`ChatScreen emitted joinGroup ${groupId} with socket ${socket.id} (initially connected)`);
            }

            socket.on('connect', onSocketConnect);

            const handleNewMessage = (newMessage: MessagePayload) => {
                console.log('ChatScreen received newMessage for its group:', newMessage);
                if (newMessage.groupId === groupId) {
                    setMessages(prevMessages => {
                        if (prevMessages.find(msg => msg._id === newMessage._id)) {
                            return prevMessages;
                        }
                        return [...prevMessages, newMessage];
                    });
                    shouldScrollToBottomRef.current = true;
                }
            };

            socket.on('newMessage', handleNewMessage);

            return () => {
                console.log(`ChatScreen cleanup for group ${groupId} with socket ${socket.id}`);
                socket.off('connect', onSocketConnect);

                if (socket.connected) {
                     socket.emit('leaveGroup', groupId);
                     console.log(`ChatScreen emitted leaveGroup ${groupId} with socket ${socket.id}`);
                } else {
                      console.log(`ChatScreen socket not connected, skipping leaveGroup emit`);
                }

                socket.off('newMessage', handleNewMessage);
                console.log('ChatScreen newMessage listener removed');
            };
        }

    }, [socket, groupId]);

    const fetchMessages = useCallback(async () => {
        setIsLoading(true);

        try {
            console.log('Frontend Fetch - Initial messages for Group ID:', groupId);

            const response = await fetch(`${API_BASE_URL}/messages/${groupId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Fetch messages API error:', errorData);
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const fetchedMessages: MessagePayload[] = await response.json();
             console.log(`Frontend Fetch - Initial messages loaded: ${fetchedMessages.length}`);

            setMessages(fetchedMessages);
             shouldScrollToBottomRef.current = true;

        } catch (error) {
            console.error('Fetch messages error:', error);
            Alert.alert('Error', (error as Error).message || 'Could not load messages.');
        } finally {
            setIsLoading(false);
        }
    }, [groupId, token]);

    useEffect(() => {
        console.log('ChatScreen mounted or groupId changed, triggering initial fetch.');
        setMessages([]);
        setIsLoading(true);

        fetchMessages();

        return () => {
             console.log('ChatScreen cleanup initial fetch state');
             setMessages([]);
             setIsLoading(false);
             shouldScrollToBottomRef.current = true;
        }

    }, [groupId, fetchMessages]);

    useEffect(() => {
        if (messages.length > 0 && shouldScrollToBottomRef.current) {
            console.log('Scrolling to bottom...');
            setTimeout(() => {
                if (flatListRef.current?.getScrollResponder()) {
                    flatListRef.current?.scrollToEnd({ animated: true });
                    shouldScrollToBottomRef.current = false;
                } else {
                     console.log('FlatList or ScrollResponder not available for scrolling.');
                }
            }, 100);
        }
    }, [messages.length]);

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

            console.log('Message sent via API, waiting for socket echo.');

            if (type === 'text') {
                setInputText('');
            }
            shouldScrollToBottomRef.current = true;

        } catch (err) {
            console.error('Error sending message:', err);
            Alert.alert('Error', (err as Error).message || 'Could not send message.');
        } finally {
            setIsSending(false);
        }
    };

    const renderMessage = ({ item }: { item: MessagePayload }) => {
        const isMyMessage = item.senderId._id === currentUserId;
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
                <Text className="mt-2 text-gray-600">Loading messages...</Text>
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
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item._id}
                    className="flex-1 px-2.5 bg-gray-100"
                    contentContainerStyle={{ paddingVertical: 10 }}
                    ListEmptyComponent={
                        <Text className="text-center mt-12 text-gray-500 text-base">
                            No messages yet. Start the conversation!
                        </Text>
                    }
                />
                <View className="flex-row items-center py-2 px-2.5 border-t border-gray-300 bg-white">
                    <TextInput
                        className={`flex-1 min-h-[40px] max-h-[120px] bg-gray-100 rounded-2xl px-4 text-base mr-2.5 ${Platform.OS === 'ios' ? 'py-2.5' : 'py-1.5'}`}
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