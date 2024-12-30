import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AgentDashboard = () => {
  const navigation = useNavigation();
  const [isOnline, setIsOnline] = useState(true);
  const [todaysMeetings, setTodaysMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentProfile, setAgentProfile] = useState(null);
  const [listingsStats, setListingsStats] = useState({
    active: 0,
    sold: 0,
    rented: 0
  });
  const [monthlyMetrics, setMonthlyMetrics] = useState({
    userInquiries: 0,
    clientInteractions: 0,
    userRating: 0,
    totalReviews: 0,
  });
  // Fetch today's meetings
  const fetchTodaysMeetings = async (agentid) => {
    try {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      console.log('Fetching meetings for date:', todayString); // Debug log
      console.log('Agent ID:', agentid); // Debug log
      
      const meetingsCollection = await firestore()
        .collection('meetings')
        .where('agentId', '==', agentid)
        .where('meetingDate', '==', todayString)
        .get();
  
      console.log('Meetings found:', meetingsCollection.size); // Debug log
  
      const fetchedMeetings = await Promise.all(
        meetingsCollection.docs.map(async (doc) => {
          const meetingData = { id: doc.id, ...doc.data() };
          console.log('Meeting data:', meetingData); // Debug log
          
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
  
      console.log('Processed meetings:', fetchedMeetings); // Debug log
      setTodaysMeetings(fetchedMeetings);
    } catch (error) {
      console.error('Error fetching today\'s meetings:', error);
    }
  };
  // Fetch listings statistics
  const fetchListingsStats = async (agentid) => {
    try {
      const listingsSnapshot = await firestore()
        .collection('listings')
        .where('agentId', '==', agentid)
        .get();

      const stats = {
        active: 0,
        sold: 0,
        rented: 0
      };
  console.log("agentid",agentid)

      listingsSnapshot.docs.forEach(doc => {
        const status = doc.data().status;
        if (status === 'Active') stats.active++;
        else if (status === 'Sold') stats.sold++;
        else if (status === 'Rented') stats.rented++;
      });

      setListingsStats(stats);
    } catch (error) {
      console.error('Error fetching listings stats:', error);
    }
  };

  // Main data fetching effect
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const agentid = await AsyncStorage.getItem('agentid');
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

        await Promise.all([
          fetchTodaysMeetings(agentid),
          fetchListingsStats(agentid)
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching agent data:', error);
        setLoading(false);
      }
    };

    fetchAgentData();
  }, []);
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
  // Render meeting item
  const renderMeetingItem = (meeting) => (
    <View key={meeting.id} style={styles.meetingItem}>
      <View style={styles.meetingTimeContainer}>
        <Text style={styles.meetingTime}>{meeting.meetingTime}</Text>
      </View>
      <View style={styles.meetingDetails}>
        <Text style={styles.meetingUser}>
          {meeting.userDetails?.name || 'Unknown User'}
        </Text>
        <Text style={styles.meetingUserEmail}>
          {meeting.userDetails?.email || 'No email'}
        </Text>
        <View style={styles.meetingBadge}>
          <Text style={styles.meetingBadgeText}>
            {meeting.status || meeting.meetingType}
          </Text>
        </View>
      </View>
    </View>
  );
  const MetricCard = ({ icon, title, value, subtitle, gradient }) => (
    <View style={[styles.metricCard, { backgroundColor: gradient[0] }]}>
      <View style={styles.metricIconContainer}>
        <Icon name={icon} size={24} color="#ffffff" />
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );
  // Loading state
  if (loading) {
    return (
      <>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
      <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="AgentHome"  isActive/>
      
        <NavItem name="cash" label="My Listings"  />
     
     
        <NavItem name="mail" label="FeedBack" />
        <NavItem name="chatbubble" label="Messages" />
        <NavItem name="person" label="Profile" />
      </View>
      </>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image 
             source={
              agentProfile.profile_picture_url
                ? { uri: `data:image/jpeg;base64,${agentProfile.profile_picture_url}` }
                : 'https://via.placeholder.com/150'  // Fallback image
            }
            style={styles.profileImage}
          />
          <View>
            <Text style={styles.profileName}>
              {agentProfile?.full_name || 'Agent Profile'}
            </Text>
            <Text style={styles.profileSubtitle}>
              Real Estate Professional
            </Text>
          </View>
        </View>
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
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Today's Meetings Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="today" color="#4f46e5" size={24} />
            <Text style={styles.sectionTitle}>
              Today's Meetings
              <Text style={styles.sectionSubtitle}> ({todaysMeetings.length})</Text>
            </Text>
          </View>
          {todaysMeetings.length > 0 ? (
            todaysMeetings.map(meeting => renderMeetingItem(meeting))
          ) : (
            <Text style={styles.noMeetingsText}>No meetings scheduled for today</Text>
          )}
        </View>

        {/* View All Meetings Button */}
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('AllMeetings')}
        >
          <Text style={styles.viewAllButtonText}>View All Meetings</Text>
          <Icon name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>

        {/* Listings Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Listings Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{listingsStats.active}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{listingsStats.sold}</Text>
              <Text style={styles.statLabel}>Sold</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{listingsStats.rented}</Text>
              <Text style={styles.statLabel}>Rented</Text>
            </View>
          </View>
        </View>
        <Text style={styles.monthlyMetricsTitle}>Monthly Performance</Text>
      <View style={styles.metricsContainer}>
        <MetricCard
          icon="people-outline"
          title="User Inquiries"
          value={monthlyMetrics.userInquiries}
          subtitle="This Month"
          gradient={['#4f46e5', '#6366f1']}
        />
        <MetricCard
          icon="chatbubbles-outline"
          title="Interactions"
          value={monthlyMetrics.clientInteractions}
          subtitle="Client Conversations"
          gradient={['#10b981', '#34d399']}
        />
      </View>
      <View style={styles.metricsContainer}>
        <MetricCard
          icon="star-outline"
          title="Rating"
          value={`${monthlyMetrics.userRating} ★`}
          subtitle={`${monthlyMetrics.totalReviews} Reviews`}
          gradient={['#f59e0b', '#fbbf24']}
        />
        <MetricCard
          icon="trending-up-outline"
          title="Response Rate"
          value="97%"
          subtitle="Avg. Response Time"
          gradient={['#ec4899', '#f472b6']}
        />
      </View>
        
      </ScrollView>
      <View style={styles.bottomNav}>
        <NavItem name="home-outline" label="AgentHome"  isActive/>
      
        <NavItem name="cash" label="My Listings"  />
     
     
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
    backgroundColor: '#f3f4f6',
    paddingTop:20
  },bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    width:"100%",
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  onlineStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
  },
  onlineStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  meetingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
  },
  meetingTimeContainer: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 6,
    marginRight: 12,
  },
  meetingTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4f46e5',
  },
  meetingDetails: {
    flex: 1,
  },
  meetingUser: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  meetingUserEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  meetingBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  meetingBadgeText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  viewAllButton: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  viewAllButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4f46e5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  noMeetingsText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },monthlyMetricsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default AgentDashboard;