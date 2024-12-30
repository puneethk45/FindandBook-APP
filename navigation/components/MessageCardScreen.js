import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList,TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore'; // Import Firestore
import { useNavigation } from '@react-navigation/native';

const MessageCardScreen = () => {
  const [messages, setMessages] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch messages from Firestore based on agentId from AsyncStorage
  const fetchMessages = async () => {
    try {
      const agentId = await AsyncStorage.getItem('agentid'); // Retrieve agentId from AsyncStorage

      if (agentId) {
        // Query the 'messages' collection where agentId matches
        const messagesSnapshot = await firestore()
          .collection('messages')
          .where('agentId', '==', agentId) // Filter messages by agentId
          .get();

        const messagesData = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(messagesData)
        setMessages(messagesData); // Set fetched messages to state
      } else {
        console.log('No agentId found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error fetching messages from Firestore: ', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
  }, []);

  // Render each message card
  const renderMessageCard = ({ item }) => {
    // Convert Firestore timestamp to a readable date string
    const formatTimestamp = (timestamp) => {
      // Check if timestamp is a Firestore Timestamp object
      if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp) {
        // Create a JavaScript Date from the seconds and nanoseconds
        const date = new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
        return date.toLocaleString(); // or use a more specific date formatting
      }
      return timestamp; // fallback to original value if not a Firestore timestamp
    };
  
    return (
      <View style={styles.card}>
        <Text style={styles.senderName}>{item.fullName}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      </View>
    );
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }
  const NavItem = ({ name, label, isActive = false }) => {
    const navigation = useNavigation();
  
    return (
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate(label)}
      >
        <View style={styles.navIconWrapper}>
          <Ionicons 
            name={name} 
            size={24} 
            color={isActive ? '#3A6073' : '#8E8E93'} 
          />
          {isActive && <View style={styles.activeIndicator} />}
        </View>
        <Text 
          style={[
            styles.navLabel, 
            isActive && { color: '#3A6073', fontWeight: '600' }
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessageCard}
        keyExtractor={(item) => item.id}
      />
       <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="AgentHome"  />
        <NavItem name="stats-chart-outline" label="Listings" />
        <NavItem name="people-outline" label="Table"  />
     
        <NavItem name="mail" label="Messages"  isActive/>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  senderName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    width:"100%",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    
  },
  navItem: { 
    alignItems: 'center' 
  },
  navIconWrapper: {
    position: 'relative',
  },
  navLabel: { 
    fontSize: 12, 
    color: '#8E8E93', 
    marginTop: 4 
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A6073',
  }
});

export default MessageCardScreen;
