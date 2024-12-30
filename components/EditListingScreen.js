import React, { useState, useEffect } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';

const EditListingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { listingId } = route.params;

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
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Fetch listing data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const agentId = await AsyncStorage.getItem('agentid');
        const listingDoc = await firestore()
          .collection('listings')
          .doc(listingId)
          .get();

        if (!listingDoc.exists) {
          Alert.alert('Error', 'Listing not found');
          navigation.goBack();
          return;
        }

        const data = listingDoc.data();
        
        // Verify agent ownership
        if (data.agentId !== agentId) {
          Alert.alert('Error', 'You do not have permission to edit this listing');
          navigation.goBack();
          return;
        }

        // Populate form data
        setListingName(data.name);
        setLocation(data.location);
        setRate(data.price.toString());
        setFeatures(data.features.join(', '));
        setSquareFeet(data.squareFeet.toString());
        setDescription(data.description);
        setPropertyType(data.propertyType);
        setPropertySubType(data.propertySubType);
        
        // Set images
        if (data.displayImage) {
          setDisplayImage({ 
            uri: `data:image/jpeg;base64,${data.displayImage}`,
            base64: data.displayImage 
          });
        }
        
        if (data.additionalImages) {
          setAdditionalImages(data.additionalImages.map(base64 => ({
            uri: `data:image/jpeg;base64,${base64}`,
            base64
          })));
        }

        // Set property-specific fields
        switch(data.propertySubType) {
          case 'plot':
            setLength(data.length.toString());
            setBreadth(data.breadth.toString());
            break;
          case 'house':
          case 'flat':
          case 'apartment':
            setBedrooms(data.bedrooms.toString());
            setBathrooms(data.bathrooms.toString());
            break;
          case 'office':
            setTotalFloors(data.totalFloors.toString());
            setSelectedFloor(data.selectedFloor.toString());
            break;
          case 'warehouse':
            setPropertyAge(data.propertyAge.toString());
            break;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching listing:', error);
        Alert.alert('Error', 'Failed to load listing details');
        navigation.goBack();
      }
    };

    fetchListing();
  }, [listingId, navigation]);

  // Handle image upload
  const convertImageToBase64 = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
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
        if (fileSize > 5 * 1024 * 1024) {
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
        if (totalSize > 15 * 1024 * 1024) {
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

  // Validate form
  const validateForm = () => {
    if (!listingName || !location || !rate || !squareFeet || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return false;
    }

    if (!displayImage) {
      Alert.alert('Error', 'Please select a display image');
      return false;
    }

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

  // Update listing
  const updateListing = async () => {
    if (!validateForm()) return;
    if (isUploading) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const listingData = {
        name: listingName,
        location,
        price: parseFloat(rate),
        features: features.split(',').map(f => f.trim()).filter(f => f),
        squareFeet: parseInt(squareFeet),
        description,
        propertyType,
        propertySubType,
        displayImage: displayImage.base64,
        additionalImages: additionalImages.map(img => img.base64),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        
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

      await firestore()
        .collection('listings')
        .doc(listingId)
        .update(listingData);

      Alert.alert('Success', 'Property listing updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update listing. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading listing details...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a237e', '#0d47a1']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Property</Text>
          <Text style={styles.headerSubtitle}>Update your property listing</Text>
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
            onPress={updateListing}
            disabled={isUploading}
          >
            <Text style={styles.submitButtonText}>
              {isUploading ? 'Updating...' : 'Update Listing'}
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
    paddingTop:20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  loadingText: {
    marginTop: 10,
    color: '#1a237e',
    fontSize: 16
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    flex: 1,
  },
  propertyTypeSelector: {
    marginBottom: 20,
  },
  pickerOuterContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  pickerContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: '#2196f3',
    height: 50,
  },
  pickerItem: {
    backgroundColor: '#2196f3',
    borderRadius:10,
  },
  imagePickerContainer: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  mainImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  additionalImagesButton: {
    marginBottom: 20,
  },
  additionalImagesText: {
    color: '#1a237e',
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
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
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
    height: 100,
    textAlignVertical: 'top',
  },
  specificFields: {
    marginBottom: 15,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  halfInput: {
    flex: 1,
  },
  uploadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  uploadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#1a237e',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EditListingScreen;