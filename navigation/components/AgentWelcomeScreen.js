import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  StatusBar,
  Animated,
  Dimensions 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const AgentWelcomeScreen = ({ navigation }) => {
  // Animated values for entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Parallel animation for fade and slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.welcomeContainer}>
      <StatusBar 
        backgroundColor="transparent" 
        translucent 
        barStyle="dark-content" 
      />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#c81d77', '#6710c2']}
        style={styles.backgroundGradient}
      />

      <Animated.View 
        style={[
          styles.welcomeContent,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.welcomeTitle}>FindandBook</Text>
          <View style={styles.titleUnderline}></View>
        </View>

        <Text style={styles.welcomeSubtitle}>
          Find your dream home or the perfect buyer/renter
        </Text>

        <TouchableOpacity 
          style={styles.primaryButtonContainer}
          onPress={() => navigation.navigate('AgentScreen')}
        >
          <LinearGradient
            colors={['#c81d77', '#6710c2']} // Updated gradient colors
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('AgentScreen')}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white', // Updated color for the title
    letterSpacing: 1,
  },
  titleUnderline: {
    width: 150,
    height: 3,
    backgroundColor: '#c81d77', // Updated color for the underline
    marginTop: 8,
    borderRadius: 2,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  primaryButtonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  primaryButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#c81d77', // Updated color for the border
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white', // Updated color for the secondary button text
    fontSize: 18,
    fontWeight: '700',
  },
});

export default AgentWelcomeScreen;
