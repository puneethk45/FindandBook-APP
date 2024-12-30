import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert, 
  StyleSheet,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePicker from 'react-native-image-crop-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AgentEditProfileScreen = ({ navigation }) => {
  const [agentData, setAgentData] = useState({
    agency_name: '',
    full_name: '',
    email: '',
    phone_number: '',
    location_served: '',
    specialization: '',
    years_experience: '',
    commission_rate: '',
    personal_description: '',
    profile_picture_url: null
  });

  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      // Retrieve agent ID from AsyncStorage
      const agentId = await AsyncStorage.getItem('agentid');
      
      // Fetch agent data from Firestore
      const agentDoc = await firestore()
        .collection('agents')
        .doc(agentId)
        .get();
      
      if (agentDoc.exists) {
        setAgentData(agentDoc.data());
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
      Alert.alert('Error', 'Could not fetch profile data');
    }
  };

  const handleImageUpload = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true
      });

      // Upload image to Firebase Storage
      const reference = storage().ref(`profile_images/${agentData.user_id}`);
      await reference.putFile(image.path);
      
      // Get download URL
      const url = await reference.getDownloadURL();

      // Update state and Firestore
      setAgentData(prev => ({...prev, profile_picture_url: url}));
      setProfileImage(image.path);
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Could not upload image');
    }
  };

  const updateProfile = async () => {
    try {
      // Validate inputs
      if (!agentData.full_name || !agentData.phone_number) {
        Alert.alert('Error', 'Name and Phone Number are required');
        return;
      }

      // Update Firestore document
      await firestore()
        .collection('agents')
        .doc(agentData.user_id)
        .update({
          agency_name: agentData.agency_name,
          full_name: agentData.full_name,
          phone_number: agentData.phone_number,
          location_served: agentData.location_served,
          specialization: agentData.specialization,
          years_experience: agentData.years_experience,
          commission_rate: agentData.commission_rate,
          personal_description: agentData.personal_description,
          profile_picture_url: agentData.profile_picture_url
        });

      Alert.alert('Success', 'Profile Updated Successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Could not update profile');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <TouchableOpacity 
          style={styles.profileImageContainer} 
          onPress={handleImageUpload}
        >
          {profileImage || agentData.profile_picture_url ? (
            <Image 
              source={{uri: profileImage || agentData.profile_picture_url}} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profilePlaceholderText}>Add Photo</Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraIconText}>📷</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={agentData.email}
            editable={false}
            style={styles.inputDisabled}
          />

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            value={agentData.full_name}
            onChangeText={(text) => setAgentData(prev => ({...prev, full_name: text}))}
            style={styles.input}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={agentData.phone_number}
            onChangeText={(text) => setAgentData(prev => ({...prev, phone_number: text}))}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Agency Name</Text>
          <TextInput
            value={agentData.agency_name}
            onChangeText={(text) => setAgentData(prev => ({...prev, agency_name: text}))}
            style={styles.input}
          />

          <Text style={styles.label}>Location Served</Text>
          <TextInput
            value={agentData.location_served}
            onChangeText={(text) => setAgentData(prev => ({...prev, location_served: text}))}
            style={styles.input}
          />

          <Text style={styles.label}>Specialization</Text>
          <TextInput
            value={agentData.specialization}
            onChangeText={(text) => setAgentData(prev => ({...prev, specialization: text}))}
            style={styles.input}
          />

          <Text style={styles.label}>Years of Experience</Text>
          <TextInput
            value={agentData.years_experience}
            onChangeText={(text) => setAgentData(prev => ({...prev, years_experience: text}))}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Commission Rate (%)</Text>
          <TextInput
            value={agentData.commission_rate}
            onChangeText={(text) => setAgentData(prev => ({...prev, commission_rate: text}))}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Personal Description</Text>
          <TextInput
            value={agentData.personal_description}
            onChangeText={(text) => setAgentData(prev => ({...prev, personal_description: text}))}
            multiline
            style={styles.textArea}
          />

          <TouchableOpacity 
            style={styles.updateButton} 
            onPress={updateProfile}
          >
            <Text style={styles.updateButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  scrollContainer: {
    paddingBottom: 50
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white'
  },
  backButton: {
    fontSize: 18,
    color: '#007AFF',
    marginRight: 15
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginVertical: 20
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75
  },
  profilePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  profilePlaceholderText: {
    color: '#666'
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5
  },
  cameraIconText: {
    fontSize: 20
  },
  formContainer: {
    paddingHorizontal: 20
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'white'
  },
  inputDisabled: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#F0F0F0',
    color: '#666'
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    minHeight: 100
  },
  updateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default AgentEditProfileScreen;