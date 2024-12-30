import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,Modal,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,Dimensions
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import DropDownPicker from 'react-native-dropdown-picker';

// Import the JSON data
const statedata = require("../assets/statedata.json");
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { width, height } = Dimensions.get('window');
let AGENT_ID;
const AgentScreen = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [agentData, setAgentData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    agency_name: '',
    location_served: '',
    zipcode: '',
    specialization: '',
    years_experience: '',
    personal_description: '',
    profile_picture_url: null,
    commission_rate: '',
    signup_date: new Date(),
    availability: [], 
  });
  const [profileImage, setProfileImage] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const navigation = useNavigation();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleAuthentication = async () => {
    try {
      if (authMode === 'login') {
       const userCredential= await auth().signInWithEmailAndPassword(authEmail, authPassword);
        await AsyncStorage.setItem('agentid',userCredential.user.uid)
        navigation.navigate('AgentHome');
        await AsyncStorage.setItem('isLoggedIn', 'agent');
        setIsAuthenticated(true);
      } else {
        const userCredential = await auth().createUserWithEmailAndPassword(authEmail, authPassword);
  
        AGENT_ID = userCredential.user.uid;
       
        setIsAuthenticated(true);
      }
    } catch (error) {
      Alert.alert('Authentication Error', error.message);
    }
  };

  const handlePickImage = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          console.error('Image Picker Error:', response.errorMessage);
          return;
        }
        const image = response.assets?.[0];
        if (image) {
          setProfileImage(image.uri);
        }
      }
    );
  };

  const uploadProfileImage = async (uri, agentId) => {
    const reference = storage().ref(`/agents/${agentId}/profile.jpg`);
    await reference.putFile(uri);
    return await reference.getDownloadURL();
  };

  const handleCreateAgent = async () => {
    try {
      const requiredFields = ['full_name', 'email', 'phone_number'];
      const missingFields = requiredFields.filter(field => !agentData[field]);

      if (missingFields.length > 0) {
        Alert.alert(
          'Validation Error',
          `Please fill in the following required fields: ${missingFields.join(', ')}`
        );
        return;
      }

    
      await AsyncStorage.setItem('agentid',AGENT_ID)
     
      let profileImageUrl = null;
      if (profileImage) {
        profileImageUrl = await uploadProfileImage(profileImage, AGENT_ID);
      }

      await firestore().collection('agents').doc(AGENT_ID).set({
        ...agentData,
        profile_picture_url: profileImageUrl,
        specializations: selectedSpecializations, 
        signup_date: firestore.FieldValue.serverTimestamp(),
        user_id: auth().currentUser.uid,
        states:selectedStates,
        counties:selectedCounties,
        zipcodes:selectedZipcodes
      });
      {renderSpecializationMultiSelect()}
      Alert.alert('Success', 'Agent profile created successfully');
      await AsyncStorage.setItem('isLoggedIn', 'agent');
      navigation.navigate('AgentHome');
    } catch (error) {
      console.error('Error creating agent:', error);
      Alert.alert('Error', 'Failed to create agent profile');
    }
  };
  const renderSpecializationMultiSelect = () => (
    <View 
      style={{
        backgroundColor: 'white',
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        padding: 10
      }}
    >
      <Text style={{
        fontSize: 16,
        color: '#2C3E50',
        marginBottom: 10,
        fontWeight: '600'
      }}>
        Select Agent Specializations
      </Text>
      {SPECIALIZATION_OPTIONS.map((specialization) => (
        <TouchableOpacity
          key={specialization}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
            padding: 10,
            backgroundColor: selectedSpecializations.includes(specialization) 
              ? '#4A90E2' 
              : '#F7F9FC',
            borderRadius: 10,
          
          }}
          onPress={() => {
            setSelectedSpecializations(prev => 
              prev.includes(specialization)
                ? prev.filter(item => item !== specialization)
                : [...prev, specialization]
            );
          }}
        >
          <View 
            style={{
              width: 20,
              height: 20,
              borderWidth: 2,
              borderColor: selectedSpecializations.includes(specialization) 
                ? 'white' 
                : '#4A90E2',
              backgroundColor: selectedSpecializations.includes(specialization) 
                ? '#4A90E2' 
                : 'white',
              marginRight: 10,
              borderRadius: 4
            }}
          >
            {selectedSpecializations.includes(specialization) && (
              <Text style={{ 
                color: 'white', 
                textAlign: 'center', 
                fontSize: 14 
              }}>
                ✓
              </Text>
            )}
          </View>
          <Text style={{
            color: selectedSpecializations.includes(specialization) 
              ? 'white' 
              : '#2C3E50',
            fontSize: 16
          }}>
            {specialization}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);

  const SPECIALIZATION_OPTIONS = [
    'Buyer Agent',
    'Seller Agent', 
    'Renter Agent', 
    'Tenant Agent', 
    'Property Manager'
  ];
  const [stateOptions, setStateOptions] = useState([]);
  const [countyOptions, setCountyOptions] = useState([]);
  const [zipcodeOptions, setZipcodeOptions] = useState([]);

  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedCounties, setSelectedCounties] = useState([]);
  const [selectedZipcodes, setSelectedZipcodes] = useState([]);
 console.log(selectedStates,selectedCounties,selectedZipcodes)
  useEffect(() => {
    // Populate state options from JSON data
    const states = Object.keys(statedata.states).map((stateName) => ({
      label: stateName,
      value: stateName,
    }));
    setStateOptions(states);
  }, []);

  // Update counties based on selected states
  useEffect(() => {
    if (selectedStates.length > 0) {
      const counties = selectedStates.flatMap((state) =>
        Object.keys(statedata.states[state]?.counties || {}).map((countyName) => ({
          label: countyName,
          value: `${countyName}-${state}`, // Use unique value
        }))
      );
      setCountyOptions(counties);
      setSelectedCounties([]); // Reset selected counties
      setSelectedZipcodes([]); // Reset selected zipcodes
    } else {
      setCountyOptions([]);
    }
  }, [selectedStates]);

  // Update zipcodes based on selected counties
  useEffect(() => {
    if (selectedCounties.length > 0) {
      const zipcodes = selectedCounties.flatMap((countyValue) => {
        const [county, state] = countyValue.split("-"); // Split value to get state
        return statedata.states[state]?.counties[county]?.zipcodes.map((zipcode) => ({
          label: zipcode,
          value: zipcode,
        })) || [];
      });
      console.log(zipcodes)
      setZipcodeOptions(zipcodes);
      setSelectedZipcodes([]); // Reset selected zipcodes
    } else {
      setZipcodeOptions([]);
    }
  }, [selectedCounties]);

  // Handlers
  const handleStateChange = useCallback((items) => {
    setSelectedStates(items);
  
  }, []);

  const handleCountyChange = useCallback((items) => {
    setSelectedCounties(items);
 
  }, []);

  const handleZipcodeChange = useCallback((items) => {
    setSelectedZipcodes(items);
   
  }, []);
  const renderAuthenticationView = () => (
    <LinearGradient
      colors={['#c81d77', '#6710c2']}
      style={styles.authContainer}
    >
      <View style={styles.authCard}>
        <Text style={styles.authTitle}>
          {authMode === 'login' ? 'Agent Login' : 'Agent Registration'}
        </Text>

        <View style={styles.inputContainer}>
          <Icon name="mail" size={20} color="#000" style={styles.inputIcon} />
          <TextInput
            style={styles.authInput}
            placeholder="Email Address"
            placeholderTextColor="#B4D3F3"
            value={authEmail}
            onChangeText={setAuthEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock-closed" size={20} color="#000" style={styles.inputIcon} />
          <TextInput
            style={styles.authInput}
            placeholder="Password"
            placeholderTextColor="#B4D3F3"
            value={authPassword}
            onChangeText={setAuthPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.authButton}
          onPress={handleAuthentication}
        >
          <LinearGradient
            colors={['#c81d77', '#6710c2']}
            style={styles.authButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.authButtonText}>
              {authMode === 'login' ? 'Log In' : 'Register'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        >
          <Text style={styles.switchAuthText}>
            {authMode === 'login'
              ? 'Need an account? Register'
              : 'Already have an account? Log In'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
  
  // Add refs for scroll position management
  const scrollViewRef = useRef(null);
  const dropdownPositions = useRef({
    states: 0,
    counties: 0,
    zipcodes: 0
  });



  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Function to handle dropdown open state and scroll position
  const handleDropdownOpen = (dropdownName, isOpen, position) => {
    // Close other dropdowns
    if (dropdownName === 'states') {
      setCountiesOpen(false);
      setZipcodesOpen(false);
      setStatesOpen(isOpen);
    } else if (dropdownName === 'counties') {
      setStatesOpen(false);
      setZipcodesOpen(false);
      setCountiesOpen(isOpen);
    } else if (dropdownName === 'zipcodes') {
      setStatesOpen(false);
      setCountiesOpen(false);
      setZipcodesOpen(isOpen);
    }

    // If opening, scroll to position
    if (isOpen && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: position - 100, // Offset to show some content above
        animated: true
      });
    }
  };
  const [statesOpen, setStatesOpen] = useState(false);
  const [countiesOpen, setCountiesOpen] = useState(false);
  const [zipcodesOpen, setZipcodesOpen] = useState(false);
  const renderLocationDropdowns = () => {
    return (
      <View style={{ padding: 10 }}>
        {/* States Dropdown */}
        <View 
          style={{ marginBottom: 20 }}
          onLayout={(event) => {
            dropdownPositions.current.states = event.nativeEvent.layout.y;
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Select States</Text>
          <DropDownPicker
            multiple={true}
            open={statesOpen}
            value={selectedStates}
            items={stateOptions}
            setOpen={(isOpen) => handleDropdownOpen('states', isOpen, dropdownPositions.current.states)}
            setValue={handleStateChange}
            setItems={setStateOptions}
            placeholder="Select States"
            mode="BADGE"
            listMode="SCROLLVIEW"
            maxHeight={300}
            style={{
              borderColor: '#E2E8F0',
              minHeight: 50,
              zIndex: 3000,
            }}
            containerStyle={{
              position: 'relative'
            }}
            dropDownContainerStyle={{
              borderColor: '#E2E8F0',
              backgroundColor: 'white',
              position: 'absolute',
              top: '100%',
              zIndex: 3000,
            }}
            searchable={true}
            searchPlaceholder="Search states..."
            searchTextInputProps={{
              maxLength: 50,
              autoCorrect: false
            }}
            searchContainerStyle={{
              borderBottomWidth: 1,
              borderBottomColor: '#E2E8F0'
            }}
            listItemContainerStyle={{
              height: 40
            }}
            scrollViewProps={{
              persistentScrollbar: true,
              nestedScrollEnabled: true
            }}
          />
        </View>

        {/* Counties Dropdown */}
        <View 
          style={{ marginBottom: 20 }}
          onLayout={(event) => {
            dropdownPositions.current.counties = event.nativeEvent.layout.y;
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Select Counties</Text>
          <DropDownPicker
            multiple={true}
            open={countiesOpen}
            value={selectedCounties}
            items={countyOptions}
            setOpen={(isOpen) => handleDropdownOpen('counties', isOpen, dropdownPositions.current.counties)}
            setValue={handleCountyChange}
            setItems={setCountyOptions}
            placeholder="Select Counties"
            mode="BADGE"
            listMode="SCROLLVIEW"
            maxHeight={300}
            style={{
              borderColor: '#E2E8F0',
              minHeight: 50,
              zIndex: 2000,
            }}
            containerStyle={{
              position: 'relative'
            }}
            dropDownContainerStyle={{
              borderColor: '#E2E8F0',
              backgroundColor: 'white',
              position: 'absolute',
              top: '100%',
              zIndex: 2000,
            }}
            searchable={true}
            searchPlaceholder="Search counties..."
            searchTextInputProps={{
              maxLength: 50,
              autoCorrect: false
            }}
            searchContainerStyle={{
              borderBottomWidth: 1,
              borderBottomColor: '#E2E8F0'
            }}
            listItemContainerStyle={{
              height: 40
            }}
            scrollViewProps={{
              persistentScrollbar: true,
              nestedScrollEnabled: true
            }}
          />
        </View>

        {/* Zipcodes Dropdown */}
        <View 
          style={{ marginBottom: 20 }}
          onLayout={(event) => {
            dropdownPositions.current.zipcodes = event.nativeEvent.layout.y;
          }}
        >
          {console.log("hello",zipcodeOptions)}
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Select Zipcodes</Text>
          <DropDownPicker
            multiple={true}
            open={zipcodesOpen}
            value={selectedZipcodes}
            items={zipcodeOptions}
            setOpen={(isOpen) => handleDropdownOpen('zipcodes', isOpen, dropdownPositions.current.zipcodes)}
            setValue={handleZipcodeChange}
            setItems={setZipcodeOptions}
            placeholder="Select Zipcodes"
            mode="BADGE"
            listMode="SCROLLVIEW"
            maxHeight={300}
            style={{
              borderColor: '#E2E8F0',
              minHeight: 50,
              zIndex: 1000,
            }}
            containerStyle={{
              position: 'relative'
            }}
            dropDownContainerStyle={{
              borderColor: '#E2E8F0',
              backgroundColor: 'white',
              position: 'absolute',
              top: '100%',
              zIndex: 1000,
            }}
            searchable={true}
            searchPlaceholder="Search zipcodes..."
            searchTextInputProps={{
              maxLength: 50,
              autoCorrect: false
            }}
            searchContainerStyle={{
              borderBottomWidth: 1,
              borderBottomColor: '#E2E8F0'
            }}
            listItemContainerStyle={{
              height: 40
            }}
            scrollViewProps={{
              persistentScrollbar: true,
              nestedScrollEnabled: true
            }}
          />
        </View>
      </View>
    );
  };

  const renderAgentForm = () => (
    <ScrollView
    ref={scrollViewRef}
    showsVerticalScrollIndicator={true}
    contentContainerStyle={{ 
      flexGrow: 1, 
      paddingBottom: keyboardHeight + 20,
      backgroundColor: '#F7F9FC' 
    }}
    keyboardShouldPersistTaps="handled"
    nestedScrollEnabled={true}
  >
      <View style={{
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 15,
        margin: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: '700',
          color: '#2C3E50',
          textAlign: 'center',
          marginBottom: 20
        }}>
          Create Agent Profile
        </Text>

        {/* Profile Image Section */}
        <TouchableOpacity 
          onPress={handlePickImage} 
          style={{
            alignSelf: 'center',
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#E9F0F7',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            borderWidth: 2,
            borderColor: '#4A90E2',
            borderStyle: 'dashed'
          }}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60
              }}
            />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ 
                color: '#4A90E2', 
                fontSize: 16, 
                fontWeight: '600' 
              }}>
                + Add Photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={{ 
          backgroundColor: '#F7F9FC', 
          borderRadius: 10, 
          padding: 10 
        }}>
          {[
            { key: 'full_name', placeholder: 'Full Name*', icon: '👤' },
            { key: 'email', placeholder: 'Email*', keyboardType: 'email-address', icon: '✉️' },
            { key: 'phone_number', placeholder: 'Phone Number*', keyboardType: 'phone-pad', icon: '📞' },
            { key: 'agency_name', placeholder: 'Agency Name', icon: '🏢' },
            { key: 'years_experience', placeholder: 'Years of Experience', keyboardType: 'numeric', icon: '📅' },
            { key: 'commission_rate', placeholder: 'Commission Rate', keyboardType: 'numeric', icon: '%' },
          ].map((field) => (
            <View 
              key={field.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'white',
                borderRadius: 10,
                marginBottom: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2
              }}
            >
              <Text style={{ padding: 10, fontSize: 18 }}>{field.icon}</Text>
              <TextInput
                style={{
                  flex: 1,
                  height: 50,
                  color: '#2C3E50',
                  fontSize: 16,
                  paddingRight: 10
                }}
                placeholder={field.placeholder}
                placeholderTextColor="#A0AEC0"
                keyboardType={field.keyboardType || 'default'}
                value={agentData[field.key]}
                onChangeText={(text) =>
                  setAgentData((prev) => ({ ...prev, [field.key]: text }))
                }
              />
            </View>
          ))}

          {/* Location Dropdowns */}
          {renderLocationDropdowns()}
     
          {/* Personal Description */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 10,
            marginTop: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2
          }}>
            <TextInput
              style={{
                height: 100,
                textAlignVertical: 'top',
                padding: 10,
                color: '#2C3E50',
                fontSize: 16
              }}
              placeholder="Personal Description"
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={4}
              value={agentData.personal_description}
              onChangeText={(text) =>
                setAgentData((prev) => ({ ...prev, personal_description: text }))
              }
            />
          </View>
        </View>
          {renderSpecializationMultiSelect()}

        {/* Submit Button */}
        <TouchableOpacity
          style={{
            marginTop: 20,
            backgroundColor: '#4A90E2',
            borderRadius: 10,
            paddingVertical: 15,
            alignItems: 'center',
            shadowColor: '#4A90E2',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 5
          }}
          onPress={handleCreateAgent}
        >
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: '700'
          }}>
            Create Profile
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return isAuthenticated ? renderAgentForm() :renderAuthenticationView();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authCard: {
    width: wp('85%'),
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    elevation: 5,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  lcontainer: {
    padding: 20,
    backgroundColor: '#F7F9FC',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 20,
  },
  dropdown: {
    marginBottom: 20,
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#B4D3F3',
    marginBottom: 15,
  },
  inputContainer2: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  authInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  authButton: {
    marginTop: 20,
  },
  authButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchAuthText: {
    marginTop: 10,
    fontSize: 14,
    color: '#4C6EF5',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePicker: {
    width: wp('60%'),
    height: wp('60%'),
    borderRadius: wp('30%'),
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePickerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  profileImage: {
    width: wp('60%'),
    height: wp('60%'),
    borderRadius: wp('30%'),
  },
  input: {
    width: wp('80%'),
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    height: hp('15%'),
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  submitButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  datePickerModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  datePickerModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20
  },
  datePickerButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  datePickerCancelButton: {
    backgroundColor: '#E2E8F0',
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 10
  },
  datePickerConfirmButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 10,
    flex: 1
  },
  datePickerButtonText: {
    textAlign: 'center',
    color: 'white'
  },

 
  availabilityModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  availabilityModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  availabilityModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  timeSlotButton: {
    width: '30%',
    margin: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedTimeSlotButton: {
    backgroundColor: '#4A90E2'
  },
  timeSlotText: {
    color: '#2C3E50'
  },
  selectedTimeSlotText: {
    color: 'white'
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  modalCancelButton: {
    backgroundColor: '#E2E8F0',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 10
  },
  modalCancelButtonText: {
    textAlign: 'center',
    color: '#2C3E50'
  },
  modalSaveButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 10,
    flex: 1
  },
  modalSaveButtonText: {
    textAlign: 'center',
    color: 'white'
  },buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    backgroundColor: '#E2E8F0',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  backButtonText: {
    textAlign: 'center',
    color: '#2C3E50',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 10,
    flex: 1,
  },
  saveButtonText: {
    textAlign: 'center',
    color: 'white',
  },
  closeButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default AgentScreen;
