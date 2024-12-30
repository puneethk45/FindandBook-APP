import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackHandler } from 'react-native';

const AllMeetings = ({ navigation }) => {
  const [meetings, setMeetings] = useState({ upcoming: [], cancelled: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Cancellation states
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [cancellingMeetingId, setCancellingMeetingId] = useState(null);
  useEffect(() => {
    const backAction = () => {
      try {
        console.log('Back button pressed');
        
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('AgentHome');
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

    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const agentid = await AsyncStorage.getItem('agentid');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const meetingsSnapshot = await firestore()
        .collection('meetings')
        .where('agentId', '==', agentid)
        .get();

      const upcoming = [];
      const cancelled = [];

      await Promise.all(meetingsSnapshot.docs.map(async (doc) => {
        const meetingData = { id: doc.id, ...doc.data() };
        
        try {
          const userDoc = await firestore()
            .collection('users')
            .doc(meetingData.userId)
            .get();

          if (userDoc.exists) {
            meetingData.userDetails = {
              name: userDoc.data().fullName || 'Unknown User',
              email: userDoc.data().email || 'No email provided',
              phoneNumber: userDoc.data().phoneNumber,
            };
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
          meetingData.userDetails = {
            name: 'Unknown User',
            email: 'No email provided',
            phoneNumber: null,
          };
        }

        if (meetingData.status && meetingData.status.toLowerCase().includes('cancelled')) {
          cancelled.push(meetingData);
        } else {
          upcoming.push(meetingData);
        }
      }));

      const sortMeetings = (a, b) => {
        const dateA = new Date(`${a.meetingDate} ${a.meetingTime}`);
        const dateB = new Date(`${b.meetingDate} ${b.meetingTime}`);
        return dateA - dateB;
      };

      upcoming.sort(sortMeetings);
      cancelled.sort(sortMeetings);

      setMeetings({ upcoming, cancelled });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setLoading(false);
    }
  };
  const [isCancelling, setIsCancelling] = useState(false);
  const handleCall = async (meeting) => {
    if (meeting.userDetails?.phoneNumber) {
      try {
        await Linking.openURL(`tel:${meeting.userDetails.phoneNumber}`);
      } catch (error) {
        Alert.alert('Error', 'Could not make the phone call');
      }
    } else {
      Alert.alert('Error', 'Phone number not available');
    }
  };

  const handleChat = (meeting) => {
    navigation.navigate('AgentChatRoom', {
      userId: meeting.userId,
      agentId: meeting.agentId
    });
  };

  const handleCancelMeeting = async () => {
    if (!selectedMeeting || !cancellationReason.trim()) {
      Alert.alert('Error', 'Please provide a cancellation reason');
      return;
    }
  
    setIsCancelling(true);
    setCancellingMeetingId(selectedMeeting.id);
  
    try {
      await firestore()
        .collection('meetings')
        .doc(selectedMeeting.id)
        .update({
          status: `Cancelled by the agent and the reason stated is ${cancellationReason.trim()}`,
          cancelledAt: firestore.FieldValue.serverTimestamp(),
        });
  
      await fetchMeetings();
  
      setIsCancelModalVisible(false);
      setCancellationReason('');
      setSelectedMeeting(null);
      setCancellingMeetingId(null);
  
      Alert.alert('Success', 'Meeting cancelled successfully');
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      Alert.alert('Error', 'Failed to cancel meeting');
    } finally {
      setIsCancelling(false);
      setCancellingMeetingId(null);
    }
  };
  const renderMeetingItem = (meeting) => (
    <View key={meeting.id} style={styles.meetingItem}>
      <View style={styles.meetingHeader}>
        <Text style={styles.meetingDate}>{meeting.meetingDate}</Text>
        <Text style={styles.meetingTime}>{meeting.meetingTime}</Text>
      </View>
      <View style={styles.meetingContent}>
        <Text style={styles.userName}>{meeting.userDetails?.name}</Text>
        <Text style={styles.userEmail}>{meeting.userDetails?.email}</Text>
        {meeting.status && (
          <View style={[
            styles.statusBadge,
            { backgroundColor: meeting.status.toLowerCase().includes('cancelled') ? '#fee2e2' : '#f0f9ff' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: meeting.status.toLowerCase().includes('cancelled') ? '#ef4444' : '#3b82f6' }
            ]}>
              {meeting.status}
            </Text>
          </View>
        )}
      </View>
      
      {/* Action Buttons */}
      {!meeting.status?.toLowerCase().includes('cancelled') && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleCall(meeting)}
          >
            <Icon name="call" size={20} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleChat(meeting)}
          >
            <Icon name="chatbubble-ellipses" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              cancellingMeetingId === meeting.id && styles.disabledButton
            ]}
            onPress={() => {
              setSelectedMeeting(meeting);
              setIsCancelModalVisible(true);
            }}
            disabled={cancellingMeetingId === meeting.id}
          >
            <Icon 
              name="close" 
              size={20} 
              color={cancellingMeetingId === meeting.id ? "#9ca3af" : "#ef4444"} 
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Cancellation Modal
  const renderCancellationModal = () => (
    <Modal
      visible={isCancelModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => !isCancelling && setIsCancelModalVisible(false)}
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
            editable={!isCancelling}
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setIsCancelModalVisible(false)}
              disabled={isCancelling}
            >
              <Text 
                style={[
                  styles.modalCancelButtonText,
                  isCancelling && styles.disabledButtonText
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalConfirmButton,
                isCancelling && styles.disabledButton
              ]}
              onPress={handleCancelMeeting}
              disabled={isCancelling}
            >
              <Text style={styles.modalConfirmButtonText}>
                {isCancelling ? 'Cancelling...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Meetings</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming ({meetings.upcoming.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>
            Cancelled ({meetings.cancelled.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {meetings[activeTab].length > 0 ? (
          meetings[activeTab].map(meeting => renderMeetingItem(meeting))
        ) : (
          <Text style={styles.noMeetingsText}>
            No {activeTab} meetings found
          </Text>
        )}
      </ScrollView>

      {renderCancellationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingTop:10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f3f4f6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },disabledButton: {
    opacity: 0.6,
  },
  disabledButtonText: {
    opacity: 0.6,
  },
  activeTabText: {
    color: '#4f46e5',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  meetingItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  meetingDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  meetingTime: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '500',
  },
  meetingContent: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMeetingsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 24,
  },actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  cancellationReasonInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  modalCancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  modalConfirmButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalConfirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AllMeetings;