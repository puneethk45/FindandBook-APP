import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

const ContactPropertyScreen = ({ route }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [agent, setAgent] = useState(null);
  const { agentId } = route.params;  // Assuming agentId is passed from previous screen

  useEffect(() => {
    // Retrieve user info from AsyncStorage and Firestore
    const fetchUserInfo = async () => {
      try {
        const userId = await AsyncStorage.getItem('userid');
        if (userId) {
          // Fetch user details from Firestore using userId
          const userDoc = await firestore().collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setEmail(userData.email);
            setFullName(userData.fullName);  // Fetch the full name
            setPhone(userData.phoneNumber);
          }
        }

        // Fetch agent details from Firestore using agentId
        const agentDoc = await firestore().collection('agents').doc(agentId).get();
        if (agentDoc.exists) {
          setAgent(agentDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user or agent data", error);
      }
    };

    fetchUserInfo();
  }, [agentId]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert("Please enter a message.");
      return;
    }

    try {
      // Send the message to Firestore in the 'messages' collection
      const userid=await AsyncStorage.getItem('userid')
      await firestore().collection('messages').add({
        fullName,
        phone,
        email,
        message,
        agentId,
        timestamp: firestore.FieldValue.serverTimestamp(),
        userid
      });

      Alert.alert("Message Sent", "Your message has been sent successfully!");
    
      setMessage(''); // Clear message input field
    } catch (error) {
      console.error("Error sending message", error);
      Alert.alert("Error", "Failed to send the message. Please try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Contact Agent</Text>
      
      <TextInput
        style={styles.input}
        value={fullName}
        editable={false}
      />
      <TextInput
        style={styles.input}
        value={phone}
        editable={false}
      />
      <TextInput
        style={styles.input}
        value={email}
        editable={false}
      />
      
      <Text style={styles.label}>Message</Text>
      <TextInput
        style={styles.messageInput}
        value={message}
        onChangeText={setMessage}
        multiline
        placeholder="I'm interested in your property..."
      />

      <TouchableOpacity style={styles.button} onPress={handleSendMessage}>
        <Text style={styles.buttonText}>Send Message</Text>
      </TouchableOpacity>

      {agent && (
        <View style={styles.agentInfo}>
          <Text style={styles.agentTitle}>Will be sent to</Text>
          <Text style={styles.agentName}>{agent.agency_name}</Text>
          <Text style={styles.agentContact}>{agent.email}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
  },
  messageInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
    borderRadius: 5,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  agentInfo: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  agentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  agentName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  agentContact: {
    fontSize: 14,
    color: 'gray',
  },
});

export default ContactPropertyScreen;
