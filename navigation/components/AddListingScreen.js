import React, { useState ,useEffect} from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  StyleSheet, 
  Alert,
  Platform,Switch
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
const AddListingScreen = () => {
  
    const [listingName, setListingName] = useState('');
    const [location, setLocation] = useState('');
    const [rate, setRate] = useState('');
    const [features, setFeatures] = useState('');
    const [listingType, setListingType] = useState('rent');
    const [squareFeet, setSquareFeet] = useState('');
    const [beds, setBeds] = useState('');
    const [baths, setBaths] = useState('');
   
    const [description, setDescription] = useState('');
    const [displayImage, setDisplayImage] = useState(null);
    const [additionalImages, setAdditionalImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
  
    // Convert image to base64
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
  
          setDisplayImage(selectedImage);
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
          // Validate total image size
          const totalSize = result.assets.reduce((sum, img) => sum + (img.fileSize || 0), 0);
          if (totalSize > 15 * 1024 * 1024) { // 15MB total limit
            Alert.alert('Error', 'Total image size should be less than 15MB');
            return;
          }
  
          setAdditionalImages(result.assets);
        }
      } catch (error) {
        console.error('Additional images picker error:', error);
        Alert.alert('Error', 'Failed to pick additional images');
      }
    };
  
    // Submit listing method
    const submitListing = async () => {
      // Validate required fields
      if (!listingName || !location || !rate) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }
  
      // Prevent multiple submissions
      if (isUploading) return;
  
      try {
        setIsUploading(true);
  
        // Convert display image to base64
        let displayImageBase64 = null;
        if (displayImage) {
          try {
            displayImageBase64 = await convertImageToBase64(displayImage.uri);
          } catch (convertError) {
            console.error('Display image conversion failed:', convertError);
            Alert.alert('Conversion Error', 'Failed to process display image');
            return;
          }
        }
  
        // Convert additional images to base64
        const additionalImageBase64 = await Promise.all(
          additionalImages.map(async (image) => {
            try {
              return await convertImageToBase64(image.uri);
            } catch (convertError) {
              console.error('Additional image conversion failed:', convertError);
              return null;
            }
          })
        );
  
        // Filter out any failed conversions
        const validAdditionalImages = additionalImageBase64.filter(img => img !== null);
  
        // Retrieve agent ID from AsyncStorage
        const agentId = await AsyncStorage.getItem('agentid');
  
        // Prepare listing data
        const listingData = {
          name: listingName,
          location,
          rate: parseFloat(rate),
          features: features.split(',').map(f => f.trim()),
          squareFeet: parseInt(squareFeet),
                    beds: parseInt(beds),
                    baths: parseFloat(baths),
                    description,
          type: listingType,
          displayImage: {
            base64: displayImageBase64,
            // Optional: Add metadata
            metadata: {
              originalName: displayImage?.fileName,
              size: displayImage?.fileSize,
              type: displayImage?.type
            }
          },
          additionalImages: validAdditionalImages.map((base64, index) => ({
            base64,
            metadata: {
              originalName: additionalImages[index]?.fileName,
              size: additionalImages[index]?.fileSize,
              type: additionalImages[index]?.type
            }
          })),
          agentId: agentId,
          createdAt: firestore.FieldValue.serverTimestamp()
        };
  
        // Submit to Firestore
        await firestore().collection('listings').add(listingData);
  
        // Reset form and show success message
        resetForm();
        Alert.alert('Success', 'Listing added successfully!');
      } catch (error) {
        console.error('Listing submission error:', error);
        Alert.alert('Error', 'Failed to submit listing. Please try again.');
      } finally {
        setIsUploading(false);
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
    
    // Reset form method
    const resetForm = () => {
      setListingName('');
      setLocation('');
      setRate('');
      setFeatures('');
      setDisplayImage(null);
      setAdditionalImages([]);
    };
  return (
    <LinearGradient
      colors={['#c81d77', '#6710c2']}  // Set gradient colors
      style={styles.container}  // Apply gradient to the container
    >
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Add New Listing</Text>

        <TouchableOpacity 
          style={styles.imagePicker} 
          onPress={pickDisplayImage}
        >
          {displayImage ? (
            <Image 
              source={{ uri: displayImage.uri }} 
              style={styles.imagePreview} 
            />
          ) : (
            <Text>Pick Display Image</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.imagePicker} 
          onPress={pickAdditionalImages}
        >
          <Text>Pick Additional Images (Max 5)</Text>
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
          placeholder="Rate"
          keyboardType="numeric"
          placeholderTextColor="#888"  
          value={rate}
          onChangeText={setRate}
        />
        <TextInput
          style={styles.input}
          placeholder="Features-Comma Separated"
          value={features}
          placeholderTextColor="#888"  
          onChangeText={setFeatures}
        />
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
          placeholder="Number of Beds"
          keyboardType="numeric"
          placeholderTextColor="#888"  
          value={beds}
          onChangeText={setBeds}
        />
        <TextInput
          style={styles.input}
          placeholder="Number of Baths"
          keyboardType="numeric"
          placeholderTextColor="#888"  
          value={baths}
          onChangeText={setBaths}
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

        <View style={styles.switchContainer}>
          <Text>Listing Type: </Text>
          <Switch
            value={listingType === 'sale'}
            onValueChange={(value) => 
              setListingType(value ? 'sale' : 'rent')
            }
          />
          <Text>{listingType === 'sale' ? 'Sale' : 'Rent'}</Text>
        </View>

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={submitListing}
        >
          <Text style={styles.submitButtonText}>
            Submit Listing
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="AgentHome"  />
        <NavItem name="add" label="Add Listing" isActive />
        <NavItem name="cash" label="My Listings"  />
     
        <NavItem name="mail" label="Messages" />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',  // Make background transparent for gradient
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',  // Ensure text is readable on gradient background
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    color: '#000',
    placeholderTextColor: '#888', // Add this line to set placeholder color
  },bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    width:"100%",
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
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 200,
    resizeMode: 'cover',
  },
  additionalImagesPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  thumbnailImage: {
    width: 50,
    height: 50,
    margin: 5,
    resizeMode: 'cover',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddListingScreen;



// import React, { useState ,useEffect} from 'react';
// import { 
//   View, 
//   Text, 
//   TextInput, 
//   TouchableOpacity, 
//   ScrollView, 
//   Image, 
//   StyleSheet, 
//   Alert,
//   Platform,
//   Switch
// } from 'react-native';
// import { launchImageLibrary } from 'react-native-image-picker';
// import storage from '@react-native-firebase/storage';
// import firestore from '@react-native-firebase/firestore';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import uuid from 'react-native-uuid';
// import LinearGradient from 'react-native-linear-gradient';
// import { useNavigation } from '@react-navigation/native';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// const AddListingScreen = () => {
  
//     const [listingName, setListingName] = useState('');
//     const [location, setLocation] = useState('');
//     const [rate, setRate] = useState('');
//     const [squareFeet, setSquareFeet] = useState('');
//     const [beds, setBeds] = useState('');
//     const [baths, setBaths] = useState('');
//     const [features, setFeatures] = useState('');
//     const [description, setDescription] = useState('');
//     const [listingType, setListingType] = useState('rent');
    
//     const [displayImage, setDisplayImage] = useState(null);
//     const [additionalImages, setAdditionalImages] = useState([]);
//     const [isUploading, setIsUploading] = useState(false);
  
//     // ... (previous methods remain the same)

//     // Submit listing method
//     const submitListing = async () => {
//       // Validate required fields
//       if (!listingName || !location || !rate || !squareFeet || !beds || !baths) {
//         Alert.alert('Error', 'Please fill all required fields');
//         return;
//       }
  
//       // Prevent multiple submissions
//       if (isUploading) return;
  
//       try {
//         setIsUploading(true);
  
//         // Convert display image to base64
//         let displayImageBase64 = null;
//         if (displayImage) {
//           try {
//             displayImageBase64 = await convertImageToBase64(displayImage.uri);
//           } catch (convertError) {
//             console.error('Display image conversion failed:', convertError);
//             Alert.alert('Conversion Error', 'Failed to process display image');
//             return;
//           }
//         }
  
//         // Convert additional images to base64
//         const additionalImageBase64 = await Promise.all(
//           additionalImages.map(async (image) => {
//             try {
//               return await convertImageToBase64(image.uri);
//             } catch (convertError) {
//               console.error('Additional image conversion failed:', convertError);
//               return null;
//             }
//           })
//         );
  
//         // Filter out any failed conversions
//         const validAdditionalImages = additionalImageBase64.filter(img => img !== null);
  
//         // Retrieve agent ID from AsyncStorage
//         const agentId = await AsyncStorage.getItem('agentid');
  
//         // Prepare listing data
//         const listingData = {
//           name: listingName,
//           location,
//           rate: parseFloat(rate),
//           squareFeet: parseInt(squareFeet),
//           beds: parseInt(beds),
//           baths: parseFloat(baths),
//           features: features.split(',').map(f => f.trim()),
//           description,
//           type: listingType,
//           displayImage: {
//             base64: displayImageBase64,
//             metadata: {
//               originalName: displayImage?.fileName,
//               size: displayImage?.fileSize,
//               type: displayImage?.type
//             }
//           },
//           additionalImages: validAdditionalImages.map((base64, index) => ({
//             base64,
//             metadata: {
//               originalName: additionalImages[index]?.fileName,
//               size: additionalImages[index]?.fileSize,
//               type: additionalImages[index]?.type
//             }
//           })),
//           agentId: agentId,
//           createdAt: firestore.FieldValue.serverTimestamp()
//         };
  
//         // Submit to Firestore
//         await firestore().collection('listings').add(listingData);
  
//         // Reset form and show success message
//         resetForm();
//         Alert.alert('Success', 'Listing added successfully!');
//       } catch (error) {
//         console.error('Listing submission error:', error);
//         Alert.alert('Error', 'Failed to submit listing. Please try again.');
//       } finally {
//         setIsUploading(false);
//       }
//     };

//     // Reset form method
//     const resetForm = () => {
//       setListingName('');
//       setLocation('');
//       setRate('');
//       setSquareFeet('');
//       setBeds('');
//       setBaths('');
//       setFeatures('');
//       setDescription('');
//       setDisplayImage(null);
//       setAdditionalImages([]);
//     };

//     // ... (rest of the previous code remains the same)

//   return (
//     <LinearGradient
//       colors={['#c81d77', '#6710c2']}
//       style={styles.container}
//     >
//       <ScrollView style={styles.scrollView}>
//         <Text style={styles.title}>Add New Listing</Text>

//         {/* Previous image picker code remains the same */}

//         <TextInput
//           style={styles.input}
//           placeholder="Listing Name"
//           placeholderTextColor="#888"  
//           value={listingName}
//           onChangeText={setListingName}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Location"
//           placeholderTextColor="#888"  
//           value={location}
//           onChangeText={setLocation}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Rate"
//           keyboardType="numeric"
//           placeholderTextColor="#888"  
//           value={rate}
//           onChangeText={setRate}
//         />
        
//         {/* New input fields */}
//         <TextInput
//           style={styles.input}
//           placeholder="Square Feet"
//           keyboardType="numeric"
//           placeholderTextColor="#888"  
//           value={squareFeet}
//           onChangeText={setSquareFeet}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Number of Beds"
//           keyboardType="numeric"
//           placeholderTextColor="#888"  
//           value={beds}
//           onChangeText={setBeds}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Number of Baths"
//           keyboardType="numeric"
//           placeholderTextColor="#888"  
//           value={baths}
//           onChangeText={setBaths}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Features (Comma Separated)"
//           placeholderTextColor="#888"  
//           value={features}
//           onChangeText={setFeatures}
//         />
//         <TextInput
//           style={[styles.input, styles.multilineInput]}
//           placeholder="Description"
//           placeholderTextColor="#888"  
//           value={description}
//           onChangeText={setDescription}
//           multiline={true}
//           numberOfLines={4}
//         />

//         <View style={styles.switchContainer}>
//           <Text>Listing Type: </Text>
//           <Switch
//             value={listingType === 'sale'}
//             onValueChange={(value) => 
//               setListingType(value ? 'sale' : 'rent')
//             }
//           />
//           <Text>{listingType === 'sale' ? 'Sale' : 'Rent'}</Text>
//         </View>

//         <TouchableOpacity 
//           style={styles.submitButton} 
//           onPress={submitListing}
//         >
//           <Text style={styles.submitButtonText}>
//             Submit Listing
//           </Text>
//         </TouchableOpacity>
//       </ScrollView>
      
//       {/* Bottom navigation remains the same */}
//     </LinearGradient>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: 'transparent',  // Make background transparent for gradient
//   }, multilineInput: {
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     textAlign: 'center',
//     color: '#fff',  // Ensure text is readable on gradient background
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     padding: 10,
//     marginBottom: 10,
//     borderRadius: 5,
//     backgroundColor: 'white',
//     color: '#000',
//     placeholderTextColor: '#888', // Add this line to set placeholder color
//   },bottomNav: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//     paddingVertical: 10,
//     borderTopWidth: 1,
//     borderTopColor: '#E5E5EA',
//     shadowColor: '#000',
//     width:"100%",
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
    
//   },
//   navItem: { 
//     alignItems: 'center' 
//   },
//   navIconWrapper: {
//     position: 'relative',
//   },
//   navLabel: { 
//     fontSize: 12, 
//     color: '#8E8E93', 
//     marginTop: 4 
//   },
//   activeIndicator: {
//     position: 'absolute',
//     bottom: -4,
//     left: '50%',
//     marginLeft: -2,
//     width: 4,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: '#3A6073',
//   },
//   imagePicker: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     padding: 15,
//     marginBottom: 10,
//     borderRadius: 5,
//     alignItems: 'center',
//   },
//   imagePreview: {
//     width: 200,
//     height: 200,
//     resizeMode: 'cover',
//   },
//   additionalImagesPreview: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   thumbnailImage: {
//     width: 50,
//     height: 50,
//     margin: 5,
//     resizeMode: 'cover',
//   },
//   switchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginVertical: 10,
//   },
//   submitButton: {
//     backgroundColor: '#007bff',
//     padding: 15,
//     borderRadius: 5,
//     alignItems: 'center',
//   },
//   submitButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
// });

// export default AddListingScreen;
