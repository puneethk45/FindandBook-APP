import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AgentListingsComponent = ({ navigation }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const agentId = await AsyncStorage.getItem('agentid');
      const listingsSnapshot = await firestore()
        .collection('listings')
        .where('agentId', '==', agentId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const fetchedListings = listingsSnapshot.docs.map(doc => ({
        id: doc.id,  // Ensure each document has a unique ID
        ...doc.data(),
        status: doc.data().status || 'Active'
      }));

      setListings(fetchedListings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setLoading(false);
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
 const handleDelete = (listingId) => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this listing?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore()
                .collection('listings')
                .doc(listingId)
                .delete();
              
              // Update local state to remove the deleted listing
              setListings(listings.filter(listing => listing.id !== listingId));
              Alert.alert("Success", "Listing deleted successfully");
            } catch (error) {
              console.error('Error deleting listing:', error);
              Alert.alert("Error", "Failed to delete listing");
            }
          }
        }
      ]
    );
  };

  const handleEdit = (listing) => {
    
    navigation.navigate('EditListing', { listingId: listing.id });
  };
  const filteredListings = listings.filter(listing => {
    if (activeFilter === 'All') return true;
    return listing.listingType === activeFilter;
  });
  const handleDuplicateListing = async (listing) => {
    try {
      // Remove the id from the listing data before creating a duplicate
      const { id, createdAt, ...listingData } = listing;
      
      // Create a new listing document with the cleaned data
      const newListing = await firestore()
        .collection('listings')
        .add({
          ...listingData,
          createdAt: firestore.FieldValue.serverTimestamp()
        });

      // Fetch the new document to ensure we have all the correct data
      const newDoc = await firestore()
        .collection('listings')
        .doc(newListing.id)
        .get();

      // Get the new listing data with the new ID
      const newListingData = {
        id: newListing.id,
        ...newDoc.data()
      };

      // Update the local state to include the new listing
      setListings(prevListings => [newListingData, ...prevListings]);

      Alert.alert("Success", "Listing duplicated successfully!");
    } catch (error) {
      console.error('Error duplicating listing:', error);
      Alert.alert("Error", "Failed to duplicate listing");
    }
  };
  const handleStatusToggle = async (listingId, newStatus) => {
    try {
      await firestore()
        .collection('listings')
        .doc(listingId)
        .update({
          status: newStatus
        });

      // Update local state
      setListings(listings.map(listing => 
        listing.id === listingId 
          ? { ...listing, status: newStatus }
          : listing
      ));

      Alert.alert("Success", `Listing marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating listing status:', error);
      Alert.alert("Error", "Failed to update listing status");
    }
  };

  const FilterToggle = () => (
    <View style={styles.filterContainer}>
      {['All', 'Sale', 'Rent'].map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            activeFilter === filter && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter(filter)}
        >
          <Text style={[
            styles.filterText,
            activeFilter === filter && styles.activeFilterText
          ]}>
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderListingCard = ({ item: listing }) => (
    <View style={[
      styles.card,
      listing.status !== 'Active' && styles.inactiveCard
    ]}>
      {listing.displayImage && (
        <Image 
          source={{uri: `data:image/jpeg;base64,${listing.displayImage}`}}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.cardContent}>
        <Text style={styles.listingName}>{listing.name}</Text>
        <Text style={styles.listingRate}>${listing.price}/month</Text>
        
        <View style={styles.listingDetails}>
          <Text>{listing.bedrooms} beds • {listing.bathrooms} baths • {listing.squareFeet} sq ft</Text>
          <Text style={styles.locationText}>{listing.location}</Text>
        </View>

        <Text style={styles.featuresText}>
          {listing.features.join(' • ')}
        </Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>
            {listing.status === 'Active' ? 'Active' : 
              listing.listingType === 'Sale' ? 'Sold' : 'Rented'}
          </Text>
          <Switch
            value={listing.status === 'Active'}
            onValueChange={(value) => {
              const newStatus = value ? 'Active' : 
                (listing.listingType === 'Sale' ? 'Sold' : 'Rented');
              handleStatusToggle(listing.id, newStatus);
            }}
          />
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(listing)}
          >
            <Ionicons name="pencil" size={20} color="white" />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(listing.id)}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.duplicateButton]}
            onPress={() => handleDuplicateListing(listing)}
          >
            <Ionicons name="copy" size={20} color="white" />
            <Text style={styles.buttonText}>Duplicate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FilterToggle />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : filteredListings.length > 0 ? (
        <FlatList
          data={filteredListings}
          renderItem={renderListingCard}
          keyExtractor={item => `listing-${item.id}`}
          contentContainerStyle={styles.listContainer}
          extraData={listings}
        />
      ) : (
        <Text style={styles.noListingsText}>No listings available</Text>
      )}
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Add Listing')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.fabText}>Add Listing</Text>
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="AgentHome" />
        <NavItem name="cash" label="My Listings" isActive />
        <NavItem name="mail" label="FeedBack" />
        <NavItem name="chatbubble" label="Messages" />
        <NavItem name="person" label="Profile" />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop:30
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    flex: 0.3,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  duplicateButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '500',
    fontSize: 12,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '500',
  },
 
  listContainer: {
    padding: 10,
    paddingBottom: 80, // Add padding to account for bottom navigation
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
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    width: '100%',
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
  }, fab: {
    flexDirection: 'row',  // Icon and text in a row
    position: 'absolute',
    right: 20,
    bottom: 80,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    zIndex: 1,
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,  // Space between icon and text
    fontWeight: '600',
  },
  listContainer: {
    padding: 10,
    paddingBottom: 100, // Increased padding to account for FAB and bottom navigation
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#4f46e5',
  },
  filterText: {
    color: '#666',
    fontWeight: '600',
  },
  activeFilterText: {
    color: 'white',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  inactiveCard: {
    opacity: 0.5,
  },
});

export default AgentListingsComponent;