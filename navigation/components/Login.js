import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, TextInput } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const Login = ({ navigation }) => {
  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  });

  const handleLogin = async (values) => {
    try {
      // Firebase Auth: Sign in user
      const userCredential = await auth().signInWithEmailAndPassword(values.email, values.password);
      const user = userCredential.user;

      await AsyncStorage.setItem('userid', userCredential.user.uid);
      console.log(userCredential.user.uid)
      Alert.alert('Success', `Welcome Back!`);
      await AsyncStorage.setItem('isLoggedIn', 'user');
      navigation.navigate('Home'); // Redirect to the Home screen after login
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    }
  };

  return (
    <LinearGradient
      colors={['#c81d77', '#6710c2']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.loginContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={handleLogin}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
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

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <LinearGradient
      colors={['#c81d77', '#6710c2']} // Gradient colors
      start={{ x: 0, y: 0 }} // Gradient start point
      end={{ x: 1, y: 1 }}   // Gradient end point
      style={styles.gradientContainer} // Gradient container style
    >
      <TouchableOpacity style={styles.loginButton} onPress={handleSubmit}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>
    </LinearGradient>

              {/* Signup Redirect */}
              <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupText}>
                  Don't have an account?
                  <Text style={styles.signupHighlight}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
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
  loginContainer: {
    width: width * 0.9,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    height: 40,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#ddd',
    fontSize: 14,
  },
  gradientContainer: {
    borderRadius: 20,
    marginBottom: 20,
  },
  loginButton: {
    borderRadius: 15,
    paddingVertical: 10,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupLink: {
    marginTop: 20,
  },
  signupText: {
    color: '#ddd',
    fontSize: 14,
  },
  signupHighlight: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Login;
