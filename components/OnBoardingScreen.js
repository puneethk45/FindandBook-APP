import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  Dimensions, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {

  const Dots = ({ selected }) => {
    const dotColor = selected ? '#0077BE' : '#B0C4DE';
    return (
      <View
        style={[
          styles.dot,
          { 
            backgroundColor: dotColor,
            width: selected ? 20 : 10
          }
        ]}
      />
    );
  };

  const NextButton = ({ onPress }) => (
    <View style={styles.nextButtonContainer}>
      <LinearGradient
        colors={['#c81d77', '#6710c2']}
        style={styles.nextButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={onPress} style={styles.nextButtonText}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const SkipButton = ({ onPress }) => (
    <View style={styles.skipButtonContainer}>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Onboarding
      onSkip={() => navigation.replace('AgentEntry')}
      onDone={() => navigation.replace('AgentEntry')}
      DotComponent={Dots}
      NextButtonComponent={NextButton}
      SkipButtonComponent={SkipButton}
      containerStyles={styles.container}
      pages={[
        {
          backgroundColor: '#FFFFFF',
          image: (
            <View style={styles.imageContainer}>
              <Image 
                source={require('../assets/connectagents.png')} 
                style={styles.onboardingImage} 
                resizeMode="contain"
              />
            </View>
          ),
          title: (
            <Text style={styles.title}>Connect with Top Agents</Text>
          ),
          subtitle: (
            <Text style={styles.subtitle}>
              Instantly connect with verified real estate professionals
            </Text>
          ),
        },
        {
          backgroundColor: '#FFFFFF',
          image: (
            <View style={styles.imageContainer}>
              <Image 
                source={require('../assets/simplifyjourney.png')} 
                style={styles.onboardingImage} 
                resizeMode="contain"
              />
            </View>
          ),
          title: (
            <Text style={styles.title}>Simplify Your Real Estate Journey</Text>
          ),
          subtitle: (
            <Text style={styles.subtitle}>
              Streamlined process from search to booking
            </Text>
          ),
        },
        {
          backgroundColor: '#FFFFFF',
          image: (
            <View style={styles.imageContainer}>
              <Image 
                source={require('../assets/book-meetings.png')} 
                style={styles.onboardingImage} 
                resizeMode="contain"
              />
            </View>
          ),
          title: (
            <Text style={styles.title}>Book Meetings Effortlessly</Text>
          ),
          subtitle: (
            <Text style={styles.subtitle}>
              Schedule viewings and consultations with just a tap
            </Text>
          ),
        }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    width: width,
    height: height * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
    shadowColor: '#0077BE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  onboardingImage: {
    width: width * 0.8,
    height: height * 0.4,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0077BE',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
    fontWeight: '400',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  nextButtonContainer: {
    marginRight: 20,
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButtonContainer: {
    marginLeft: 20,
  },
  skipButtonText: {
    color: '#0077BE',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
