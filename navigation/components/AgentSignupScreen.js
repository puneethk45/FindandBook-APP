import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

const AgentSignupScreen = ({ navigation }) => {
  const [profilePicture, setProfilePicture] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');

  const handleSubmit = () => {
    // Handle agent signup with additional fields
    const agentSignupData = {
      profile_picture_url: profilePicture,
      commission_rate: commissionRate,
      verification_status: verificationStatus === 'verified',
    };

    console.log(agentSignupData);
    navigation.navigate('Home'); // Redirect to home after successful signup
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Profile Picture URL"
        value={profilePicture}
        onChangeText={setProfilePicture}
      />
      <TextInput
        style={styles.input}
        placeholder="Commission Rate"
        value={commissionRate}
        onChangeText={setCommissionRate}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Verification Status (verified/unverified)"
        value={verificationStatus}
        onChangeText={setVerificationStatus}
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 8,
  },
});

export default AgentSignupScreen;
