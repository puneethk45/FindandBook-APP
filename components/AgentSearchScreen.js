
import React, { useState, useEffect, memo,useRef } from 'react';
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
// Add this import at the top
import { debounce } from 'lodash'; 
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
      if (searchQuery) {
        // Reset the search query and navigate to the home page
        setSearchQuery('');
        console.log('Resetting search query and returning to home.');
      } else {
        Alert.alert('Hold on!', 'Are you sure you want to exit the app?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', onPress: () => BackHandler.exitApp() },
        ]);
      }
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [searchQuery]); 
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
  const [searchInput, setSearchInput] = useState('');
  

  // Add debouncing for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const agentsRef = useRef([]); // Add this to store agents data

  // Optimized fetch effect
  useEffect(() => {
    let isMounted = true;

    const fetchAgents = async () => {
      try {
        const agentsCollection = await firestore().collection('agents').get();
        const fetchedAgents = agentsCollection.docs.map(doc => ({
          id: doc.id,
          zipcode: '',
          location_served: '',
          specializations: doc.data().specializations || [],
          ...doc.data()
        }));

        if (isMounted) {
          agentsRef.current = fetchedAgents; // Store in ref
          setAgents(fetchedAgents);
          setFilteredAgents(fetchedAgents);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAgents();

    return () => {
      isMounted = false;
    };
  }, []); // This

  
  // Modify the handleSearch function

  // Add debouncing for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Optimized fetch effect
  useEffect(() => {
    let isMounted = true;

    const fetchAgents = async () => {
      try {
        const agentsCollection = await firestore().collection('agents').get();
        const fetchedAgents = agentsCollection.docs.map(doc => ({
          id: doc.id,
          zipcode: '',
          location_served: '',
          specializations: doc.data().specializations || [],
          ...doc.data()
        }));

        if (isMounted) {
          agentsRef.current = fetchedAgents;
          setAgents(fetchedAgents);
          setFilteredAgents(fetchedAgents);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAgents();

    return () => {
      isMounted = false;
    };
  }, []);

  const debouncedSearch = React.useCallback(
    debounce((text) => {
      setSearchQuery(text);
    },300),
    []
  );

  const handleSearch = (text) => {
    setSearchInput(text);
    debouncedSearch(text);
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, []);
  
  // Clean up the debounce on component unmount
  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, []);
  
  
  const SearchHeader = React.memo(({ location, userName, onSearch, searchQuery }) => {
    const navigation = useNavigation();
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [inputValue, setInputValue] = useState(searchQuery);
  
    const toggleSidebar = () => {
      setSidebarVisible(!sidebarVisible);
    };
  
    const handleSearchSubmit = () => {
      onSearch(inputValue);  // Trigger search only when "Enter" is pressed
    };
  
    return (
      <LinearGradient
        colors={['#c81d77', '#6710c2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
         
         
          <View style={styles.headerLeftContainer}>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={20} color="#fff" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
            <Text style={styles.greetingText}>Hello, {userName}!</Text>
          </View>
         
        </View>
        <View style={styles.headerRightContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#4285F4" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Zipcode or Location"
              placeholderTextColor="#888"
              value={inputValue}
              onChangeText={setInputValue}  // Update input as user types
              onSubmitEditing={handleSearchSubmit}  // Trigger search on "Enter"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
        </View>
      </LinearGradient>
    );
  });
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

  const AgentCard = ({ agent, onPress }) => {
    const renderSpecializations = (specializations) => {
      if (specializations.length === 1) {
        return specializations[0];
      }
      return specializations.slice(0, -1).join(', ') + ' and ' + specializations[specializations.length - 1];
    };
  
    return (
      <TouchableOpacity style={styles.agentCard} onPress={onPress}>
        <View style={styles.agentCardContent}>
          <Image 
             source={
              agent.profile_picture_url
                ? { uri: `data:image/jpeg;base64,${agent.profile_picture_url}` }
               : 'https://via.placeholder.com/150'  // Fallback image
            } 
            style={styles.agentPhoto} 
          />
          <View style={styles.agentDetails}>
            <Text style={styles.agentName}>{agent.full_name}</Text>
            <Text style={styles.agentRole}>{renderSpecializations(agent.specializations)}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD833" />
              <Text style={styles.ratingText}> {agent.years_experience} Years of Experience</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
    // UseEffect for Filtering Agents
    useEffect(() => {
      const filterAgents = () => {
       
        let result = agents;
    
        // Filter by Specialization
        if (sortOption && sortOption !== 'Most Recommended') {
          result = result.filter(agent => 
            agent.specializations && 
            agent.specializations.includes(sortOption)
          );
        }
    
        // Apply Search Query
        if (searchQuery.length >= 2) {
          const lowercaseQuery = searchQuery.toLowerCase().trim();
          
          result = result.filter(agent => {
            const zipcodesMatch = (agent.zipcodes || []).some(zipcode => 
              zipcode.toLowerCase().includes(lowercaseQuery)
            );
            
            const countiesMatch = (agent.counties || []).some(county => 
              county.toLowerCase().includes(lowercaseQuery)
            );
            
            const statesMatch = (agent.states || []).some(state => 
              state.toLowerCase().includes(lowercaseQuery)
            );
            
            const fullNameMatch = (agent.full_name || '').toLowerCase().includes(lowercaseQuery);
            const specializationMatch = (agent.specialization || '').toLowerCase().includes(lowercaseQuery);
            
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
      };
    
      filterAgents();
    }, [searchQuery, sortOption]);
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
          colors={['#b307a7', '#6710c2']} 
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
   
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listingsContainer}
    >
      {listings && listings.length > 0 ? (
        listings.map((listing, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => handleCardPress(listing)}
          >
            <LinearGradient
              colors={['rgba(26, 35, 126, 0.05)', 'rgba(13, 71, 161, 0.1)']}
              style={styles.cardContainer}
            >
              <Image
                source={{ uri: `data:image/jpeg;base64,${listing.displayImage}` }}
                style={styles.cardImage}
              />
              
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>
                  ${listing.price?.toLocaleString()}
                </Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.propertyType}>
                  {listing.propertySubType.charAt(0).toUpperCase() + listing.propertySubType.slice(1)}
                </Text>
                
                <Text style={styles.listingName} numberOfLines={1}>
                  {listing.name}
                </Text>

                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.locationText1} numberOfLines={1}>
                    {listing.location}
                  </Text>
                </View>

                <View style={styles.detailsContainer}>
                  {['house', 'flat', 'apartment'].includes(listing.propertySubType) ? (
                    <>
                      <View style={styles.detailItem}>
                        <Ionicons name="bed-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>{listing.bedrooms} beds</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="water-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>{listing.bathrooms} baths</Text>
                      </View>
                    </>
                  ) : listing.propertySubType === 'plot' ? (
                    <>
                      <View style={styles.detailItem}>
                        <Ionicons name="resize-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>{listing.plotArea} sq ft</Text>
                      </View>
                    </>
                  ) : listing.propertySubType === 'office' ? (
                    <>
                      <View style={styles.detailItem}>
                        <Ionicons name="business-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>Floor {listing.selectedFloor}</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.detailItem}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>{listing.propertyAge} years old</Text>
                    </View>
                  )}
                  <View style={styles.detailItem}>
                    <Ionicons name="expand-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{listing.squareFeet} sq ft</Text>
                  </View>
                </View>

                {listing.features && listing.features.length > 0 && (
                  <View style={styles.featuresContainer}>
                    <Text style={styles.featuresText} numberOfLines={1}>
                      {listing.features.slice(0, 3).join(' • ')}
                      {listing.features.length > 3 && ' • ...'}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.noListingsContainer}>
          <Ionicons name="home-outline" size={48} color="#ccc" />
          <Text style={styles.noListingsText}>No listings available.</Text>
        </View>
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
      <>
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
      <View style={styles.bottomNav}>
      <NavItem name="home-outline" label="Home" isActive />
      <NavItem name="calendar" label="My Meetings" />
      <NavItem name="mail" label="Feedback" />
      <NavItem name="chatbubble" label="Chats" />
      <NavItem name="person" label="My Profile" />
    </View>
      </>
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
        <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="Home" isActive />
        <NavItem name="calendar" label="My Meetings" />
        <NavItem name="mail" label="Feedback" />
        <NavItem name="chatbubble" label="Chats" />
        <NavItem name="person" label="My Profile" />
      </View>

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
  }, 
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navItem: {
    alignItems: 'center',
  },
  navIconWrapper: {
    alignItems: 'center',
    marginBottom: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A6073',
    elevation: 4,  // Android - higher elevation for z-index effect
    shadowColor: '#000',  // iOS - subtle shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  navLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  messageIconContainer: {
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
  detailSection: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 15,
  },
  listingsContainer: {
    paddingBottom: 20,
  },
  card: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContainer: {
    backgroundColor: '#fff',
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  priceTag: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(26, 35, 126, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 15,
  },
  propertyType: {
    color: '#1a237e',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  listingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText1: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
  featuresContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  featuresText: {
    color: '#666',
    fontSize: 13,
  },
  noListingsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noListingsText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
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
  agentRole: {
    color: 'gray',
    fontSize: 14,
    marginVertical: 4,
  },
  sortContainer: {
    paddingHorizontal: width * 0.04,
    height: height * 0.07,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.02,
    paddingRight: width * 0.08, // Add extra padding for last item visibility
  },

  sortOption: {
    height: height * 0.05,
    paddingHorizontal: width * 0.03,
    marginRight: width * 0.02,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: width * 0.2, // Set minimum width
    maxWidth: width * 0.3, // Set maximum width
  },

  gradientWrapper: {
    marginRight: width * 0.02,
    borderRadius: 10,
    overflow: 'hidden',
    minWidth: width * 0.2, // Match sortOption minWidth
    maxWidth: width * 0.3, // Match sortOption maxWidth
  },

  gradientTouchable: {
    height: height * 0.05, // Match sortOption height
    paddingHorizontal: width * 0.03,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sortOptionText: {
    fontSize: width * 0.035,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },

  activeSortOptionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
    color: 'black',
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
  },bookMeetingButton: {
    flexDirection: 'row',
    alignItems: 'center', // Center vertically
    justifyContent: 'center', // Center horizontally
    paddingVertical: 20, // Larger padding for a bigger button
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '100%', 
    // Make sure the gradient covers the entire button
  },
  
  bookMeetingButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 42, // Adjusted margin to control spacing between the icon and text
    marginBottom: 0, // Removed bottom margin, as it is unnecessary for centering
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
