import firestore from '@react-native-firebase/firestore';

// Get or create chat room
export const getChatRoom = async (userId, agentId) => {
  try {
    const chatQuery = await firestore()
      .collection('chats')
      .where('userId', '==', userId)
      .where('agentId', '==', agentId)
      .get();

    if (!chatQuery.empty) {
      // Return existing chat room
      return chatQuery.docs[0].id;
    } else {
      // Create new chat room with messages as a subcollection
      const newChatRef = await firestore().collection('chats').add({
        userId,
        agentId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastMessage: null,
        participants: [userId, agentId]
      });

      return newChatRef.id;
    }
  } catch (error) {
    console.error('Error getting/creating chat room:', error);
    throw error;
  }
};

// Send a message
export const sendMessage = async (chatId, senderId, text) => {
  try {
    // Add message to messages subcollection
    await firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add({
        senderId,
        text,
        timestamp: firestore.FieldValue.serverTimestamp()
      });

    // Update last message in chat room
    await firestore()
      .collection('chats')
      .doc(chatId)
      .update({
        lastMessage: {
          text,
          senderId,
          timestamp: firestore.FieldValue.serverTimestamp()
        }
      });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Subscribe to messages
export const subscribeToMessages = (chatId, callback) => {
  try {
    return firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot(snapshot => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(messages);
      }, error => {
        console.error('Message subscription error:', error);
      });
  } catch (error) {
    console.error('Error setting up message subscription:', error);
    throw error;
  }
};