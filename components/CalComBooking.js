import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const CalComBooking = ({ transactionID }) => {
  // Replace this URL with your Cal.com scheduling link
  const calComUrl = `https://cal.com/puneeth-karukola-gkotzz`; // Adjust URL structure if needed
  
  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: calComUrl }}
        startInLoadingState={true} // Show a loading indicator while the page loads
        javaScriptEnabled={true}  // Enable JavaScript for interactive elements
        domStorageEnabled={true}  // Enable DOM storage for a smoother experience
      />
    </View>
  );
};

export default CalComBooking;
