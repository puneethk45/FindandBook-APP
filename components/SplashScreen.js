import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  Animated,
  Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

const SplashScreen = ({ navigation }) => {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo scale and opacity
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true
      })
    ]).start();

    // Check login status and navigate
    const checkLoginStatus = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'user') {
          navigation.replace('Home'); // Navigate to Home if logged in
        } 
        else if(isLoggedIn === 'agent') {
          navigation.replace('AgentHome'); // Navigate to Onboarding if not logged in
        }
        else{
          navigation.replace('Onboarding'); 
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        navigation.replace('Onboarding'); // Fallback to Onboarding
      }
    };

    const timer = setTimeout(() => {
      checkLoginStatus();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F0F4F8']}
      style={styles.splashContainer}
    >
      <StatusBar 
        backgroundColor="transparent" 
        translucent
        barStyle="dark-content" 
      />
      
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            transform: [{ scale: logoScale }],
            opacity: logoOpacity
          }
        ]}
      >
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <View style={styles.brandTitleContainer}>
          <Text style={styles.brandTitle}>FindandBook</Text>
          <View style={styles.underline}></View>
        </View>
      </Animated.View>

      <Text style={styles.tagline}>
        Find Your Perfect Property, Book with Ease
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20
  },
  logoContainer: {
    alignItems: 'center',
    shadowColor: '#0077BE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 20
  },
  brandTitleContainer: {
    alignItems: 'center',
    marginTop: 10
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0077BE',
    letterSpacing: 1
  },
  underline: {
    width: 100,
    height: 3,
    backgroundColor: '#0077BE',
    marginTop: 5,
    borderRadius: 2
  },
  tagline: {
    fontSize: 16,
    color: '#4A4A4A',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5
  }
});

export default SplashScreen;
