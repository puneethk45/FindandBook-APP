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
  BackHandler
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const AgentChatRoom = ({ route, navigation }) => {
  const { userId, agentId } = route.params;
  console.log(userId,agentId)
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const backAction = () => {
      try {
        console.log('Back button pressed');
        
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Messages');
        }
        return true;
      } catch (error) {
        console.error('Navigation error:', error);
        return false;
      }
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

  

    return () => backHandler.remove();
  }, [navigation]);
  // Fetch user details
  const fetchUserDetails = useCallback(async () => {
    try {
      const userDoc = await firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (userDoc.exists) {
        setUserName(userDoc.data().fullName || 'User');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setUserName('User');
    }
  }, [userId]);

  // Improved chat room initialization
  const initChat = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch user details first
      await fetchUserDetails();

      const chatQuery = await firestore()
        .collection('chats')
        .where('userId', '==', userId)
        .where('agentId', '==', agentId)
        .get();

      let chatRoomId;
      if (chatQuery.empty) {
        // This case should not happen, as user would have initiated chat first
        console.warn('No existing chat found');
        return;
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
        });

      return () => unsubscribe();
    } catch (error) {
      console.error('Chat initialization error:', error);
      setLoading(false);
    }
  }, [userId, agentId, fetchUserDetails]);

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
          senderId: agentId,
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
            senderId: agentId,
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
    const isAgentMessage = item.senderId === agentId;
    return (
      <View style={[
        styles.messageWrapper,
        isAgentMessage ? styles.agentMessageWrapper : styles.userMessageWrapper
      ]}>
        <View 
          style={[
            styles.messageContainer,
            isAgentMessage ? styles.agentMessage : styles.userMessage
          ]}
        >
          <Text style={[
            styles.messageText, 
            { color: isAgentMessage ? '#fff' : '#000' }
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            { 
              color: isAgentMessage ? '#f0f0f0' : '#888',
              alignSelf: isAgentMessage ? 'flex-end' : 'flex-start'
            }
          ]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  // Render header with user name
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
        <Icon name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{userName}</Text>
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
    backgroundColor: '#f0f2f5',
    marginTop:22
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
    alignItems: 'flex-start'
  },
  agentMessageWrapper: {
    alignItems: 'flex-end'
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
    backgroundColor: '#e5e5ea'
  },
  agentMessage: {
    backgroundColor: '#4a90e2'
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

export default AgentChatRoom;