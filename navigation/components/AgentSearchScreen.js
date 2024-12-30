
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  SafeAreaView,
  Dimensions,
  Linking,
  Platform,
  TextInput,
  ActivityIndicator,
  BackHandler,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { NavigationContainer, useNavigation,DrawerActions } from '@react-navigation/native';
import firestore, { getFirestore } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Navigation } from 'lucide-react-native';
import Sidebar from './Sidebar';
import ListingDetailModal from './LIstingDetailMOdal';
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

const scale = (size) => (width / guidelineBaseWidth) * size;
const verticalScale = (size) => (height / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Device Dimensions
const { width, height } = Dimensions.get('window');
const CustomDrawerContent = (props) => {
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    email: ''
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userId = await AsyncStorage.getItem('userid');
        
        if (userId) {
          const userDoc = await firestore()
            .collection('users')
            .doc(userId)
            .get();
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            setUserInfo({
              fullName: userData.fullName || 'User',
              email: userData.email || 'user@example.com'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user information:', error);
      }
    };

    fetchUserInfo();
  }, []);}
// Main Agent Search Screen Component
const AgentSearchScreen = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [sortOption, setSortOption] = useState('Most Recommended');
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    city: ''
  });
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [categories, setCategories] = useState([]); // Categories fetched from Firestore
// Get Firestore instance

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const docSnap = await firestore()
            .collection('categories')
            .doc('YVIK6s36MqHTcZ83MAje')
            .get();
        if (docSnap.exists) {
          setCategories(docSnap.data().categories || []); // Get categories array
        } else {
          console.log('Document does not exist!');
        }
      } catch (error) {
        console.error('Error fetching Firestore document:', error);
      }
    };

    fetchCategories();
  }, []);
  useEffect(() => {
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to exit the app?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => BackHandler.exitApp() },
      ]);
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Retrieve user ID from AsyncStorage
        const userId = await AsyncStorage.getItem('userid');
        
        if (userId) {
          // Fetch user details from Firestore
          const userDoc = await firestore()
            .collection('users')
            .doc(userId)
            .get();
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            setUserInfo({
              fullName: userData.fullName || 'User',
              city: userData.city || 'Location'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user information:', error);
        // Fallback to default values if fetch fails
        setUserInfo({
          fullName: 'User',
          city: 'Location'
        });
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agentsCollection = await firestore().collection('agents').get();
        const fetchedAgents = agentsCollection.docs.map(doc => ({
          id: doc.id,
          zipcode: '', // Provide default empty string
          location_served: '',
          specializations: doc.data().specializations || [],
          ...doc.data()
        }));
        
        console.log('Fetched Agents:', fetchedAgents);  // Add this log
        
        setAgents(fetchedAgents);
        setFilteredAgents(fetchedAgents);
  
        setLoading(false);
      } catch (error) {
        console.error('Error fetching agents:', error);
        setLoading(false);
      }
    };
  
    fetchAgents();
  }, []);
  const handleSearch = (query) => {
    // Update the search query state
    setSearchQuery(query);
    console.log("Query:", query);
  
    // Only perform filtering if the query is at least 2 characters long
    if (query.length < 2) {
      setFilteredAgents(agents);
      return;
    }
  
    // Convert query to lowercase for case-insensitive search
    const lowercaseQuery = query.toLowerCase().trim();
    console.log("Lowercase Query:", lowercaseQuery);
  
    // Filter agents by multiple fields
    const filtered = agents.filter(agent => {
      console.log("Checking agent:", agent);
  
      // Check if query matches any element in the array fields
      const zipcodesMatch = (agent.zipcodes || []).some(zipcode => {
        console.log("Checking zipcode:", zipcode);
        return zipcode.toLowerCase().includes(lowercaseQuery);
      });
  
      const countiesMatch = (agent.counties || []).some(county => {
        console.log("Checking county:", county);
        return county.toLowerCase().includes(lowercaseQuery);
      });
  
      const statesMatch = (agent.states || []).some(state => {
        console.log("Checking state:", state);
        return state.toLowerCase().includes(lowercaseQuery);
      });
  
      // Handle other string fields
      const fullNameMatch = (agent.full_name || '').toLowerCase().includes(lowercaseQuery);
      const specializationMatch = (agent.specialization || '').toLowerCase().includes(lowercaseQuery);
  
      console.log({
        zipcodesMatch,
        countiesMatch,
        statesMatch,
        fullNameMatch,
        specializationMatch
      });
  
      // Return true if any field matches the query
      return (
        zipcodesMatch ||
        countiesMatch ||
        statesMatch ||
        fullNameMatch ||
        specializationMatch
      );
    });
  
    console.log("Filtered Agents:", filtered);
    setFilteredAgents(filtered);
  };
  
  
  const SearchHeader = ({ location, userName, onSearch, searchQuery }) => {
    const navigation = useNavigation();
    const [sidebarVisible, setSidebarVisible] = React.useState(false);
  
    const toggleSidebar = () => {
      setSidebarVisible(!sidebarVisible);
    };
  
    return (
      <LinearGradient
        colors={['#c81d77', '#6710c2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          {/* Profile Icon */}
          <TouchableOpacity
            style={styles.profileIconContainer}
            onPress={toggleSidebar}
          >
            <Ionicons name="person-outline" size={28} color="white" />
          </TouchableOpacity>
          <Sidebar
            visible={sidebarVisible}
            onClose={toggleSidebar}
            onMyOrders={() => {
              toggleSidebar();
              navigation.navigate('MyMeetings')
            }}
            onMyProfile={() => {
              toggleSidebar();
              navigation.navigate('Profile')
            }}
            onLogout={() => {
              toggleSidebar();
              navigation.navigate('AgentEntry')
              // Add your logout functionality here
            }}
          />
  
          {/* Left Section: Location and Greeting */}
          <View style={styles.headerLeftContainer}>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={20} color="#fff" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
            <Text style={styles.greetingText}>Hello, {userName}!</Text>
          </View>
  
          {/* Message Icon */}
          <TouchableOpacity
            style={styles.messageIconContainer}
            onPress={() => navigation.navigate('UserChatList')}
          >
            <Ionicons name="chatbubble-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRightContainer}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#4285F4"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Zipcode or Location"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={onSearch}
            />
          </View>
        </View>
      </LinearGradient>
    );
  };
  
  const AgentCard = ({ agent, onPress }) => (
    <TouchableOpacity style={styles.agentCard} onPress={onPress}>
      <View style={styles.agentCardContent}>
        <Image 
          source={{ uri: agent.profile_picture_url || 'https://via.placeholder.com/150' }} 
          style={styles.agentPhoto} 
          blurRadius={1}
        />
        <View style={styles.agentDetails}>
          <View style={styles.agentHeaderContainer}>
            <Text style={styles.agentName}>{agent.full_name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD833" />
              <Text style={styles.ratingText}>{agent.years_experience} yrs</Text>
            </View>
          </View>
          <Text style={styles.specialization}>
            {agent.specialization} Specialist 
          </Text>
          <Text style={styles.experienceText} numberOfLines={2}>
            {agent.personal_description}
          </Text>
          
          <LinearGradient
      colors={['#c81d77', '#6710c2']} // Gradient colors
      start={{ x: 0, y: 0 }} // Gradient start
      end={{ x: 1, y: 1 }}   // Gradient end
      style={styles.gradientWrapper} // Gradient container style
    >
      <TouchableOpacity style={styles.contactButton} onPress={onPress}>
        <Ionicons 
          name="chatbubble" 
          size={16} 
          color="white" 
          style={styles.contactButtonIcon} 
        />
        <Text style={styles.contactButtonText}>Contact Agent</Text>
      </TouchableOpacity>
    </LinearGradient>
        </View>
      </View>
    </TouchableOpacity>
  );
    // UseEffect for Filtering Agents
    useEffect(() => {
      let result = agents;
  
      // Filter by Specialization
      if (sortOption && sortOption !== 'Most Recommended') {
        result = result.filter(agent => 
          agent.specializations && 
          agent.specializations.includes(sortOption)
        );
      }
      console.log(searchQuery)
      // Apply Search Query
      if (searchQuery.length >= 2) {
        const lowercaseQuery = searchQuery.toLowerCase().trim();
        console.log("Lowercase Query:", lowercaseQuery);
      
        // Filter agents by multiple fields
        result = result.filter(agent => {
          console.log("Checking agent:", agent);
      
          // Check if query matches any element in the array fields
          const zipcodesMatch = (agent.zipcodes || []).some(zipcode => {
            console.log("Checking zipcode:", zipcode);
            return zipcode.toLowerCase().includes(lowercaseQuery);
          });
      
          const countiesMatch = (agent.counties || []).some(county => {
            console.log("Checking county:", county);
            return county.toLowerCase().includes(lowercaseQuery);
          });
      
          const statesMatch = (agent.states || []).some(state => {
            console.log("Checking state:", state);
            return state.toLowerCase().includes(lowercaseQuery);
          });
      
          // Handle other string fields
          const fullNameMatch = (agent.full_name || '').toLowerCase().includes(lowercaseQuery);
          const specializationMatch = (agent.specialization || '').toLowerCase().includes(lowercaseQuery);
      
          console.log({
            zipcodesMatch,
            countiesMatch,
            statesMatch,
            fullNameMatch,
            specializationMatch
          });
      
          // Return true if any field matches the query
          
          const specializations = (agent.specializations || [])
            .map(spec => spec.toLowerCase());
  
          return (
            zipcodesMatch ||
            countiesMatch ||
            statesMatch ||
            fullNameMatch ||
            specializationMatch ||
            specializations.some(spec => spec.includes(lowercaseQuery))
          );
        });
      }
  
      setFilteredAgents(result);
    }, [sortOption, searchQuery, agents]); 
  const AgentDetailModal = ({ agent, visible, onClose }) => {
    const [activeSection, setActiveSection] = useState('bio');
    const navigation = useNavigation();
    const [listings,setlistings] = useState(null)
    const [selectedListing, setSelectedListing] = useState(null); // State for selected listing
  const [listingModalVisible, setListingModalVisible] = useState(false);
    const handleDirectCall = () => {
      if (agent.phone_number) {
        Linking.openURL(`tel:${agent.phone_number}`);
      }
    };
    const handleCardPress = (listing) => {
      setSelectedListing(listing); // Set the selected listing data
      setListingModalVisible(true); // Open the ListingDetailModal
    };
  
    const closeListingModal = () => {
      setListingModalVisible(false);
      setSelectedListing(null);
    };
    useEffect(() => {
      const fetchAgentDetails = async () => {
        try {
          const agentDoc = await firestore()
            .collection('agents')
            .doc(agent.id)
            .get();
          const agentData = agentDoc.data();
  
          // Fetch Listings for this Agent
          const listingsSnapshot = await firestore()
            .collection('listings')
            .where('agentId', '==', agent.id)
            .get();
          const listings = listingsSnapshot.docs.map(doc => doc.data());
             console.log(listings)
          // Combine Agent Data with Listings
          setlistings(listings );
        } catch (error) {
          console.error('Error fetching agent details:', error);
        }
      };
  
      if (visible) {
        fetchAgentDetails();
      }
    }, [visible]);
    const handleEmailContact = async () => {
      const userId = await AsyncStorage.getItem('userid')
      navigation.navigate('ChatRoom', {
        agentId: agent.id,userId:userId // Pass agentId here
      });
    };
   
    const handleBookMeeting = () => {
      onClose();
      navigation.navigate('Meetings', { agentId: agent.id });
    };

    if (!agent) return null;
    
    
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={onClose}
      >
        <LinearGradient 
          colors={['#c81d77', '#6710c2']} 
          style={styles.modalGradientContainer}
        >
          <SafeAreaView style={styles.modalContainer}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.agentHeaderSection}>
              <View style={styles.agentPhotoBorder}>
                <Image 
                  source={{ uri: agent.profile_picture_url || 'https://via.placeholder.com/150' }} 
                  style={styles.largeAgentPhoto} 
                />
              </View>
              <Text style={styles.modalAgentName}>{agent.full_name}</Text>
              <Text style={styles.modalAgentSubtitle}>
                {agent.specialization} Specialist | {agent.location_served}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.ratingText}>{agent.years_experience} Years Experience</Text>
              </View>
            </View>

            <View style={styles.navigationTabs}>
              {['Bio', 'Details', 'Listings'].map((section) => (
                <TouchableOpacity 
                  key={section.toLowerCase()} 
                  style={[
                    styles.navigationTab, 
                    activeSection === section.toLowerCase() && styles.activeNavigationTab
                  ]}
                  onPress={() => setActiveSection(section.toLowerCase())}
                >
                  <Text style={[
                    styles.navigationTabText,
                    activeSection === section.toLowerCase() && styles.activeNavigationTabText
                  ]}>
                    {section}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {activeSection === 'bio' && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Professional Bio</Text>
                  <Text style={styles.sectionContent}>{agent.personal_description}</Text>
                </View>
              )}

              {activeSection === 'details' && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Professional Details</Text>
                  <View style={styles.credentialItem}>
                    <Ionicons name="business" size={16} color="#FFD700" />
                    <Text style={styles.credentialText}>Agency: {agent.agency_name}</Text>
                  </View>
                  <View style={styles.credentialItem}>
                    <Ionicons name="location" size={16} color="#FFD700" />
                    <Text style={styles.credentialText}>States Served: {agent.states && agent.states.length > 0 
    ? agent.states.join(', ') 
    : 'No states specified'}</Text>
                  </View>
                  <View style={styles.credentialItem}>
                    <Ionicons name="location" size={16} color="#FFD700" />
                    <Text style={styles.credentialText}>
  Counties Served: {agent.counties && agent.counties.length > 0 
    ? agent.counties.join(', ') 
    : 'No counties specified'}
</Text>
                  </View>
                  <View style={styles.credentialItem}>
                    <Ionicons name="location" size={16} color="#FFD700" />
                    <Text style={styles.credentialText}>ZipCodes: {agent.zipcodes && agent.zipcodes.length > 0 
    ? agent.zipcodes.join(', ') 
    : 'No zipcodes specified'} </Text>
                  </View>
                  <View style={styles.credentialItem}>
                    <Ionicons name="cash" size={16} color="#FFD700" />
                    <Text style={styles.credentialText}>Commission Rate: {agent.commission_rate}%</Text>
                  </View>
                  <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Contact Information</Text>
                  <View style={styles.credentialItem}>
                    <Ionicons name="call" size={16} color="#FFD700" />
                    <Text style={styles.credentialText}>{agent.phone_number}</Text>
                  </View>
                  <View style={styles.credentialItem}>
                    <Ionicons name="mail" size={16} color="#FFD700" />
                    <Text style={styles.credentialText}>{agent.email}</Text>
                  </View>
                </View>
                </View>
              )}

{activeSection === 'listings' && (
  <View style={styles.detailSection}>
    <Text style={styles.sectionTitle}>Listings</Text>
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listingsContainer}
    >
      {console.log('Current listings state:', listings)}
      {listings && listings.length > 0 ? (
        listings.map((listing, index) => (
          
             <TouchableOpacity
                      key={index}
                      style={styles.card}
                      onPress={() => handleCardPress(listing)} // Open modal on card press
                    >
            {/* Render Base64 Image */}
            <Image
              source={{ uri: `data:image/jpeg;base64,${listing.displayImage.base64}` }}
              style={styles.cardImage}
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardPrice}>${listing.rate}/month</Text>
              <Text style={styles.cardDetails}>
                {listing.beds} beds • {listing.baths} baths • {listing.squareFeet} sq ft
              </Text>
              <Text style={styles.cardAddress}>{listing.location}</Text>
              <Text style={styles.cardName}>{listing.name}</Text>
              <Text style={styles.cardExtras}>
                {listing.features.join(' • ')}
              </Text>
            </View>
         </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.noListingsText}>No listings available.</Text>
      )}
    </ScrollView>
  </View>
)}
            </ScrollView>

            <View style={styles.contactMethodsContainer2}>
      {(activeSection === 'bio' || activeSection ==='details' )&&
      <LinearGradient
        colors={['#c81d77', '#6710c2']} // Gradient colors
        start={{ x: 0, y: 0 }} // Gradient start
        end={{ x: 0, y: 1 }}   // Gradient end
        style={styles.gradientWrapper} // Gradient container style
      >
        <TouchableOpacity
          style={styles.bookMeetingButton}
          onPress={handleBookMeeting}
        >
          <Ionicons name="calendar" size={20} color="white" />
          <Text style={styles.bookMeetingButtonText}>Book Meeting</Text>
        </TouchableOpacity>
      </LinearGradient>}
     
      
       
      {(activeSection === 'bio' || activeSection ==='details') &&
        <LinearGradient
          colors={['#6d90b9', '#bbc7dc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientWrapper}
        >
          <TouchableOpacity style={styles.callButton} onPress={handleEmailContact}>
      <Ionicons name="mail" size={20} color="white" style={styles.callButtonIcon} />
      <Text style={styles.callButtonText}>Send a Message</Text>
    </TouchableOpacity>
        </LinearGradient>}
      </View>
 
          </SafeAreaView>
        </LinearGradient>
        {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          visible={listingModalVisible}
          onClose={closeListingModal}
        />
      )}
      </Modal>
    );
  };

  
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchHeader location={userInfo.city} userName={userInfo.fullName}  onSearch={handleSearch}  // Pass the handleSearch method
        searchQuery={searchQuery}  />
      <Text style={styles.screenTitle}>Find Your Expert Agent</Text>
      
      <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.sortContainer}
      contentInset={{ right: 20 }} 
    >
      {categories.map((option) => (
        sortOption === option ? (
          <LinearGradient
            key={option}
            colors={['#c81d77', '#6710c2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientWrapper}
          >
            <TouchableOpacity
              style={styles.gradientTouchable}
              onPress={() => setSortOption(option)}
            >
              <Text style={[styles.sortOptionText, styles.activeSortOptionText]}>
                {option}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <TouchableOpacity
            key={option}
            style={styles.sortOption}
            onPress={() => setSortOption(option)}
          >
            <Text style={styles.sortOptionText}>{option}</Text>
          </TouchableOpacity>
        )
      ))}
      {console.log("Filteredddd",filteredAgents)}
    </ScrollView>
      {filteredAgents.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No agents found matching your search</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.agentListContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredAgents.map((agent) => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              onPress={() => setSelectedAgent(agent)}
            />
          ))}
        </ScrollView>
      )}

      <AgentDetailModal 
        agent={selectedAgent} 
        visible={!!selectedAgent} 
        onClose={() => setSelectedAgent(null)} 
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    paddingTop: Platform.OS === 'ios' ? height * 0.05 : height * 0.02,
  },  messageIconContainer: {
    position: 'absolute',
    right:-60,
  
    top: 6,
    padding: 5
  },
  screenTitle: {
    fontSize: width * 0.06,
    fontWeight: '700',
    paddingHorizontal: width * 0.05,
    marginVertical: height * 0.01,
    marginBottom: height * 0.01,
    color: '#2C3E50',
  },

  filtersContainer: {
    paddingHorizontal: width * 0.02,
    marginBottom: height * 0.02,
  },  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 20,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.1,
  },
  
  noResultsText: {
    fontSize: width * 0.045,
    color: '#888',
    textAlign: 'center',
  },
  
  // Agent List Container
  agentListContainer: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
  },
  headerTitleContainer: {
    flexDirection:'column',
    marginBottom: height * 0.02,
  },
  headerLeftContainer: {
    flex: 1,
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },  lowerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out the buttons
    width: '80%',
    marginTop:10
  },
  locationText: {
    fontFamily: 'monospace',
    color: '#fff',
    fontSize: 19,
    marginLeft: 5, // Add some spacing between the icon and the text
  },
  listingsContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 10,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardDetails: {
    fontSize: 14,
    color: '#666',
  },
  cardAddress: {
    fontSize: 12,
    color: '#444',
    marginVertical: 5,
  },
  cardExtras: {
    fontSize: 12,
    color: '#777',
  },
  noListingsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
  },
  headerContent: {
    flexDirection: 'row', // Arrange items in a row
    justifyContent: 'space-between', // Space out items (left and right alignment)
    alignItems: 'center', 
    marginRight:70// Vertically center items
  },
 
  logoutButton: {
    backgroundColor: '##0b86bf', // A red color to signify logout
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: width * 0.04,
    fontWeight: '700',
  },

  filterChip: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    borderRadius: 25,
    marginHorizontal: width * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
 
  filterIcon: {
    marginRight: width * 0.02,
  },  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  filterChipText: {
    color: '#2C3E50',
    fontSize: width * 0.035,
  },
 
  sortContainer: {
    paddingHorizontal: width * 0.04,
    height: height * 0.07, // Fixed height for the entire sort container
    flexDirection: 'row',
    alignItems: 'center', // Vertically center the buttons
    overflow: 'hidden', // Prevent any content from spilling out
  },
  sortOption: {
    height: height * 0.05, // Fixed height for sort options
    minWidth: width * 0.25, // Minimum width to prevent text from causing size changes
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    paddingHorizontal: width * 0.04,
    marginRight: width * 0.02,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  
  // Category/Sort Option Styles
 drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    alignItems: 'center',
    paddingVertical: height * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  drawerProfileImage: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
    marginBottom: height * 0.02,
  },
  drawerUserName: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: '700',
  },
  drawerUserEmail: {
    color: 'white',
    fontSize: width * 0.035,
    opacity: 0.8,
  },
  drawerLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.02,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  drawerLogoutText: {
    color: 'white',
    marginLeft: width * 0.02,
    fontSize: width * 0.04,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  placeholderText: {
    fontSize: width * 0.05,
    color: '#2C3E50',
  },

  gradientWrapper: {
    marginRight: width * 0.02,
    borderRadius: 20,
    overflow: 'hidden',
  },
  
  gradientTouchable: {
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Text Styles
  sortOptionText: {
    fontSize: width * 0.035,
    color: '#333',
    fontWeight: '500',
  },
  
  activeSortOptionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  sortOptionText: {
    fontSize: 20,
    color: '#333',
   

  },
  activeSortOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  agentCard: {
    width: width * 0.92,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: height * 0.02,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 2 
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: width * 0.04,
  },
     headerRightContainer: {
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 10,
    height: 40,
  },
  profileIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)', // Translucent white background
    borderRadius: 25,
    padding: width * 0.025,
    marginLeft: width * 0.03,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentCardContent: {
    flexDirection: 'row',
    padding: width * 0.04,
    alignItems: 'center',
  },
  agentPhoto: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    marginRight: width * 0.04,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  agentDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  agentHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },
  agentName: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#2C3E50',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: width * 0.01,
    fontSize: width * 0.035,
    color: '#2C3E50',
  },
  specialization: {
    fontSize: width * 0.035,
    color: '#7F8C8D',
    marginBottom: height * 0.005,
  },
  experienceText: {
    fontSize: width * 0.035,
    color: '#34495E',
    marginBottom: height * 0.01,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  contactButtonIcon: {
    marginRight: 8,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalGradientContainer: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? height * 0.05 : height * 0.03,
    right: width * 0.05,
    zIndex: 10,
  },greetingText: {
    fontFamily:'Courier New',
    fontSize: width * 0.04,
    color: 'white',
    fontWeight: '500',
    marginLeft:4
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agentHeaderSection: {
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  agentPhotoBorder: {
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: width * 0.25,
    padding: 5,
    marginBottom: height * 0.01,
  },
  largeAgentPhoto: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
  },
  modalAgentName: {
    fontSize: width * 0.05,
    fontWeight: '700',
    color: 'white',
    marginBottom: height * 0.005,
  },
  modalAgentSubtitle: {
    fontSize: width * 0.035,
    color: 'white',
    opacity: 0.8,
    marginBottom: height * 0.01,
  },
  navigationTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  navigationTab: {
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
  },
  activeNavigationTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'white',
  },
  navigationTabText: {
    color: 'white',
    opacity: 0.6,
    fontSize: width * 0.035,
  },
  activeNavigationTabText: {
    opacity: 1,
    fontWeight: '700',
  },
  modalScrollContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
  },  bookMeetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20, // Larger padding for a bigger button
    paddingHorizontal: 40,
    borderRadius: 10,
    
    width: '100%', // Make sure the gradient covers the entire button
  },
  bookMeetingButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight:40,
    marginBottom:5
  },
  contactMethodsContainer2: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom:10
  },
  contactMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping for more buttons
    justifyContent: 'space-around',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  detailSection: {
    marginBottom: height * 0.02,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: 'white',
    marginBottom: height * 0.01,
  },
  sectionContent: {
    color: 'white',
    fontSize: width * 0.035,
    lineHeight: width * 0.05,
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },
  credentialText: {
    color: 'white',
    fontSize: width * 0.035,
    marginLeft: width * 0.02,
  },
  experienceText: {
    color: 'white',
    fontSize: width * 0.035,
    marginTop: height * 0.01,
  },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: width * 0.04,
    marginBottom: height * 0.02,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },
  reviewAuthor: {
    color: 'white',
    fontSize: width * 0.035,
    fontWeight: '600',
  },
  reviewRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    color: 'white',
    marginLeft: width * 0.01,
    fontSize: width * 0.035,
  },
  reviewText: {
    color: 'white',
    fontSize: width * 0.035,
    fontStyle: 'italic',
  },
  contactMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  meetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  meetingButtonIcon: {
    marginRight: 8,
  },
  meetingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop:1
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  callButtonIcon: {
    marginRight: 8,
  },
  callButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  });
  const Drawer = createDrawerNavigator();

const AgentSearchWithDrawer = () => {
  return (
    <NavigationContainer>
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#4A90E2',
        drawerInactiveTintColor: '#34495E',
        drawerStyle: {
          backgroundColor: 'transparent',
          width: width * 0.75,
        },
      }}
    >
      <Drawer.Screen 
        name="AgentSearch" 
        component={AgentSearchScreen} 
        options={{
          drawerLabel: 'Agent Search',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="search-outline" color={color} size={size} />
          )
        }}
      />
      <Drawer.Screen 
        name="MyProfile" 
        component={MyProfileScreen} 
        options={{
          drawerLabel: 'My Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          )
        }}
      />
      <Drawer.Screen 
        name="MyMeetings" 
        component={MyMeetingsScreen} 
        options={{
          drawerLabel: 'My Meetings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          )
        }}
      />
    </Drawer.Navigator>
    </NavigationContainer>
  );
};

// Placeholder Screens (you'll need to implement these)
const MyProfileScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>My Profile Screen</Text>
  </View>
);
  export default AgentSearchScreen
