import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
const UserProfileScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    city: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ ...profile });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem('userid');
        if (!userId) throw new Error('No user ID found');

        const userDoc = await firestore()
          .collection('users')
          .doc(userId)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          setProfile(userData);
          setEditedProfile(userData);
        } else {
          throw new Error('User document not found');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Home');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('isLoggedIn');
      navigation.replace('AgentEntry');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const saveProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userid');
      if (!userId) throw new Error('No user ID found');

      await firestore()
        .collection('users')
        .doc(userId)
        .update(editedProfile);

      setProfile(editedProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Profile update error:', error);
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
        <Text style={[styles.navLabel, isActive && { color: '#3A6073', fontWeight: '600' }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEditableField = (label, value, field) => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={styles.editInput}
            value={editedProfile[field]}
            onChangeText={(text) => setEditedProfile({ ...editedProfile, [field]: text })}
          />
        ) : (
          <Text style={styles.value}>{value}</Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <>
      <LinearGradient colors={['#c81d77', '#6710c2']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="white" />
      
      </LinearGradient>
      <View style={styles.bottomNav}>
      <NavItem name="home-outline" label="Home"  />
      <NavItem name="calendar" label="My Meetings"/>
      <NavItem name="mail" label="Feedback" />
      <NavItem name="chatbubble" label="Chats" />
      <NavItem name="person" label="My Profile"  isActive/>
    </View>
    </>
    );
  }
  const handlePasswordReset = async () => {
    try {
      if (!profile.email) {
        Alert.alert('Error', 'Email not found. Please update your email.');
        return;
      }
      await auth().sendPasswordResetEmail(profile.email);
      Alert.alert('Success', 'Password reset email sent. Check your inbox.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send reset email.');
    }
  };
  return (
    <LinearGradient colors={['#c81d77', '#6710c2']} style={styles.gradientContainer}>
   
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileHeader}>
          <Text style={styles.headerTitle}>User Profile</Text>
          <TouchableOpacity onPress={() => (isEditing ? saveProfile() : setIsEditing(true))} style={styles.editButton}>
            <Ionicons name={isEditing ? 'save-outline' : 'create-outline'} size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          {renderEditableField('Full Name', profile.fullName, 'fullName')}
          {renderEditableField('Email', profile.email, 'email')}
          {renderEditableField('Phone Number', profile.phoneNumber, 'phoneNumber')}
          {renderEditableField('City', profile.city, 'city')}

          {isEditing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditedProfile({ ...profile });
                  setIsEditing(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.resetButton} onPress={handlePasswordReset}>
            <Ionicons name="key-outline" size={20} color="white" />
            <Text style={styles.resetButtonText}>Reset Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="Home"  />
        <NavItem name="calendar" label="My Meetings" />
        <NavItem name="mail" label="Feedback" />
        <NavItem name="chatbubble" label="Chats" />
        <NavItem name="person" label="My Profile" isActive/>
      </View>
   </LinearGradient>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6a11cb',
  },
  resetButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  gradientContainer: {
    flex: 1,
    backgroundColor: '#790191',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 10,
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
  },
  navLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    color: '#6a11cb',
    fontWeight: '600',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  editInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#6a11cb',
    fontSize: 16,
    paddingVertical: 5,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff4500',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff4500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});

export default UserProfileScreen;