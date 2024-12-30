import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  StyleSheet, 
  Alert,
  Platform,
  ActivityIndicator,
  BackHandler
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';

const AddListingScreen = () => {
  // Common state
  const [listingName, setListingName] = useState('');
  const [location, setLocation] = useState('');
  const [rate, setRate] = useState('');
  const [features, setFeatures] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [description, setDescription] = useState('');
  const [displayImage, setDisplayImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Property type specific state
  const [propertyType, setPropertyType] = useState('residential');
  const [propertySubType, setPropertySubType] = useState('house');
  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [propertyAge, setPropertyAge] = useState('');
  const [listingType, setListingType] = useState('Sale'); 
  const toggleListingType = (type) => {
    setListingType(type);
  };
  // Handle image upload to Firebase Storage
  const convertImageToBase64 = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Remove the data:image/jpeg;base64, part if it exists
          const base64data = reader.result.split(',')[1];
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw error;
    }
  };
  
  // Image picker for display image
  const pickDisplayImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000
      });
  
      if (result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Validate image size
        const fileSize = selectedImage.fileSize || 0;
        if (fileSize > 5 * 1024 * 1024) { // 5MB limit
          Alert.alert('Error', 'Image size should be less than 5MB');
          return;
        }
  
        const base64Image = await convertImageToBase64(selectedImage.uri);
        setDisplayImage({ uri: selectedImage.uri, base64: base64Image });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  // Image picker for additional images
  const pickAdditionalImages = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 5,
        maxWidth: 1000,
        maxHeight: 1000
      });
  
      if (result.assets) {
        const totalSize = result.assets.reduce((sum, img) => sum + (img.fileSize || 0), 0);
        if (totalSize > 15 * 1024 * 1024) { // 15MB total limit
          Alert.alert('Error', 'Total image size should be less than 15MB');
          return;
        }
  
        const base64Images = await Promise.all(
          result.assets.map(async (image) => {
            const base64 = await convertImageToBase64(image.uri);
            return { uri: image.uri, base64 };
          })
        );
  
        setAdditionalImages(base64Images);
      }
    } catch (error) {
      console.error('Additional images picker error:', error);
      Alert.alert('Error', 'Failed to pick additional images');
    }
  };
  useEffect(() => {
    const backAction = () => {
      try {
        console.log('Back button pressed');
        
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('My Listings');
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


  // Validate form data
  const validateForm = () => {
    if (!listingName || !location || !rate || !squareFeet || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return false;
    }

    if (!displayImage) {
      Alert.alert('Error', 'Please select a display image');
      return false;
    }

    // Validate property type specific fields
    switch(propertySubType) {
      case 'plot':
        if (!length || !breadth) {
          Alert.alert('Error', 'Please enter plot dimensions');
          return false;
        }
        break;
      case 'house':
      case 'flat':
      case 'apartment':
        if (!bedrooms || !bathrooms) {
          Alert.alert('Error', 'Please enter number of bedrooms and bathrooms');
          return false;
        }
        break;
      case 'office':
        if (!totalFloors || !selectedFloor) {
          Alert.alert('Error', 'Please enter floor details');
          return false;
        }
        break;
      case 'warehouse':
        if (!propertyAge) {
          Alert.alert('Error', 'Please enter property age');
          return false;
        }
        break;
    }

    return true;
  };
  const navigation = useNavigation();
  // Submit listing to Firebase
  const submitListing = async () => {
    if (!validateForm()) return;
    if (isUploading) return;
  
    try {
      setIsUploading(true);
      setUploadProgress(0);
  
      // Convert display image to Base64
      const displayImageBase64 = await convertImageToBase64(displayImage.uri);
  
      // Convert additional images to Base64
      const additionalImagesBase64 = await Promise.all(
        additionalImages.map(async (image) => await convertImageToBase64(image.uri))
      );
  
      // Get agent ID
      const agentId = await AsyncStorage.getItem('agentid');
  
      // Prepare listing data
      const listingData = {
        name: listingName,
        location,
        price: parseFloat(rate),
        features: features.split(',').map(f => f.trim()).filter(f => f),
        squareFeet: parseInt(squareFeet),
        description,
        propertyType,
        propertySubType,
        displayImage: displayImageBase64,
        additionalImages: additionalImagesBase64,
        agentId,
        listingType, 
        status:"Active",
        createdAt: firestore.FieldValue.serverTimestamp(),
        
        // Property type specific data
        ...(propertySubType === 'plot' && {
          length: parseFloat(length),
          breadth: parseFloat(breadth),
          plotArea: parseFloat(length) * parseFloat(breadth)
        }),
        
        ...((['house', 'flat', 'apartment'].includes(propertySubType)) && {
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms)
        }),
        
        ...(propertySubType === 'office' && {
          totalFloors: parseInt(totalFloors),
          selectedFloor: parseInt(selectedFloor)
        }),
        
        ...(propertySubType === 'warehouse' && {
          propertyAge: parseInt(propertyAge)
        })
      };
  
      // Add to Firestore
      await firestore().collection('listings').add(listingData);
  
      Alert.alert('Success', 'Property listing added successfully!');
      
      resetForm();
      navigation.navigate('AgentHome');
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Failed to submit listing. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setListingName('');
    setLocation('');
    setRate('');
    setFeatures('');
    setSquareFeet('');
    setDescription('');
    setDisplayImage(null);
    setAdditionalImages([]);
    setLength('');
    setBreadth('');
    setBedrooms('');
    setBathrooms('');
    setTotalFloors('');
    setSelectedFloor('');
    setPropertyAge('');
  };

  const renderPropertyTypeSpecificFields = () => {
    switch(propertySubType) {
      case 'plot':
        return (
          <View style={styles.specificFields}>
            <Text style={styles.sectionTitle}>Plot Dimensions</Text>
            <View style={styles.rowContainer}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Length (ft)"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={length}
                onChangeText={setLength}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Breadth (ft)"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={breadth}
                onChangeText={setBreadth}
              />
            </View>
          </View>
        );
      
      case 'house':
      case 'flat':
      case 'apartment':
        return (
          <View style={styles.specificFields}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <View style={styles.rowContainer}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Bedrooms"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={bedrooms}
                onChangeText={setBedrooms}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Bathrooms"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={bathrooms}
                onChangeText={setBathrooms}
              />
            </View>
          </View>
        );
      
      case 'office':
        return (
          <View style={styles.specificFields}>
            <Text style={styles.sectionTitle}>Office Details</Text>
            <View style={styles.rowContainer}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Total Floors"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={totalFloors}
                onChangeText={setTotalFloors}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Your Floor"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={selectedFloor}
                onChangeText={setSelectedFloor}
              />
            </View>
          </View>
        );
      
      case 'warehouse':
        return (
          <View style={styles.specificFields}>
            <Text style={styles.sectionTitle}>Warehouse Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Age of Property (years)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={propertyAge}
              onChangeText={setPropertyAge}
            />
          </View>
        );
    }
  };

  return (
    <LinearGradient
      colors={['#1a237e', '#0d47a1']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Property</Text>
          <Text style={styles.headerSubtitle}>Create your property listing</Text>
        </View>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, listingType === 'Sale' && styles.activeToggle]}
            onPress={() => toggleListingType('Sale')}
          >
            <Text style={[styles.toggleText,listingType === 'Sale' && styles.activeToggleText]}>Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, listingType === 'Rent' && styles.activeToggle]}
            onPress={() => toggleListingType('Rent')}
          >
            <Text style={[styles.toggleText,listingType === 'Rent' && styles.activeToggleText]}>Rent</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.formContainer}>
  <View style={styles.propertyTypeSelector}>
    <Text style={styles.sectionTitle}>Property Type</Text>
    <View style={styles.pickerOuterContainer}>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={propertySubType}
          style={styles.picker}
          onValueChange={(itemValue) => setPropertySubType(itemValue)}
          mode="dropdown"
          dropdownIconColor="#1a237e"
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="Residential House" value="house" />
          <Picker.Item label="Flat/Apartment" value="flat" />
          <Picker.Item label="Plot/Land" value="plot" />
          <Picker.Item label="Commercial Office" value="office" />
          <Picker.Item label="Warehouse" value="warehouse" />
        </Picker>
      </View>
    </View>
  </View>

          <TouchableOpacity 
            style={styles.imagePickerContainer} 
            onPress={pickDisplayImage}
          >
            {displayImage ? (
              <Image 
                source={{ uri: displayImage.uri }} 
                style={styles.mainImagePreview} 
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color="#fff" />
                <Text style={styles.imagePlaceholderText}>Add Main Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.additionalImagesButton} 
            onPress={pickAdditionalImages}
          >
            <Text style={styles.additionalImagesText}>
              Add Additional Photos (Max 5)
            </Text>
            <View style={styles.additionalImagesPreview}>
              {additionalImages.map((image, index) => (
                <Image 
                  key={index} 
                  source={{ uri: image.uri }} 
                  style={styles.thumbnailImage} 
                />
              ))}
            </View>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Listing Name"
            placeholderTextColor="#888"
            value={listingName}
            onChangeText={setListingName}
          />

          <TextInput
            style={styles.input}
            placeholder="Location"
            placeholderTextColor="#888"
            value={location}
            onChangeText={setLocation}
          />

          <TextInput
            style={styles.input}
            placeholder="Price"
            keyboardType="numeric"
            placeholderTextColor="#888"
            value={rate}
            onChangeText={setRate}
          />

          {renderPropertyTypeSpecificFields()}

          <TextInput
            style={styles.input}
            placeholder="Square Feet"
            keyboardType="numeric"
            placeholderTextColor="#888"
            value={squareFeet}
            onChangeText={setSquareFeet}
          />

          <TextInput
            style={styles.input}
            placeholder="Features (Comma Separated)"
            placeholderTextColor="#888"
            value={features}
            onChangeText={setFeatures}
          />

          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Description"
            placeholderTextColor="#888"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
          />

{isUploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#1a237e" />
              <Text style={styles.uploadingText}>
                Uploading... {Math.round(uploadProgress)}%
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={[
              styles.submitButton,
              isUploading && styles.submitButtonDisabled
            ]} 
            onPress={submitListing}
            disabled={isUploading}
          >
            <Text style={styles.submitButtonText}>
              {isUploading ? 'Uploading...' : 'Submit Listing'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop:13
  },
  formContainer: {
    backgroundColor: 'black',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 6,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',  // Light grey background
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#c5c5c5',  // Subtle border
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToggle: {
    backgroundColor: '#1a237e',  // Active color (deep blue)
  },
  toggleText: {
    fontSize: 16,
    color: 'black',
    fontWeight: '500',
  },
  activeToggleText: {
    color: 'white',
    fontWeight: 'bold',
  },
  propertyTypeSelector: {
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  pickerContainer: {
    backgroundColor: '#2196f3',
    borderRadius:10,
    ...Platform.select({
      ios: {
        paddingVertical: 8,
        paddingHorizontal: 12,
      },
      android: {
        paddingHorizontal: 0,
      },
    }),
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
    ...Platform.select({
      ios: {
        color: '#2c3e50',
      },
      android: {
        color: '#2c3e50',
        backgroundColor: 'black',
      },
    }),
  },
  pickerItem: {
    fontSize: 16,
    ...Platform.select({
      ios: {
        color: '#2c3e50',
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
    marginBottom: 10,
  },
 
  picker: {
    height: 50,
  },
  imagePickerContainer: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mainImagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2196f3',
  },
  imagePlaceholderText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  additionalImagesButton: {
    marginBottom: 20,
  },
  additionalImagesText: {
    color: '#2196f3',
    fontSize: 16,
    marginBottom: 10,
  },
  additionalImagesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  halfInput: {
    flex: 1,
  },
  specificFields: {
    marginVertical: 15,
  },
  uploadingContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  uploadingText: {
    marginTop: 10,
    color: '#1a237e',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#1a237e',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9e9e9e',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddListingScreen;