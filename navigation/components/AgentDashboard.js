import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  StatusBar, 
  StyleSheet, 
  Dimensions, 
  BackHandler, 
  Alert,
  Modal,
  TextInput,Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
const { width, height } = Dimensions.get('window');

const AgentDashboard = ({ navigation }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userInquiries, setUserInquiries] = useState([]);
  const [agentProfile, setAgentProfile] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    interactions: 0,
    userRating: 0,
    profileOptimizationSuggestions: []
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const meetingsPerPage = 5;

  // Cancellation modal state
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Hardware back button handler
  useEffect(() => {
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to exit the app?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  // Fetch meetings with pagination
  const fetchMeetings = async (agentid) => {
    try {
      const meetingsCollection = await firestore()
        .collection('meetings')
        .where('agentId', '==', agentid)
        .get();

      const fetchedMeetings = await Promise.all(
        meetingsCollection.docs.map(async (doc) => {
          const meetingData = { id: doc.id, ...doc.data() };
          
          try {
            const userDoc = await firestore()
              .collection('users')
              .doc(meetingData.userId)
              .get();

            if (userDoc.exists) {
              meetingData.userDetails = {
                name: userDoc.data().fullName || 'Unknown User',
                email: userDoc.data().email || 'No email provided'
              };
            }
          } catch (userError) {
            console.error('Error fetching user details:', userError);
            meetingData.userDetails = {
              name: 'Unknown User',
              email: 'No email provided'
            };
          }

          return meetingData;
        })
      );

      setMeetings(fetchedMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  // Handle meeting cancellation
  const handleCancelMeeting = async () => {
    if (!selectedMeeting || !cancellationReason.trim()) {
      Alert.alert('Error', 'Please provide a cancellation reason');
      return;
    }

    try {
      await firestore()
        .collection('meetings')
        .doc(selectedMeeting.id)
        .update({
          status: `Cancelled by the agent and the reason stated is ${cancellationReason.trim()}`,
         
        });

      // Refresh meetings list
      const agentid = await AsyncStorage.getItem('agentid');
      await fetchMeetings(agentid);

      // Close modal and reset states
      setIsCancelModalVisible(false);
      setCancellationReason('');
      setSelectedMeeting(null);

      Alert.alert('Success', 'Meeting cancelled successfully');
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      Alert.alert('Error', 'Failed to cancel meeting');
    }
  };

  // Main data fetching effect
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const agentid = await AsyncStorage.getItem('agentid');
        console.log(agentid)
        const agentDoc = await firestore()
          .collection('agents')
          .doc(agentid)
          .get();

        if (agentDoc.exists) {
          setAgentProfile({
            id: agentDoc.id,
            ...agentDoc.data()
          });
        }

        // Fetch meetings
        await fetchMeetings(agentid);

        // Fetch User Inquiries
        const inquiriesCollection = await firestore()
          .collection('userInquiries')
          .where('assignedAgentId', '==', agentid)
          .get();

        const fetchedInquiries = inquiriesCollection.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserInquiries(fetchedInquiries);

        // Fetch Performance Metrics
        const metricsDoc = await firestore()
          .collection('agentMetrics')
          .doc(agentid)
          .get();

        if (metricsDoc.exists) {
          const metricsData = metricsDoc.data();
          setPerformanceMetrics({
            interactions: metricsData.totalInteractions || 0,
            userRating: metricsData.averageRating || 0,
            profileOptimizationSuggestions: metricsData.suggestions || []
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching agent data:', error);
        setLoading(false);
      }
    };

    fetchAgentData();
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('isLoggedIn');
      navigation.replace('AgentEntry');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Pagination logic
  const indexOfLastMeeting = currentPage * meetingsPerPage;
  const indexOfFirstMeeting = indexOfLastMeeting - meetingsPerPage;
  const currentMeetings = meetings.slice(indexOfFirstMeeting, indexOfLastMeeting);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Render pagination buttons
  const renderPaginationButtons = () => {
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(meetings.length / meetingsPerPage); i++) {
      pageNumbers.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        {pageNumbers.map(number => (
          <TouchableOpacity 
            key={number} 
            onPress={() => paginate(number)}
            style={[
              styles.paginationButton, 
              currentPage === number && styles.activePaginationButton
            ]}
          >
            <Text style={[
              styles.paginationButtonText,
              currentPage === number && styles.activePaginationButtonText
            ]}>
              {number}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  const handleCall = async (meeting) => {
    try {
      // Fetch user's phone number from Firestore
      const userDoc = await firestore()
        .collection('users')
        .doc(meeting.userId)
        .get();

      if (userDoc.exists && userDoc.data().phoneNumber) {
        const phoneNumber = userDoc.data().phoneNumber;
        
        // Use Linking to open phone app
        const phoneUrl = Platform.OS === 'android' 
          ? `tel:${phoneNumber}` 
          : `telprompt:${phoneNumber}`;
        
      
        
      
          await Linking.openURL(`tel:${phoneNumber}`);
       
      } else {
        Alert.alert('Error', 'Phone number not available');
      }
    } catch (error) {
      console.error('Error fetching phone number:', error);
      Alert.alert('Error', 'Unable to retrieve phone number');
    }
  };

  // New function to handle email functionality
  const handleEmail = async (meeting) => {
    try {
      // Fetch user's email from Firestore
      const userDoc = await firestore()
        .collection('users')
        .doc(meeting.userId)
        .get();

      if (userDoc.exists && userDoc.data().email) {
        const email = userDoc.data().email;
        
        // Use Linking to open email app
        const emailUrl = `mailto:${email}`;
        
       
        
       
          await Linking.openURL(`mailto:${email}`);
        
      } else {
        Alert.alert('Error', 'Email not available');
      }
    } catch (error) {
      console.error('Error fetching email:', error);
      Alert.alert('Error', 'Unable to retrieve email');
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

  // Cancellation Modal
  const renderCancellationModal = () => (
    <Modal
      visible={isCancelModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsCancelModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Cancel Meeting</Text>
          <Text style={styles.modalSubtitle}>
            Please provide a reason for cancellation
          </Text>
          <TextInput
            style={styles.cancellationReasonInput}
            multiline
            numberOfLines={4}
            placeholder="Reason for cancellation"
            value={cancellationReason}
            onChangeText={setCancellationReason}
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setIsCancelModalVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={handleCancelMeeting}
            >
              <Text style={styles.modalConfirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }
 
  // No profile found state
  if (!agentProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noProfileText}>No agent profile found</Text>
      </View>
    );
  }

  // Main render
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Elegant Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: agentProfile.profilePicture || 'https://randomuser.me/api/portraits/men/32.jpg' }}
            style={styles.profileImage}
          />
          <View>
            <Text style={styles.profileName}>
              {agentProfile.full_name || 'Agent Profile'}
            </Text>
            <Text style={styles.profileSubtitle}>
              Real Estate Professional
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => setIsOnline(!isOnline)}
            style={[
              styles.onlineStatusButton, 
              { backgroundColor: isOnline ? '#f0f9ff' : '#fff1f2' }
            ]}
          >
            <View style={[
              styles.onlineStatusDot,
              { backgroundColor: isOnline ? '#10b981' : '#ef4444' }
            ]} />
            <Text style={[
              styles.onlineStatusText,
              { color: isOnline ? '#10b981' : '#ef4444' }
            ]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('AgentEditProfileScreen')}
          >
            <Icon name="create" color="#4f46e5" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Meetings Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="calendar" color="#4f46e5" size={24} />
            <Text style={styles.sectionTitle}>
              Upcoming Meetings 
              <Text style={styles.sectionSubtitle}> ({meetings.length})</Text>
            </Text>
          </View>
          {currentMeetings.map((meeting) => (
            <View 
              key={meeting.id} 
              style={styles.meetingItem}
            >
              <View style={styles.meetingDetails}>
                <Text style={styles.meetingDateTime}>
                  {meeting.meetingDate} at {meeting.meetingTime}
                </Text>
                <Text style={styles.meetingUser}>
                  {meeting.userDetails?.name || 'Unknown User'}
                </Text>
                <Text style={styles.meetingUserEmail}>
                  {meeting.userDetails?.email || 'No email'}
                </Text>
                <View style={[
                  styles.meetingBadge,
                  meeting.status === 'scheduled' 
                    ? styles.scheduledBadge 
                    : styles.cancelledBadge
                ]}>
                  <Text style={[
                    styles.meetingBadgeText,
                    meeting.status === 'scheduled'
                      ? styles.scheduledBadgeText
                      : styles.cancelledBadgeText
                  ]}>
                    {meeting.status || meeting.meetingType}
                  </Text>
                </View>
              </View>
              <View style={styles.meetingActions}>
                <TouchableOpacity style={styles.actionButton}   onPress={() => handleCall(meeting)}>
                  <Icon name="call" color="#10b981" size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="mail" color="#3b82f6" size={20} onPress={() => handleEmail(meeting)}/>
                </TouchableOpacity>
                {meeting.status !== 'cancelled' && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setSelectedMeeting(meeting);
                      setIsCancelModalVisible(true);
                    }}
                  >
                    <Icon name="close" color="#ef4444" size={20} />
                  </TouchableOpacity>
                 
                )}
                
              </View>
            </View>
          ))}
          
          {/* Pagination */}
          {meetings.length > meetingsPerPage && renderPaginationButtons()}
        </View>

        {/* User Inquiries Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="chatbox" color="#10b981" size={24} />
            <Text style={styles.sectionTitle}>
              User Inquiries 
              <Text style={styles.sectionSubtitle}> ({userInquiries.length})</Text>
            </Text>
          </View>
          {userInquiries.map((inquiry) => (
            <View 
              key={inquiry.id} 
              style={styles.inquiryItem}
            >
              <Text style={styles.inquiryTitle}>
                {inquiry.propertyType} in {inquiry.location}
              </Text>
              <Text style={styles.inquiryBudget}>
                Budget: {inquiry.budget}
              </Text>
            </View>
          ))}
        </View>


        {/* Performance Metrics Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="star" color="#f59e0b" size={24} />
            <Text style={styles.sectionTitle}>Performance</Text>
          </View>
          
          <View style={styles.performanceMetricsContainer}>
            <View style={styles.performanceMetricCard}>
              <Text style={styles.performanceMetricLabel}>Total Interactions</Text>
              <Text style={styles.performanceMetricValue}>
                {performanceMetrics.interactions}
              </Text>
            </View>
            <View style={styles.performanceMetricCard}>
              <Text style={styles.performanceMetricLabel}>User Rating</Text>
              <Text style={styles.performanceMetricValue}>
                {performanceMetrics.userRating.toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.optimizationContainer}>
            <Text style={styles.optimizationTitle}>
              Profile Optimization Suggestions
            </Text>
            {performanceMetrics.profileOptimizationSuggestions.map((suggestion, index) => (
              <View 
                key={index} 
                style={styles.optimizationItem}
              >
                <View style={styles.optimizationDot} />
                <Text style={styles.optimizationText}>
                  {suggestion}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="Home" isActive />
        <NavItem name="add" label="Add Listing" />
        <NavItem name="cash" label="My Listings"  />
     
     
        <NavItem name="mail" label="Messages" />
      </View>
      {renderCancellationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8'
  },
  noProfileText: {
    color: '#6b7280',
    fontSize: width * 0.04,
    fontWeight: '600'
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 40,
    paddingHorizontal: width * 0.05,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: width * 0.6
  },
  profileImage: {
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: width * 0.07,
    marginRight: width * 0.04,
    borderWidth: 2,
    borderColor: '#e6e6e6'
  },
  profileName: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#1f2937',
    flexShrink: 1
  }, bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
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
  profileSubtitle: {
    color: '#6b7280',
    fontSize: width * 0.035
  },
  onlineStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.03,
    borderRadius: 20
  },
  onlineStatusDot: {
    width: width * 0.025,
    height: width * 0.025,
    borderRadius: width * 0.0125,
    marginRight: width * 0.02
  },
  onlineStatusText: {
    fontWeight: '600',
    fontSize: width * 0.035
  },
  scrollContainer: {
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.025
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  editProfileButton: {
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: width * 0.05,
    marginBottom: height * 0.025,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.02
  },
  sectionTitle: {
    marginLeft: width * 0.025,
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  sectionSubtitle: {
    fontWeight: 'normal',
    color: '#6b7280'
  },
  meetingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  meetingDetails: {
    flex: 1,
    marginRight: width * 0.03
  },
  meetingDateTime: {
    fontSize: width * 0.038,
    fontWeight: '600',
    color: '#1f2937'
  },  meetingUser: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: height * 0.005
  },
  meetingUserEmail: {
    fontSize: width * 0.03,
    color: '#6b7280',
    marginBottom: height * 0.01
  },
  meetingBadge: {
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.005,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: height * 0.006
  },
  meetingBadgeText: {
    fontSize: width * 0.03,
    fontWeight: '600'
  },
  meetingActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: width * 0.02,
    marginLeft: width * 0.025
  },
  inquiryItem: {
    paddingVertical: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  inquiryTitle: {
    fontSize: width * 0.038,
    fontWeight: '600',
    color: '#1f2937'
  },
  inquiryBudget: {
    color: '#6b7280',
    marginTop: height * 0.006,
    fontSize: width * 0.035
  },
  performanceMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  performanceMetricCard: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    padding: width * 0.04,
    alignItems: 'center',
    flex: 0.48
  },
  performanceMetricLabel: {
    fontSize: width * 0.035,
    color: '#6b7280'
  },
  performanceMetricValue: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  optimizationContainer: {
    marginTop: height * 0.02
  },
  optimizationTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: height * 0.01
  },
  optimizationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.01
  },
  optimizationDot: {
    width: width * 0.02,
    height: width * 0.02,
    borderRadius: width * 0.01,
    backgroundColor: '#4f46e5',
    marginRight: width * 0.02
  },
  optimizationText: {
    fontSize: width * 0.035,
    color: '#4b5563'
  },
  logoutButton: {
    backgroundColor: '#ffe4e6',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    marginBottom:20,
    borderRadius: 20,
    marginTop: height * 0.03,
    alignItems: 'center'
  },
  logoutButtonText: {
    fontSize: width * 0.04,
    color: '#ef4444',
    fontWeight: 'bold'
  },  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.02
  },
  paginationButton: {
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.01,
    marginHorizontal: width * 0.01,
    backgroundColor: '#f3f4f6',
    borderRadius: 8
  },
  activePaginationButton: {
    backgroundColor: '#4f46e5'
  },
  paginationButtonText: {
    color: '#4b5563',
    fontSize: width * 0.035
  },
  activePaginationButtonText: {
    color: 'white'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: 'white',
    width: width * 0.85,
    borderRadius: 12,
    padding: width * 0.05,
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: height * 0.01
  },
  modalSubtitle: {
    fontSize: width * 0.035,
    color: '#6b7280',
    marginBottom: height * 0.02,
    textAlign: 'center'
  },
  cancellationReasonInput: {
    width: '100%',
    height: height * 0.15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: width * 0.03,
    marginBottom: height * 0.02,
    textAlignVertical: 'top'
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  modalCancelButton: {
    flex: 0.45,
    backgroundColor: '#f3f4f6',
    paddingVertical: height * 0.015,
    borderRadius: 8,
    alignItems: 'center'
  },
  modalCancelButtonText: {
    color: '#4b5563',
    fontWeight: '600'
  },
  modalConfirmButton: {
    flex: 0.45,
    backgroundColor: '#ef4444',
    paddingVertical: height * 0.015,
    borderRadius: 8,
    alignItems: 'center'
  },
  modalConfirmButtonText: {
    color: 'white',
    fontWeight: '600'
  }

});

export default AgentDashboard;
