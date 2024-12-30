import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

const AgentSignupFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState({
    // Authentication Details
    email: '',
    password: '',
    confirmPassword: '',
    
    // Basic Profile Details
    fullName: '',
    phoneNumber: '',
    agencyName: '',
    
    
    locationServed: '',
    specialization: '',
    yearsExperience: '',
    personalDescription: '',
    profilePicture: null,
    commissionRate: '',
  });

  const navigation = useNavigation();

  const handleNextStep = () => {
    // Validation logic for each step
    switch (currentStep) {
      case 1:
        if (!validateAuthStep()) return;
        break;
      case 2:
        if (!validateBasicProfileStep()) return;
        break;
      case 3:
        if (!validateProfessionalStep()) return;
        break;
    }
    
    // Move to next step if validation passes
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateAuthStep = () => {
    const { email, password, confirmPassword } = signupData;
    if (!email || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill all fields');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const validateBasicProfileStep = () => {
    const { fullName, phoneNumber } = signupData;
    if (!fullName || !phoneNumber) {
      Alert.alert('Validation Error', 'Name and Phone Number are required');
      return false;
    }
    return true;
  };

  const validateProfessionalStep = () => {
    const { locationServed, specialization, yearsExperience } = signupData;
    if (!locationServed || !specialization || !yearsExperience) {
      Alert.alert('Validation Error', 'Please complete all professional details');
      return false;
    }
    return true;
  };

  const handleImageUpload = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 500,
        maxHeight: 500,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          console.error('ImagePicker Error:', response.errorMessage);
          return;
        }
        const image = response.assets?.[0];
        if (image) {
          setSignupData(prev => ({ ...prev, profilePicture: image.uri }));
        }
      }
    );
  };

  const handleFinalSubmit = async () => {
    try {
      // Create Firebase Authentication User
      const userCredential = await auth().createUserWithEmailAndPassword(
        signupData.email, 
        signupData.password
      );
      const userId = userCredential.user.uid;

      // Upload Profile Picture if exists
      let profilePictureUrl = null;
      if (signupData.profilePicture) {
        const reference = storage().ref(`/agents/${userId}/profile.jpg`);
        await reference.putFile(signupData.profilePicture);
        profilePictureUrl = await reference.getDownloadURL();
      }

      // Save Agent Profile to Firestore
      await firestore().collection('agents').doc(userId).set({
        fullName: signupData.fullName,
        email: signupData.email,
        phoneNumber: signupData.phoneNumber,
        agencyName: signupData.agencyName,
        locationServed: signupData.locationServed,
        specialization: signupData.specialization,
        yearsExperience: signupData.yearsExperience,
        personalDescription: signupData.personalDescription,
        profilePictureUrl: profilePictureUrl,
        commissionRate: signupData.commissionRate,
        signupDate: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Success', 'Agent profile created successfully');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Signup Error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const renderAuthStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create Your Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={signupData.email}
        onChangeText={(text) => setSignupData(prev => ({ ...prev, email: text }))}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={signupData.password}
        onChangeText={(text) => setSignupData(prev => ({ ...prev, password: text }))}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={signupData.confirmPassword}
        onChangeText={(text) => setSignupData(prev => ({ ...prev, confirmPassword: text }))}
        secureTextEntry
      />
    </View>
  );

  const renderBasicProfileStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Profile Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={signupData.fullName}
        onChangeText={(text) => setSignupData(prev => ({ ...prev, fullName: text }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={signupData.phoneNumber}
        onChangeText={(text) => setSignupData(prev => ({ ...prev, phoneNumber: text }))}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Agency Name (Optional)"
        value={signupData.agencyName}
        onChangeText={(text) => setSignupData(prev => ({ ...prev, agencyName: text }))}
      />
    </View>
  );

  const renderProfessionalStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Professional Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Location(s) Served"
        value={signupData.locationServed}
        onChangeText={(text) => setSignupData(prev => ({ ...prev, locationServed: text }))}
      />
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Specialization</Text>
        <View style={styles.radioGroup}>
          {['Buying', 'Selling', 'Renting', 'All'].map((spec) => (
            <TouchableOpacity
              key={spec}
              style={[
                styles.radioButton,
                signupData.specialization === spec && styles.radioButtonSelected
              ]}
              onPress={() => setSignupData(prev => ({ ...prev, specialization: spec }))}
            >
              <Text style={styles.radioButtonText}>{spec}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Years of Experience"
        value={signupData.yearsExperience}
        onChangeText={(text) => setSignupData(prev => ({ ...prev, yearsExperience: text }))}
        keyboardType="numeric"
      />
    </View>
  );

  const renderProfilePictureStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Profile Picture & Description</Text>
      <TouchableOpacity style={styles.profilePicker} onPress={handleImageUpload}>
        {signupData.profilePicture ? (
          <Image 
            source={{ uri: signupData.profilePicture }} 
            style={styles.profileImage} 
          />
        ) : (
          <Text style={styles.profilePickerText}>Upload Profile Picture</Text>
        )}
      </TouchableOpacity>
      <TextInput
        style={styles.multilineInput}
        placeholder="Personal Description"
        value={signupData.personalDescription}
        onChangeText={(text) => setSignupData(prev => ({ ...prev, personalDescription: text }))}
        multiline
        numberOfLines={4}
      />
      <TextInput
        style={styles.input}
        placeholder="Commission Rate (Optional)"
        value={signupData.commissionRate}
        onChangeText={(text) => setSignupData(prev => ({ ...prev, commissionRate: text }))}
        keyboardType="numeric"
      />
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderAuthStep();
      case 2: return renderBasicProfileStep();
      case 3: return renderProfessionalStep();
      case 4: return renderProfilePictureStep();
      default: return null;
    }
  };

  const renderNavigationButtons = () => (
    <View style={styles.navigationContainer}>
      {currentStep > 1 && (
        <TouchableOpacity 
          style={[styles.navigationButton, styles.previousButton]} 
          onPress={handlePreviousStep}
        >
          <Text style={styles.navigationButtonText}>Previous</Text>
        </TouchableOpacity>
      )}
      
      {currentStep < 4 ? (
        <TouchableOpacity 
          style={[styles.navigationButton, styles.nextButton]} 
          onPress={handleNextStep}
        >
          <Text style={styles.navigationButtonText}>Next</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.navigationButton, styles.submitButton]} 
          onPress={handleFinalSubmit}
        >
          <Text style={styles.navigationButtonText}>Submit Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <LinearGradient 
      colors={['#f0f4f8', '#e6eaf0']} 
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
        {renderNavigationButtons()}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#f9fafd',
    },
    scrollContainer: {
      paddingBottom: 30,
    },
    stepContainer: {
      marginVertical: 20,
      backgroundColor: '#ffffff',
      padding: 20,
      borderRadius: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: '#333',
      textAlign: 'center',
      marginBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: '#dcdcdc',
      borderRadius: 8,
      padding: 15,
      fontSize: 16,
      backgroundColor: '#f7f7f7',
      marginBottom: 15,
      color: '#333',
    },
    multilineInput: {
      borderWidth: 1,
      borderColor: '#dcdcdc',
      borderRadius: 8,
      padding: 15,
      fontSize: 16,
      backgroundColor: '#f7f7f7',
      marginBottom: 15,
      color: '#333',
      textAlignVertical: 'top',
    },
    pickerContainer: {
      marginVertical: 20,
    },
    pickerLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 10,
      color: '#333',
    },
    radioGroup: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 10,
    },
    radioButton: {
      flex: 1,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: '#dcdcdc',
      borderRadius: 8,
      backgroundColor: '#f9f9f9',
      marginHorizontal: 5,
      alignItems: 'center',
    },
    radioButtonSelected: {
      backgroundColor: '#4a90e2',
      borderColor: '#4a90e2',
    },
    radioButtonText: {
      color: '#333',
      fontWeight: '500',
    },
    profilePicker: {
      alignSelf: 'center',
      width: 180,
      height: 180,
      borderRadius: 90,
      borderWidth: 1,
      borderColor: '#dcdcdc',
      backgroundColor: '#f7f7f7',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    profileImage: {
      width: 180,
      height: 180,
      borderRadius: 90,
    },
    profilePickerText: {
      fontSize: 14,
      color: '#8e8e93',
    },
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    navigationButton: {
      flex: 1,
      paddingVertical: 15,
      borderRadius: 10,
      marginHorizontal: 10,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 2,
    },
    previousButton: {
      backgroundColor: '#e6eaf0',
    },
    nextButton: {
      backgroundColor: '#4a90e2',
    },
    submitButton: {
      backgroundColor: '#50c878',
    },
    navigationButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
  });
  
export default AgentSignupFlow;