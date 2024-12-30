import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, TextInput } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const Signup = ({ navigation }) => {
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string()
      .matches(/^\d{10}$/, 'Phone number must be exactly 10 digits')
      .required('Phone number is required'),
    city: Yup.string().required('City is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSignup = async (values) => {
    setIsSubmitting(true); 
    try {
      // Firebase Auth: Create User
      const userCredential = await auth().createUserWithEmailAndPassword(
        values.email,
        values.password
      );
     
      const userid = userCredential.user.uid;
      await AsyncStorage.setItem('userid',userid)

      // Firestore: Add additional user information
      await firestore().collection('users').doc(userid).set({
        fullName: values.name,
        email: values.email,
        phoneNumber: values.phone,
        city: values.city,
        signupMethod: 'email',
        signupDate: firestore.Timestamp.now(),
      });

      Alert.alert('Success', 'Registration successful!');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Signup Error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    }finally {
      setIsSubmitting(false); // Enable the button again after process completes
    }
  };

  return (
    <LinearGradient
      colors={['#c81d77', '#6710c2']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.signupContainer}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        <Formik
          initialValues={{ name: '', email: '', phone: '', city: '', password: '', confirmPassword: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSignup}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Icon name="person-outline" size={24} color="#fff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  style={styles.input}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  value={values.name}
                  autoCapitalize="words"
                />
              </View>
              {touched.name && errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

              {/* Email */}
              <View style={styles.inputContainer}>
                <Icon name="mail-outline" size={24} color="#fff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Email Address"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  style={styles.input}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  value={values.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {touched.email && errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

              {/* Phone Number */}
              <View style={styles.inputContainer}>
                <Icon name="phone-portrait-outline" size={24} color="#fff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  style={styles.input}
                  onChangeText={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  value={values.phone}
                  keyboardType="phone-pad"
                />
              </View>
              {touched.phone && errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}

              {/* City */}
              <View style={styles.inputContainer}>
                <Icon name="location-outline" size={24} color="#fff" style={styles.inputIcon} />
                <TextInput
                  placeholder="City"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  style={styles.input}
                  onChangeText={handleChange('city')}
                  onBlur={handleBlur('city')}
                  value={values.city}
                  autoCapitalize="words"
                />
              </View>
              {touched.city && errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}

              {/* Password */}
              <View style={styles.inputContainer}>
                <Icon name="lock-closed-outline" size={24} color="#fff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  style={styles.input}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  value={values.password}
                  secureTextEntry
                />
              </View>
              {touched.password && errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Icon name="lock-closed-outline" size={24} color="#fff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  style={styles.input}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  value={values.confirmPassword}
                  secureTextEntry
                />
              </View>
              {touched.confirmPassword && errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}

              {/* Signup Button */}
              <LinearGradient
      colors={['#c81d77', '#6710c2']} // Gradient colors
      start={{ x: 0, y: 0 }} // Gradient start point
      end={{ x: 1, y: 1 }}   // Gradient end point
      style={styles.gradientContainer} // Gradient container style
    >
       <TouchableOpacity
    style={[styles.signupButton, isSubmitting && { opacity: 0.5 }]} // Reduce opacity when disabled
    onPress={handleSubmit}
    disabled={isSubmitting} // Disable button when submitting
  >
    <Text style={styles.signupButtonText}>Sign Up</Text>
  </TouchableOpacity>
    </LinearGradient>
            </View>
          )}
        </Formik>

        {/* Login Link */}
        <View style={styles.loginLink}>
          <Text style={styles.loginText}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginHighlight}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupContainer: {
    width: width * 0.9,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 25,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 10,
  },
 
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  loginHighlight: {
    color: '#fff',
    fontWeight: '700',
  },
  gradientContainer: {
    borderRadius: 8,
    marginBottom: 20,
  },
  signupButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Signup;