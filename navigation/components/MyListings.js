import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StyleSheet,
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
const AgentListingsComponent = ({ navigation }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);
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
  const fetchListings = async () => {
    try {
      // Get agentId from AsyncStorage
      const agentId = await AsyncStorage.getItem('agentid');
      
      // Query Firestore for listings by this agent
      const listingsSnapshot = await firestore()
        .collection('listings')
        .where('agentId', '==', agentId)
        .get();
      
      const fetchedListings = listingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setListings(fetchedListings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setLoading(false);
    }
  };

  const handleCardPress = (listing) => {
    // Navigate to listing details or open modal
    navigation.navigate('ListingDetails', { listing });
  };

  const renderListingCard = ({ item: listing }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => handleCardPress(listing)}
    >
      {/* Listing Image */}
      {listing.imageBase64 && (
        <Image 
          source={{uri: `data:image/jpeg;base64,${listing.displayImage.base64}`}}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}

      {/* Listing Details */}
      <View style={styles.cardContent}>
        <Text style={styles.listingName}>{listing.name}</Text>
        <Image 
          source={{uri: `data:image/jpeg;base64,${listing.displayImage.base64}`}}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <Text style={styles.listingRate}>${listing.rate}/month</Text>
        
        <View style={styles.listingDetails}>
          <Text>{listing.beds} beds • {listing.baths} baths • {listing.squareFeet} sq ft</Text>
          <Text style={styles.locationText}>{listing.location}</Text>
        </View>

        {/* Features */}
        <Text style={styles.featuresText}>
          {listing.features.join(' • ')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : listings.length > 0 ? (
        <FlatList
          data={listings}
          renderItem={renderListingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Text style={styles.noListingsText}>No listings available</Text>
      )}
         <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="AgentHome"  />
        <NavItem name="add" label="Add Listing" />
        <NavItem name="cash" label="My Listings" isActive />
     
        <NavItem name="mail" label="Messages" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardContent: {
    padding: 15,
  },
  listingName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  listingRate: {
    fontSize: 16,
    color: '#007bff',
    marginBottom: 10,
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
  listingDetails: {
    marginBottom: 10,
  },
  locationText: {
    color: '#666',
    marginTop: 5,
  },
  featuresText: {
    color: '#888',
    fontStyle: 'italic',
  },
  noListingsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
});

export default AgentListingsComponent;