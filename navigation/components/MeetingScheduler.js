import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView,
  Dimensions,
  Alert, 
  ScrollView
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const COLORS = {
  white: '#ffffff',
  accent: '#aaa',
};
const MeetingScheduler = ({ navigation}) => {
  const route = useRoute();
  const { agentId } = route.params || {};
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [isVideoCallSelected, setVideoCallSelected] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [originalMeetingId, setOriginalMeetingId] = useState(null);
   const[rescheduleagentid,setrescheduleagentid] = useState('')
  // Add this to your existing useEffect or in the component initialization
  useEffect(() => {
    // Check if this is a rescheduling attempt
    if (route.params?.isRescheduling) {
      setIsRescheduling(true);
      setOriginalMeetingId(route.params.meeting.id);
      
      // Ensure agentId is set, preferring route.params.meeting.agentId
      const reschedulingAgentId = route.params.agentId || route.params.meeting.agentId;
      setrescheduleagentid(reschedulingAgentId);
    
      // Optionally pre-fill some details
      setSelectedDate(route.params.meeting.meetingDate);
      setVideoCallSelected(route.params.meeting.meetingType === 'video_call');
    }
  }, [route.params]);
  // Premium color palette
  const COLORS = {
    primary: '#2C3E50',     
    secondary: '#34495E',   
    accent: '#3498DB',      
    background: '#F7F9FC',  
    text: '#2C3E50',        
    white: '#FFFFFF',
    gray: '#BDC3C7',
    lightGray: '#ECF0F1'
  };

  // Fetch booked slots for the selected date and agent
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (selectedDate && agentId) {
        try {
          const querySnapshot = await firestore()
            .collection('meetings')
            .where('agentId', '==', agentId || rescheduleagentid)
            .where('meetingDate', '==', selectedDate)
            .where('status', '==', 'scheduled')
            .get();
          console.log(rescheduleagentid)
          const booked = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return data.meetingTime;
          });

          setBookedSlots(booked);
        } catch (error) {
          console.error('Error fetching booked slots:', error);
          Alert.alert('Error', 'Unable to fetch available slots');
        }
      }
    };

    fetchBookedSlots();
  }, [selectedDate, agentId]);

  // Create marked dates object for the Calendar
  const markedDates = {
    [selectedDate]: { 
      marked: true,
      dotColor: COLORS.accent,
      selected: true,
      selectedColor: '#790191',
      selectedTextColor: COLORS.white,
    }
  };

  const handleDateSelection = (day) => {
    setSelectedDate(day.dateString);
    setSelectedTimeSlot(null); // Reset selected time slot when a new date is selected
  };

  const handleTimeSlotSelection = (slot) => {
    setSelectedTimeSlot(slot);
  };

  const confirmBooking = async () => {
    try {
      // First, verify slot availability
      const meetingAgentId = agentId || rescheduleagentid;
      const availabilitySnapshot = await firestore()
        .collection('meetings')
        .where('agentId', '==', agentId)
        .where('meetingDate', '==', selectedDate)
        .where('meetingTime', '==', selectedTimeSlot)
        .where('status', '==', 'scheduled')
        .get();

      // If any documents exist, the slot is already booked
      if (!availabilitySnapshot.empty) {
        Alert.alert('Slot Unavailable', 'This time slot has already been booked. Please choose another time.');
        return;
      }
     console.log(originalMeetingId)
      if (isRescheduling && originalMeetingId) {
        // Update the existing meeting instead of creating a new one
        await firestore()
          .collection('meetings')
          .doc(originalMeetingId)
          .update({
            meetingDate: selectedDate,
            meetingTime: selectedTimeSlot,
            meetingType: isVideoCallSelected ? 'video_call' : 'voice_call',
            status: 'Rescheduled',
            updatedAt: firestore.FieldValue.serverTimestamp()
          });

        // Show rescheduling confirmation
        Alert.alert(
          'Meeting Rescheduled', 
          'Your meeting has been successfully rescheduled.',
          [{
            text: 'OK',
            onPress: () => navigation.navigate('MyMeetings')
          }]
        );
      } else {
        // Existing booking logic
        const uid = await AsyncStorage.getItem('userToken');
        const meetingData = {
          userId: uid,
          agentId: agentId, 
          meetingType: isVideoCallSelected ? 'video_call' : 'voice_call',
          meetingDate: selectedDate,
          meetingTime: selectedTimeSlot,
          status: 'scheduled',
          createdAt: firestore.FieldValue.serverTimestamp()
        };

        // Save meeting to Firestore
        await firestore().collection('meetings').add(meetingData);

        setConfirmationModalVisible(true);
      }
    } catch (error) {
      console.error('Booking Error:', error);
      Alert.alert('Booking Failed', 'Unable to book/reschedule meeting. Please try again.');
    }
  };

  // Rest of the component remains the same


  const renderTimeSlots = () => {
    const timeSlots = [
      "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
      "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
      "05:00 PM"
    ];
    
    return timeSlots.map((slot, index) => {
      const isBooked = bookedSlots.includes(slot);
      const isSelected = selectedTimeSlot === slot;
  
      return (
        <TouchableOpacity 
          key={index} 
          style={[
            styles.timeSlot, 
            isSelected && styles.selectedTimeSlot,
            isBooked && styles.disabledTimeSlot
          ]}
          onPress={() => !isBooked && handleTimeSlotSelection(slot)}
          disabled={isBooked}
        >
          <Text style={[
            styles.timeSlotText,
            isSelected && styles.selectedTimeSlotText,
            isBooked && styles.disabledTimeSlotText
          ]}>
            {slot} {isBooked ? '(Booked)' : ''}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  // Customize calendar theme
  const calendarTheme = {
    backgroundColor: COLORS.background,
    calendarBackground: COLORS.background,
    textSectionTitleColor: COLORS.primary,
    selectedDayBackgroundColor: COLORS.accent,
    selectedDayTextColor: COLORS.white,
    todayTextColor: COLORS.accent,
    dayTextColor: COLORS.text,
    textDisabledColor: COLORS.gray,
    dotColor: COLORS.accent,
    selectedDotColor: COLORS.white,
    arrowColor: COLORS.accent,
  };

  return (
    <ScrollView>
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>Schedule Your</Text>
              <Text style={styles.headerTitle}>Meeting</Text>
            </View>
            <Ionicons name="calendar" size={28} color={'#790191'} />
          </View>

          {/* Calendar Selection */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <Calendar
              markedDates={markedDates}
              onDayPress={handleDateSelection}
              theme={calendarTheme}
              minDate={new Date().toISOString().split('T')[0]}
              enableSwipeMonths={true}
              style={styles.calendar}
              markingType={'dot'}
            />
          </View>

          {/* Time Slot Selection */}
          {selectedDate && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Available Time Slots</Text>
              <View style={styles.timeSlotContainer}>
                {renderTimeSlots()}
              </View>
            </View>
          )}

          {/* Call Type Selection */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Meeting Type</Text>
            <View style={styles.callTypeOptions}>
              <TouchableOpacity 
                style={[
                  styles.callTypeButton, 
                  !isVideoCallSelected && styles.selectedCallType
                ]}
                onPress={() => setVideoCallSelected(false)}
              >
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={!isVideoCallSelected ? COLORS.white : COLORS.accent} 
                />
                <Text style={[
                  styles.callTypeText,
                  !isVideoCallSelected && styles.selectedCallTypeText
                ]}>IN-Person Meeting</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.callTypeButton, 
                  isVideoCallSelected && styles.selectedCallType
                ]}
                onPress={() => setVideoCallSelected(true)}
              >
                <Ionicons 
                  name="videocam" 
                  size={20} 
                  color={isVideoCallSelected ? COLORS.white : COLORS.accent} 
                />
                <Text style={[
                  styles.callTypeText,
                  isVideoCallSelected && styles.selectedCallTypeText
                ]}>Video Call</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Button */}
          <View style={styles.container2}> 
          <LinearGradient
        colors={['#c81d77', '#6710c2']} // Gradient colors
        start={{ x: 0, y: 0 }} // Gradient start
        end={{ x: 1, y: 1 }}   // Gradient end
        style={[
          styles.gradientWrapper, 
          (!selectedDate || !selectedTimeSlot) && styles.disabledButtonWrapper
        ]}
      >

        <TouchableOpacity
          style={[
            styles.confirmButton, 
            (!selectedDate || !selectedTimeSlot) && styles.disabledButton
          ]}
          onPress={confirmBooking}
          disabled={!selectedDate || !selectedTimeSlot}
        >
          <Text style={styles.confirmButtonText}>Confirm Meeting</Text>
          <Ionicons name="checkmark" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>
      </View>

          {/* Confirmation Modal */}
          <Modal
            transparent={true}
            visible={isConfirmationModalVisible}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <LinearGradient 
                  colors={['#c81d77', '#6710c2']} 
                  style={styles.modalGradient}
                >
                  <Ionicons name="checkmark-circle" size={80} color={COLORS.white} />
                  <Text style={styles.modalTitle}>Meeting Confirmed</Text>
                  <Text style={styles.modalDetails}>
                    Date: {new Date(selectedDate).toLocaleDateString()}
                    {'\n'}
                    Time: {selectedTimeSlot}
                    {'\n'}
                    Type: {isVideoCallSelected ? 'Video Call' : 'IN-Person Meeting'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setConfirmationModalVisible(false);
                      navigation.goBack();
                    }}
                  >
                    <Text style={styles.modalCloseButtonText}>OK</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
 
  postMeetingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  postMeetingHeader: {
    marginBottom: 30,
    alignItems: 'center',
  },
  postMeetingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 10,
  },
  postMeetingSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  container2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackSection: {
    marginBottom: 30,
  },
  feedbackOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  disabledTimeSlot: {
    backgroundColor: '#F0F0F0', // Light gray background
    borderColor: '#D0D0D0', // Slightly darker border
    opacity: 0.3, // Reduced opacity to indicate unavailability
  },
  feedbackOption: {
    flex: 1,
    backgroundColor: '#ECF0F1',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedFeedbackOption: {
    backgroundColor: '#3498DB',
  },
  feedbackOptionText: {
    color: '#2C3E50',
    fontWeight: '500',
  },
  selectedFeedbackOptionText: {
    color: 'white',
  },
  moodSection: {
    marginBottom: 30,
  },
  moodOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodOption: {
    alignItems: 'center',
    backgroundColor: '#ECF0F1',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  selectedMoodOption: {
    backgroundColor: '#3498DB',
  },
  moodOptionText: {
    marginTop: 10,
    color: '#2C3E50',
  },
  selectedMoodOptionText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  calendar: {
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    backgroundColor: '#ECF0F1',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 5,
    width: '48%',
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#790191',
  },
  timeSlotText: {
    color: '#2C3E50',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: 'white',
  },
  callTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  callTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECF0F1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '48%',
    justifyContent: 'center',
  },
  selectedCallType: {
    backgroundColor: '#790191',
  },
  callTypeText: {
    marginLeft: 10,
    color: '#2C3E50',
    fontWeight: '500',
  },
  selectedCallTypeText: {
    color: 'white',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '100%',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  }, gradientWrapper: {
    borderRadius: 10,
    width: '80%', // Ensure the gradient fills the button's size
  },
  disabledButtonWrapper: {
    opacity: 0.5, // Reduce opacity for disabled state
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 20,
    marginBottom: 15,
  },
  modalDetails: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  modalCloseButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },})
  export default MeetingScheduler