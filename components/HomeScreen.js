import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Button, Card, Avatar } from 'react-native-elements';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const AppHeader = () => {
    const navigation = useNavigation();

    const handleLogout = () => {
      navigation.navigate('Doctors');
    };
  
    return (
      <LinearGradient 
        colors={['#1A73E8', '#4285F4']} 
        style={styles.header}
        start={{x: 0, y: 0}} 
        end={{x: 1, y: 0}}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerText}>Bangalore</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Icon name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#4285F4" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for medicines and tests"
              placeholderTextColor="#888"
            />
          </View>
        </View>
      </LinearGradient>
    );
};

const ServiceItem = ({ title, image, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.serviceCardWrapper}>
      <Card containerStyle={styles.serviceCard}>
        <View style={styles.serviceCardContent}>
          <Avatar 
            source={image} 
            size={70} 
            rounded 
            containerStyle={styles.serviceAvatar}
          />
          <Text style={styles.serviceTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const FeaturedServices = () => {
  const services = [
    { 
      title: 'Book In-Clinic\nAppointment', 
      image: require('../assets/doctor.png'),
      onPress: () => console.log('Book Appointment')
    },
    { 
      title: 'Instant Video\nConsultation', 
      image: require('../assets/videocall.png'),
      onPress: () => console.log('Video Consultation')
    },
  ];

  return (
    <View style={styles.featuredServicesContainer}>
      <Text style={styles.sectionHeaderText}>Quick Services</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={services}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <ServiceItem 
            title={item.title} 
            image={item.image} 
            onPress={item.onPress} 
          />
        )}
      />
    </View>
  );
};

const AffordableProcedures = () => {
    const navigation =useNavigation()
  const procedures = [
    { title: 'Dental Care', image: require('../assets/dental.png') },
    { title: 'Pregnancy\nCare', image: require('../assets/pregnancy.png') },
    { title: 'Knee\nReplacement', image: require('../assets/knee.png') },
    { title: 'Child\nSpecialist', image: require('../assets/child.png') },
  ];

  return (
    <View style={styles.affordableProceduresContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>Affordable Procedures</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={procedures}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.procedureItem}>
            <View style={styles.procedureItemContent}>
              <Avatar 
                source={item.image} 
                size={70} 
                rounded 
                containerStyle={styles.procedureAvatar}
              />
              <Text style={styles.procedureTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <LinearGradient 
        colors={['#1A73E8', '#4285F4']} 
        style={styles.estimateButton}
        start={{x: 0, y: 0}} 
        end={{x: 1, y: 0}}
      >
        <TouchableOpacity style={styles.estimateButtonTouch}  >
          <Text style={styles.estimateButtonText}>Get Cost Estimate</Text>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        backgroundColor="#1A73E8" 
        barStyle="light-content"
      />
      <AppHeader />
      <View style={styles.scrollContainer}>
        <FeaturedServices />
        <AffordableProcedures />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#333',
  },
  featuredServicesContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  serviceCardWrapper: {
    marginRight: 12,
  },
  serviceCard: {
    width: 160,
    borderRadius: 16,
    padding: 0,
    margin: 0,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  serviceCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  serviceAvatar: {
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  affordableProceduresContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  seeAllText: {
    color: '#1A73E8',
    fontWeight: '600',
  },
  procedureItem: {
    marginRight: 16,
  },
  procedureItemContent: {
    alignItems: 'center',
  },
  procedureAvatar: {
    marginBottom: 8,
  },
  procedureTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: '#666',
  },
  estimateButton: {
    borderRadius: 12,
    marginTop: 16,
  },
  estimateButtonTouch: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  estimateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
  },
});

export default HomeScreen;