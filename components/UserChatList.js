import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  TouchableWithoutFeedback, 
  BackHandler,ActivityIndicator
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
const UserChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();
  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Home'); // Navigate to Home screen when back button is pressed
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove(); // Cleanup on component unmount
  }, [navigation]);
  // Fetch chats for the user
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
  const fetchUserChats = useCallback(async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userid');
      setUserId(storedUserId);
      setLoading(true);

      const chatsQuery = await firestore()
        .collection('chats')
        .where('userId', '==', storedUserId)
        .orderBy('lastMessage.timestamp', 'desc')
        .get();

      const chatList = await Promise.all(
        chatsQuery.docs.map(async (chatDoc) => {
          const chatData = chatDoc.data();
          
          // Fetch agent details
          const agentDoc = await firestore()
            .collection('agents')
            .doc(chatData.agentId)
            .get();
          
          return {
            id: chatDoc.id,
            ...chatData,
            agent: agentDoc.exists ? agentDoc.data() : null
          };
        })
      );

      setChats(chatList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user chats:', error);
      setLoading(false);
    }
  }, []);

  // Fetch chats on component mount
  useEffect(() => {
    fetchUserChats();
  }, [fetchUserChats]);

  // Format timestamp for last message
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If within last 7 days, show day
    const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (dayDiff < 7) {
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    }
    
    // Otherwise, show date
    return date.toLocaleDateString();
  };

  // Render individual chat item
  const renderChatItem = ({ item }) => {
    const lastMessage = item.lastMessage;
    const agent = item.agent || {};

    return (
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => navigation.navigate('ChatRoom', { 
          userId: item.userId, 
          agentId: item.agentId,
          agentName: agent.agency_name 
        })}
      >
        {/* Agent Avatar */}
        <View style={styles.avatarContainer}>
          {agent.profilePicture ? (
            <Image 
              source={{ uri: agent.profilePicture }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(agent.full_name || 'A').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Chat Details */}
        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {agent.full_name || 'Unknown Agent'}
            </Text>
            {lastMessage?.timestamp && (
              <Text style={styles.timestamp}>
                {formatTimestamp(lastMessage.timestamp)}
              </Text>
            )}
          </View>

          {/* Last Message Preview */}
          {lastMessage?.text && (
            <Text 
              style={styles.lastMessage} 
              numberOfLines={1}
            >
              {lastMessage.text}
            </Text>
          )}
        </View>

        {/* Chevron */}
        <View style={styles.chevronContainer}>
          <Icon name="chevron-forward" size={24} color="#888" />
        </View>
      </TouchableOpacity>
    );
  };

  // Render content based on loading and chat availability
  const renderContent = () => {
    if (loading) {
      return (
        <LinearGradient colors={['#c81d77', '#6710c2']} style={styles.centeredContainer}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#c81d77" />
            <Text style={styles.loadingText}>Loading Chats</Text>
          </View>
        </LinearGradient>
      );
     }
  

    if (chats.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active chats</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableWithoutFeedback onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableWithoutFeedback>
        <Text style={styles.headerTitle}>My Chats</Text>
      </View>
      {renderContent()}
      <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="Home"  />
        <NavItem name="calendar" label="My Meetings" />
        <NavItem name="mail" label="Feedback" />
        <NavItem name="chatbubble" label="Chats" isActive />
        <NavItem name="person" label="My Profile" />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingTop:15
  }, centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    backgroundColor: 'white', 
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navItem: {
    alignItems: 'center',
  },
  navIconWrapper: {
    alignItems: 'center',
    marginBottom: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A6073',
    elevation: 4,  // Android - higher elevation for z-index effect
    shadowColor: '#000',  // iOS - subtle shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  navLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  header: {
    backgroundColor: '#4a90e2',
    paddingVertical: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection:'row'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600'
  },
  chatList: {
    paddingHorizontal: 10
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    width: "100%",
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
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  avatarContainer: {
    marginRight: 15
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  chatDetails: {
    flex: 1,
    justifyContent: 'center'
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    maxWidth: '70%'
  },
  timestamp: {
    fontSize: 12,
    color: '#888'
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  chevronContainer: {
    marginLeft: 10
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    fontSize: 16,
    color: '#888'
  }
});

export default UserChatList;