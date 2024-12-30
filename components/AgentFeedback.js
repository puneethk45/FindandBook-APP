import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
const AgentFeedbackScreen = () => {
  const handleEmailPress = async () => {
    const email = 'info@categorytech.com';
   

    if (email) {
        
        await Linking.openURL(`mailto:${email}`);
      } else {
        Alert.alert('Error', 'Email not available');
      }
    
  };
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
    <>
    <View style={styles.container}>
      <Text style={styles.title}>We'd Love Your Feedback!</Text>
      <Text style={styles.description}>
        Your feedback helps us improve and provide a better experience. Share your
        thoughts, suggestions, or report any issues you've encountered.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleEmailPress}>
        <Text style={styles.buttonText}>Send Feedback</Text>
      </TouchableOpacity>
     
    </View>
    <View style={styles.bottomNav}>
    <NavItem name="home-outline" label="AgentHome"  />
        <NavItem name="cash" label="My Listings" />
        <NavItem name="mail" label="Feedback" isActive/>
        <NavItem name="chatbubble" label="Messages" />
        <NavItem name="person" label="Profile" />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },bottomNav: {
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
  },
  navLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AgentFeedbackScreen;