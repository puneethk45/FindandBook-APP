import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Animated
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const ChatRoom = ({ route, navigation }) => {
  const { agentId, userId } = route.params;
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [agentName, setAgentName] = useState('');
  const insets = useSafeAreaInsets();
  const fadeAnim = new Animated.Value(0);

  // Fetch agent details
  const fetchAgentDetails = useCallback(async () => {
    try {
      const agentDoc = await firestore()
        .collection('agents')
        .doc(agentId)
        .get();

      if (agentDoc.exists) {
        setAgentName(agentDoc.data().agency_name || 'Agent');
      }
    } catch (error) {
      console.error('Error fetching agent details:', error);
      setAgentName('Agent');
    }
  }, [agentId]);

  // Improved chat room initialization
  const initChat = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch agent details first
      await fetchAgentDetails();

      const chatQuery = await firestore()
        .collection('chats')
        .where('userId', '==', userId)
        .where('agentId', '==', agentId)
        .get();

      let chatRoomId;
      if (chatQuery.empty) {
        // Create new chat room
        const newChatRef = await firestore().collection('chats').add({
          userId,
          agentId,
          createdAt: firestore.FieldValue.serverTimestamp(),
          lastMessage: null,
          participants: [userId, agentId]
        });
        chatRoomId = newChatRef.id;
      } else {
        chatRoomId = chatQuery.docs[0].id;
      }

      setChatId(chatRoomId);

      // Subscribe to messages
      const unsubscribe = firestore()
        .collection('chats')
        .doc(chatRoomId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
          const fetchedMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
          }));
          
          setMessages(fetchedMessages);
          setLoading(false);

          // Animate new messages
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }).start();
        });

      return () => unsubscribe();
    } catch (error) {
      console.error('Chat initialization error:', error);
      setLoading(false);
    }
  }, [userId, agentId, fetchAgentDetails]);

  useEffect(() => {
    initChat();
  }, [initChat]);

  // Enhanced send message function
  const handleSend = async () => {
    if (!chatId || newMessage.trim() === '') return;

    try {
      // Add message to messages subcollection
      await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add({
          senderId: userId,
          text: newMessage.trim(),
          timestamp: firestore.FieldValue.serverTimestamp(),
          type: 'text'
        });

      // Update last message in chat room
      await firestore()
        .collection('chats')
        .doc(chatId)
        .update({
          lastMessage: {
            text: newMessage.trim(),
            senderId: userId,
            timestamp: firestore.FieldValue.serverTimestamp()
          }
        });

      setNewMessage('');
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  // Render individual message
  const renderMessage = ({ item }) => {
    const isUserMessage = item.senderId === userId;
    return (
      <View style={[
        styles.messageWrapper,
        isUserMessage ? styles.userMessageWrapper : styles.agentMessageWrapper
      ]}>
        <View 
          style={[
            styles.messageContainer,
            isUserMessage ? styles.userMessage : styles.agentMessage
          ]}
        >
          <Text style={[
            styles.messageText, 
            { color: isUserMessage ? '#fff' : '#000' }
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            { 
              color: isUserMessage ? '#f0f0f0' : '#888',
              alignSelf: isUserMessage ? 'flex-end' : 'flex-start'
            }
          ]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  // Render header with agent name
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
        <Icon name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{agentName}</Text>
        <Text style={styles.headerSubtitle}>Online</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      {renderHeader()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          placeholderTextColor="#888"
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={handleSend}
          disabled={!newMessage.trim()}
        >
          <Icon 
            name="send" 
            size={24} 
            color={newMessage.trim() ? '#fff' : '#ccc'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    paddingVertical: 15,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  headerContent: {
    marginLeft: 10
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  headerSubtitle: {
    color: '#e0e0e0',
    fontSize: 12
  },
  backButton: {
    marginRight: 10
  },
  messageList: {
    paddingHorizontal: 10,
    paddingBottom: 10
  },
  messageWrapper: {
    width: '100%',
    marginVertical: 5
  },
  userMessageWrapper: {
    alignItems: 'flex-end'
  },
  agentMessageWrapper: {
    alignItems: 'flex-start'
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  userMessage: {
    backgroundColor: '#4a90e2'
  },
  agentMessage: {
    backgroundColor: '#e5e5ea'
  },
  messageText: {
    fontSize: 16,
    marginBottom: 5
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 10
  },
  sendButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#888',
    fontSize: 16
  }
});

export default ChatRoom;