import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  Dimensions,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

const { width, height } = Dimensions.get('window');
const COLORS = {
  primary: '#1A2B3C',
  secondary: '#2C3E50',
  accent: '#4A90E2',
  background: '#F4F7FA',
  text: '#1A2B3C',
  white: '#FFFFFF',
  gray: '#A0AEC0',
  lightGray: '#E6EAF0'
};

const PostMeetingInteraction = () => {
  const route = useRoute();
  const { agentId } = route.params || {};
  const navigation = useNavigation();

  const handleNavigation = (route, params = {}) => {
    navigation.navigate(route, params);
  };
  const [agentData, setAgentData] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);


 
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!agentId) {
        Alert.alert('Error', 'No agent ID provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch agent details from Firestore
        const agentDoc = await firestore()
          .collection('agents')
          .doc(agentId)
          .get();

        if (agentDoc.exists) {
          const agent = agentDoc.data();
          
          // Fetch agent avatar from Firebase Storage if profile_picture_url is null
          let avatarUrl = null;
          if (agent.profile_picture_url) {
            avatarUrl = agent.profile_picture_url;
          } else {
            try {
              avatarUrl = await storage().ref('doctor.png').getDownloadURL();
            } catch (storageError) {
              console.log('Default avatar not found:', storageError);
            }
          }

          // Fetch similar properties
          const propertiesSnapshot = await firestore()
            .collection('properties')
            .where('agentId', '==', agentId)
            .limit(2)
            .get();

          const properties = await Promise.all(
            propertiesSnapshot.docs.map(async (doc) => {
              const propertyData = doc.data();
              return {
                id: doc.id,
                ...propertyData,
                image: propertyData.imageUrl 
                  ? { uri: propertyData.imageUrl } 
                  : require('../assets/property2.png')
              };
            })
          );

          setAgentData({
            ...agent,
            avatar: avatarUrl ? { uri: avatarUrl } : require('../assets/doctor.png'),
            // Transform data to match UI expectations
            name: agent.full_name,
            role: `${agent.specialization} Agent`,
            specialties: [
              `${agent.years_experience} Years Experience`,
              `${agent.commission_rate}% Commission`
            ]
          });
          setSimilarProperties(properties);
        } else {
          Alert.alert('Error', 'Agent not found');
        }
      } catch (error) {
        console.error('Error fetching agent data:', error);
        Alert.alert('Error', 'Failed to load agent information');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [agentId]);

  // Star Rating Component
  const StarRating = () => {


    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            onPress={() => setRating(star)}
            style={styles.starTouch}
          >
            <Ionicons 
              name={star <= rating ? "star" : "star-outline"}
              size={40} 
              color={star <= rating ? COLORS.accent : COLORS.gray} 
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Property Card Component
  const PropertyCard = ({ property }) => {
    return (
      <TouchableOpacity style={styles.propertyCard}>
        <Image 
          source={property.image} 
          style={styles.propertyImage}
          resizeMode="cover"
        />
        <View style={styles.propertyDetails}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {property.title || 'Property Listing'}
          </Text>
          <Text style={styles.propertyPrice}>
            {property.price || 'Price Not Available'}
          </Text>
          <Text style={styles.propertyFeatures}>
            {property.features || 'No features listed'}
          </Text>
        </View>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons 
            name="heart-outline" 
            size={24} 
            color={COLORS.accent} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Loading agent details...</Text>
      </View>
    );
  }

  // No agent found
  if (!agentData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>No agent information available</Text>
      </View>
    );
  }

  return (
    <LinearGradient 
      colors={[COLORS.background, COLORS.white]} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Agent Profile Section */}
          <View style={styles.agentProfileSection}>
            <View style={styles.agentHeader}>
              <View style={styles.avatarContainer}>
                <Image 
                  source={agentData.avatar} 
                  style={styles.agentAvatar} 
                  resizeMode="cover"
                />
              </View>
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{agentData.name}</Text>
                <Text style={styles.agentRole}>{agentData.role}</Text>
                <View style={styles.specialtiesContainer}>
                  {agentData.specialties.map((specialty, index) => (
                    <View key={index} style={styles.specialtyBadge}>
                      <Text style={styles.specialtyText}>{specialty}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Additional Agent Details Section */}
          <View style={styles.additionalDetailsSection}>
            <Text style={styles.additionalDetailsTitle}>Contact Information</Text>
            <View style={styles.detailRow}>
              <Ionicons name="mail" size={20} color={COLORS.accent} />
              <Text style={styles.detailText}>{agentData.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="call" size={20} color={COLORS.accent} />
              <Text style={styles.detailText}>{agentData.phone_number}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color={COLORS.accent} />
              <Text style={styles.detailText}>{agentData.location_served}</Text>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Rate Your Interaction</Text>
            <Text style={styles.ratingSubtitle}>
              How was your meeting with {agentData.name}?
            </Text>
            <StarRating />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
      {[
        { 
          icon: 'list', 
          text: 'Browse Properties',
          gradient: ['#4A90E2', '#5B7DB1'],
          route: 'PropertiesScreen' // Replace with your screen name
        },
        { 
          icon: 'heart', 
          text: 'Contact Agent',
          gradient: ['#E25B5B', '#C0392B'],
          route: 'ContactAgentScreen' // Replace with your screen name
        },
        { 
          icon: 'calendar', 
          text: 'Schedule Another Meeting',
          gradient: ['#48C9B0', '#27AE60'],
          route: 'Meetings', // Replace with your screen name
          params: { agentId } // Passing agentId as a parameter
        }
      ].map((action, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.actionButton}
          onPress={() => handleNavigation(action.route, action.params)}
        >
          <LinearGradient
            colors={action.gradient}
            style={styles.actionButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons 
              name={action.icon} 
              size={24} 
              color={COLORS.white} 
            />
            <Text style={styles.actionButtonText}>
              {action.text}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>

          {/* Similar Properties Section */}
          {similarProperties.length > 0 && (
            <View style={styles.similarPropertiesSection}>
              <Text style={styles.sectionTitle}>Similar Properties</Text>
              {similarProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  agentProfileSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    borderWidth: 3,
    borderColor: '#4A90E2',
    borderRadius: 45,
    padding: 4,
    marginRight: 15,
  },
  agentAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2B3C',
  },
  agentRole: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  specialtiesContainer: {
    flexDirection: 'row',
  },
  specialtyBadge: {
    backgroundColor: '#E6EAF0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
  },
  specialtyText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  ratingSection: {
    padding: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2B3C',
    marginBottom: 10,
  },
  ratingSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 15,
    textAlign: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  starTouch: {
    marginHorizontal: 5,
    padding: 5,
  },
  actionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  actionButton: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  additionalDetailsSection: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginTop: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  additionalDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.secondary,
  },

  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 16,
  },
  similarPropertiesSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  propertyCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  propertyImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  propertyDetails: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  propertyPrice: {
    fontSize: 16,
    color: '#4A90E2',
    marginVertical: 5,
  },
  propertyFeatures: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  favoriteButton: {
    padding: 10,
  }
});

export default PostMeetingInteraction;