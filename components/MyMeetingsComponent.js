import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Alert, 
  TouchableOpacity, 
  StyleSheet,
  BackHandler, 
  Dimensions,ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient'; // Import LinearGradient
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
let agentid;
const { width, height } = Dimensions.get('window');
const MyMeetingsComponent = ({ navigation,route }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
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
  useEffect(() => {
    const backAction = () => {
      try {
        console.log('Back button pressed');
        
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Home');
        }
        return true;
      } catch (error) {
        console.error('Navigation error:', error);
        return false;
      }
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    fetchUserId();

    return () => backHandler.remove();
  }, [navigation]);

  const fetchUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userid');
      if (storedUserId) {
        setUserId(storedUserId);
        fetchMeetings(storedUserId);
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);
      Alert.alert('Error', 'Could not fetch user ID');
    }
  };

  const fetchMeetings = async (userId) => {
    try {
      const meetingsSnapshot = await firestore()
        .collection('meetings')
        .where('userId', '==', userId)
        .get();

      const meetingsList = await Promise.all(
        meetingsSnapshot.docs.map(async (documentSnapshot) => {
          const meetingData = {
            id: documentSnapshot.id,
            ...documentSnapshot.data()
          };
          agentid = meetingData.agentId;

          try {
            const agentSnapshot = await firestore()
              .collection('agents')
              .doc(meetingData.agentId)
              .get();

            meetingData.agentName = agentSnapshot.exists
              ? agentSnapshot.data().agency_name
              : 'Unknown Agent';
          } catch (agentError) {
            console.error('Error fetching agent:', agentError);
            meetingData.agentName = 'Unknown Agent';
          }

          return meetingData;
        })
      );

      setMeetings(meetingsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setLoading(false);
      Alert.alert('Error', 'Could not fetch meetings');
    }
  };

  const handleCancelMeeting = (meetingId) => {
    // Show an alert asking for confirmation before proceeding
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this meeting?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel pressed'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              // Update Firestore
              await firestore()
                .collection('meetings')
                .doc(meetingId)
                .update({
                  status: 'cancelled'
                });
  
              // Update local state
              setMeetings(prevMeetings =>
                prevMeetings.map(meeting =>
                  meeting.id === meetingId
                    ? { ...meeting, status: 'cancelled' }
                    : meeting
                )
              );
  
              // Show success alert
              Alert.alert('Meeting Cancelled', 'Your meeting has been successfully cancelled.');
            } catch (error) {
              console.error('Error cancelling meeting:', error);
              Alert.alert('Error', 'Could not cancel the meeting. Please try again.');
            }
          },
        },
      ],
      { cancelable: true } // Make it cancellable
    );
  };
  

  const handleRescheduleMeeting = (meeting) => {
    Alert.alert(
      'Reschedule Meeting', 
      'Would you like to reschedule this meeting?',
      [
        {
          text: 'Yes',
          onPress: () => {
            navigation.navigate('Meetings', { 
              meeting,
              isRescheduling: true,
              agentId: meeting.agentId
            });
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleGoBack = () => {
    try {
      console.log('Go back button pressed');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Navigation error:', error);
      navigation.navigate('Home');
    }
  };

  if (loading) {
    return (
      
      <>
      <LinearGradient colors={['#c81d77', '#6710c2']} style={styles.centeredContainer}>
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#c81d77" />
          <Text style={styles.loadingText}>Loading meetings...</Text>
        </View>
      </LinearGradient>
        <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="Home"  />
        <NavItem name="calendar" label="My Meetings" isActive/>
        <NavItem name="mail" label="Feedback" />
        <NavItem name="chatbubble" label="Chats" />
        <NavItem name="person" label="My Profile" />
      </View>
      </>
    );
   }

  return (
    <>
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Text style={styles.backButtonText}>← Back to Home</Text>
      </TouchableOpacity>

      <Text style={styles.title}>My Meetings</Text>
      {meetings.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyText}>No meetings scheduled</Text>
        </View>
      ) : (
        <ScrollView>
          {meetings.map((meeting) => (
            <View key={meeting.id} style={styles.meetingCard}>
              <Text style={styles.meetingTitle}>Meeting with {meeting.agentName}</Text>
              <View style={styles.meetingDetails}>
                <Text style={styles.meetingTime}>{meeting.meetingDate} at {meeting.meetingTime}</Text>
                <Text style={[
                  styles.meetingStatus,
                  meeting.status.toLowerCase() === 'cancelled' || meeting.status.toLowerCase().includes('cancelled by the agent') 
                    ? styles.cancelledStatus 
                    : styles.activeStatus
                ]}>
                  Status: {meeting.status}
                </Text>
              </View>
              <View style={styles.buttonContainer}>
                <LinearGradient
                  colors={['#c81d77', '#6710c2']} 
                  style={[
                    styles.button, 
                    styles.rescheduleButton,
                     (meeting.status.toLowerCase() === 'cancelled' || meeting.status.toLowerCase().includes('cancelled by the agent')) && styles.disabledButton 
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleRescheduleMeeting(meeting)}
                    disabled={(meeting.status.toLowerCase() === 'cancelled' || meeting.status.toLowerCase().includes('cancelled by the agent'))}
                  >
                    <Text style={styles.buttonText}>Reschedule</Text>
                  </TouchableOpacity>
                </LinearGradient>

                <LinearGradient
                  colors={['#c11e38', '#f44336']}
                  style={[
                    styles.button, 
                    styles.cancelButton,
                    (meeting.status.toLowerCase() === 'cancelled' || meeting.status.toLowerCase().includes('cancelled by the agent')) && styles.disabledButton
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleCancelMeeting(meeting.id)}
                    disabled={meeting.status.toLowerCase() === 'cancelled' || meeting.status.toLowerCase().includes('cancelled by the agent')}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          ))}
        </ScrollView>
        

      )}
      </View>
        <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="Home"  />
        <NavItem name="calendar" label="My Meetings" isActive/>
        <NavItem name="mail" label="Feedback" />
        <NavItem name="chatbubble" label="Chats" />
        <NavItem name="person" label="My Profile" />
     </View></>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? height * 0.05 : height * 0.03,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginBottom: 16,
  }, centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    backgroundColor: 'white', 
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    color: 'gray',
  }, bottomNav: {
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
  meetingCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  meetingDetails: {
    marginBottom: 12,
  },
  meetingTime: {
    marginBottom: 4,
  },
  meetingStatus: {
    fontWeight: 'bold',
  },
  cancelledStatus: {
    color: 'red',
  },
  activeStatus: {
    color: 'green',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  rescheduleButton: {
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#f44336',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: 'bold',
    color: 'white',
  },
});

export default MyMeetingsComponent;
