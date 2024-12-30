import React from 'react';
import { Modal, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Correct import
import LinearGradient from 'react-native-linear-gradient';

const ListingDetailModal = ({ listing, visible, onClose }) => {
  if (!listing) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <LinearGradient colors={['#ffffff', '#f5f5f5']} style={{ flex: 1 }}>
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="black" />
            </TouchableOpacity>
            
          </View>

          <Image
            source={{uri: `data:image/jpeg;base64,${listing.displayImage.base64}`  }}
            style={styles.listingImage}
          />
           <Text style={styles.title}> About this home</Text>
           <Text>  {listing.description}</Text>

          <View style={styles.priceSection}>
            <Text style={styles.price}>${listing.rate}</Text>
            <Text style={styles.address}>{listing.location}</Text>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.subtitle}>Property Details</Text>
            <View style={styles.detailItem}>
              <Ionicons name="bed" size={18} color="#333" />
              <Text style={styles.detailText}>{listing.beds} beds</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="water" size={18} color="#333" />
              <Text style={styles.detailText}>{listing.baths} baths</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="expand" size={18} color="#333" />
              <Text style={styles.detailText}>{listing.squareFeet} sq ft</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={18} color="#333" />
              <Text style={styles.detailText}>Built in {listing.year_built || 2020}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={18} color="#333" />
              <Text style={styles.detailText}>HOA Fee: ${listing.hoa_fee || 1000}/month</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.requestButton}>
              <LinearGradient
                colors={['#c81d77', '#6710c2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Text style={styles.requestText}>Request Showing</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
};
const styles = {
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      backgroundColor: '#f5f5f5',
    },
    closeButton: {
      padding: 5,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
    },
    listingImage: {
      width: '100%',
      height: 220,
    },
    priceSection: {
      padding: 15,
      backgroundColor: '#fff',
    },
    price: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#c81d77',
    },
    address: {
      fontSize: 16,
      color: '#555',
      marginTop: 5,
    },
    detailsSection: {
      padding: 15,
      backgroundColor: '#fff',
    },
    subtitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 5,
    },
    detailText: {
      fontSize: 16,
      marginLeft: 10,
      color: '#333',
    },
    buttonContainer: {
      padding: 20,
      alignItems: 'center',
    },
    requestButton: {
      width: '100%',
      borderRadius: 8,
      overflow: 'hidden',
    },
    gradientButton: {
      padding: 15,
      alignItems: 'center',
    },
    requestText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
  };
export default ListingDetailModal;
