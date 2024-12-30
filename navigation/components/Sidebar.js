import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Animated, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const Sidebar = ({ visible, onClose, onMyOrders, onMyProfile,onLogout }) => {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out
      Animated.timing(translateX, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX }] }]}>
          <TouchableOpacity onPress={onMyOrders}>
            <Text style={styles.sidebarItem}>My Meetings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onMyProfile}>
            <Text style={styles.sidebarItem}>My Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout}>
            <Text style={styles.sidebarItem}>Logout</Text>
          </TouchableOpacity>
          <View style={styles.closeButtonContainer}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  sidebarContainer: {
    backgroundColor: '#fff',
    width: '60%',
    height: '100%',
    padding: 20,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sidebarItem: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#790191',
    paddingVertical: 8,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeButton: {
    padding: 10,
  },
});

export default Sidebar;
