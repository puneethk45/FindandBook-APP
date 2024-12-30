import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const UserProfileScreen = () => {
  const navigation = useNavigation(); // Use navigation hook

  // State for user profile
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    city: '',
  });

  // Loading and editing states
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Temporary state for editing
  const [editedProfile, setEditedProfile] = useState({ ...profile });

  // Fetch user profile on component mount
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

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Home'); // Navigate to HOME
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); // Clean up listener
  }, [navigation]);

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6a11cb" />
      </View>
    );
  }

  return (
    <View style={styles.gradientContainer}>
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
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6a11cb',
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
});

export default UserProfileScreen;