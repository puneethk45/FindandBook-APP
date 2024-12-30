import React from 'react';
import { Modal, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const ListingDetailModal = ({ listing, visible, onClose }) => {
  if (!listing) return null;

  const renderPropertySpecificDetails = () => {
    switch (listing.propertySubType) {
      case 'plot':
        return (
          <>
            <View style={styles.detailItem}>
              <Ionicons name="square" size={18} color="#333" />
              <Text style={styles.detailText}>Length: {listing.length} ft</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="square" size={18} color="#333" />
              <Text style={styles.detailText}>Breadth: {listing.breadth} ft</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="resize" size={18} color="#333" />
              <Text style={styles.detailText}>Plot Area: {listing.plotArea} sq ft</Text>
            </View>
          </>
        );

      case 'house':
      case 'flat':
      case 'apartment':
        return (
          <>
            <View style={styles.detailItem}>
              <Ionicons name="bed" size={18} color="#333" />
              <Text style={styles.detailText}>{listing.bedrooms} Bedrooms</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="water" size={18} color="#333" />
              <Text style={styles.detailText}>{listing.bathrooms} Bathrooms</Text>
            </View>
          </>
        );

      case 'office':
        return (
          <>
            <View style={styles.detailItem}>
              <Ionicons name="business" size={18} color="#333" />
              <Text style={styles.detailText}>Total Floors: {listing.totalFloors}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="layers" size={18} color="#333" />
              <Text style={styles.detailText}>Floor Number: {listing.selectedFloor}</Text>
            </View>
          </>
        );

      case 'warehouse':
        return (
          <View style={styles.detailItem}>
            <Ionicons name="time" size={18} color="#333" />
            <Text style={styles.detailText}>Property Age: {listing.propertyAge} years</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <LinearGradient colors={['#1a237e', '#0d47a1']} style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{listing.name}</Text>
          </View>

          <View style={styles.contentContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${listing.displayImage}` }}
              style={styles.mainImage}
            />

            {listing.additionalImages && listing.additionalImages.length > 0 && (
              <ScrollView horizontal style={styles.additionalImagesContainer}>
                {listing.additionalImages.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: `data:image/jpeg;base64,${image}` }}
                    style={styles.thumbnailImage}
                  />
                ))}
              </ScrollView>
            )}

            <View style={styles.priceSection}>
              <Text style={styles.price}>${listing.price?.toLocaleString()}</Text>
              <Text style={styles.location}>{listing.location}</Text>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Property Details</Text>
              
              <View style={styles.detailItem}>
                <Ionicons name="home" size={18} color="#333" />
                <Text style={styles.detailText}>
                  Type: {listing.propertySubType.charAt(0).toUpperCase() + listing.propertySubType.slice(1)}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="expand" size={18} color="#333" />
                <Text style={styles.detailText}>{listing.squareFeet} sq ft</Text>
              </View>

              {renderPropertySpecificDetails()}
            </View>

            {listing.features && listing.features.length > 0 && (
              <View style={styles.featuresSection}>
                <Text style={styles.sectionTitle}>Features</Text>
                {listing.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#1a237e" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'transparent',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  contentContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  mainImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  additionalImagesContainer: {
    padding: 10,
  },
  thumbnailImage: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 8,
  },
  priceSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  detailsSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  featuresSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  descriptionSection: {
    padding: 15,
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
};

export default ListingDetailModal;