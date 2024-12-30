import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  StatusBar,
  Dimensions 
} from 'react-native';
import { Users, Home, ArrowRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const AgentEntryScreen = ({ navigation }) => {
  const handleRoleSelection = (role) => {
    // Navigate directly based on selected role
    if (role === 'agent') {
      navigation.navigate('AgentWelcome');
    } else if (role === 'user') {
      navigation.navigate('Welcome');
    }
  };

  const renderRoleOption = (icon, title, description, role) => (
    <TouchableOpacity 
      style={styles.roleOption}
      onPress={() => handleRoleSelection(role)}
    >
      <View style={styles.roleIconContainer}>
        {icon}
      </View>
      <View style={styles.roleTextContainer}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleDescription}>{description}</Text>
      </View>
      <View style={styles.roleArrowContainer}>
        <ArrowRight color="#4A90E2" size={24} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F9FC" />
      
      {/* Brand Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </View>

      {/* Welcome Title */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.welcomeSubtitle}>Choose your journey</Text>
      </View>

      {/* Role Selection */}
      <View style={styles.roleSelectionContainer}>
        {renderRoleOption(
          <Users color="#4A90E2" size={32} />,
          "I'm an Agent",
          "Access your professional dashboard",
          'agent'
        )}
        
        {renderRoleOption(
          <Home color="#4A90E2" size={32} />,
          "I'm Looking for an Agent",
          "Browse and discover new homes",
          'user'
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    height: height * 0.25,
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.8,
    height: '100%',
    maxHeight: 250,
  },
  welcomeContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  roleSelectionContainer: {
    gap: 20,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roleIconContainer: {
    backgroundColor: 'rgba(74,144,226,0.1)',
    borderRadius: 10,
    padding: 10,
    marginRight: 15,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  roleArrowContainer: {
    padding: 10,
  },
});

export default AgentEntryScreen;