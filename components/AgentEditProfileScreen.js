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
  Platform,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePicker from 'react-native-image-crop-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';

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

  useEffect(() => {
    const backAction = () => {
      try {
        console.log('Back button pressed');
        
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('AgentHome');
        }
        return true;
      } catch (error) {
        console.error('Navigation error:', error);
        return false;
      }
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  const fetchAgentData = async () => {
    try {
      const agentId = await AsyncStorage.getItem('agentid');
      
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

  const handleLogout = async () => {
    try {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Logout',
            onPress: async () => {
              await AsyncStorage.removeItem('isLoggedIn');
              navigation.replace('AgentEntry');
            },
            style: 'destructive'
          }
        ]
      );
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
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

  const handleImageUpload = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true
      });

      const reference = storage().ref(`profile_images/${agentData.user_id}`);
      await reference.putFile(image.path);
      
      const url = await reference.getDownloadURL();

      setAgentData(prev => ({...prev, profile_picture_url: url}));
      setProfileImage(image.path);
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Could not upload image');
    }
  };

  const handlePasswordReset = async () => {
    try {
      if (!agentData.email) {
        Alert.alert('Error', 'Email not found. Please update your email.');
        return;
      }
      await auth().sendPasswordResetEmail(agentData.email);
      Alert.alert('Success', 'Password reset email sent. Check your inbox.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send reset email.');
    }
  };

  const updateProfile = async () => {
    try {
      if (!agentData.full_name || !agentData.phone_number) {
        Alert.alert('Error', 'Name and Phone Number are required');
        return;
      }

      await firestore()
        .collection('agents')
        .doc(agentData.user_id)
        .update({
          agency_name: agentData.agency_name,
          full_name: agentData.full_name,
          phone_number: agentData.phone_number,
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
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={updateProfile}
            >
              <Ionicons name="save-outline" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Update Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => navigation.navigate('LocationEditor')}
            >
              <Ionicons name="location-outline" size={20} color="white" />
              <Text style={styles.secondaryButtonText}>Edit Location Preferences</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.utilityButton} 
              onPress={handlePasswordReset}
            >
              <Ionicons name="key-outline" size={20} color="#007AFF" />
              <Text style={styles.utilityButtonText}>Reset Password</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="AgentHome" />
        <NavItem name="cash" label="My Listings" />
        <NavItem name="mail" label="FeedBack" />
        <NavItem name="chatbubble" label="Messages" />
        <NavItem name="person" label="Profile" isActive />
      </View>
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
  buttonContainer: {
    padding: 20,
    gap: 15,
  },
  buttonGroup: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },secondaryButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  utilityButton: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  utilityButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  }
});

export default AgentEditProfileScreen;