import React from 'react';
import { TextInput, Text, View, StyleSheet } from 'react-native';

const InputField = ({ label, error, ...props }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput 
        style={[
          styles.input, 
          error && styles.errorBorder
        ]} 
        placeholderTextColor="#aaa" // Ensure placeholder is visible
        secureTextEntry={props.secureTextEntry || false} // Allow secure input if enabled
        {...props} 
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16, // Make dots clearly visible
    color: '#000', // Ensure text and dots are black (or a visible color)
    backgroundColor: '#fff', // White background for contrast
  },
  errorBorder: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default InputField;
