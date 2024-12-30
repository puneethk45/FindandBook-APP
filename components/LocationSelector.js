import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TouchableOpacity, ActivityIndicator,Alert } from 'react-native';
import { View, Text, Keyboard } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { ScrollView } from 'react-native-gesture-handler';
import firestore from '@react-native-firebase/firestore';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
const statedata = require("../assets/statedata.json");

const LocationSelector = () => {
  const [stateOptions, setStateOptions] = useState([]);
  const [countyOptions, setCountyOptions] = useState([]);
  const [zipcodeOptions, setZipcodeOptions] = useState([]);
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedCounties, setSelectedCounties] = useState([]);
  const [selectedZipcodes, setSelectedZipcodes] = useState([]);

  const [statesOpen, setStatesOpen] = useState(false);
  const [countiesOpen, setCountiesOpen] = useState(false);
  const [zipcodesOpen, setZipcodesOpen] = useState(false);

  const [loadingCounties, setLoadingCounties] = useState(false);
  const [loadingZipcodes, setLoadingZipcodes] = useState(false);

  const [loadingStatesDropdown, setLoadingStatesDropdown] = useState(false);
  const [loadingCountiesDropdown, setLoadingCountiesDropdown] = useState(false);
  const [loadingZipcodesDropdown, setLoadingZipcodesDropdown] = useState(false);

  const scrollViewRef = useRef(null);
  const dropdownPositions = useRef({
    states: 0,
    counties: 0,
    zipcodes: 0
  });

  // Initialize state options
  useEffect(() => {
    const states = Object.keys(statedata.states).map((stateName) => ({
      label: stateName,
      value: stateName,
    }));
    setStateOptions(states);
  }, []);

  // Handle counties loading when states change
  useEffect(() => {
    if (selectedStates.length > 0) {
      setLoadingCounties(true);
      setTimeout(() => {
        const counties = selectedStates.flatMap((state) =>
          Object.keys(statedata.states[state]?.counties || {}).map((countyName) => ({
            label: countyName,
            value: `${countyName}-${state}`,
          }))
        );
        setCountyOptions(counties);
        setSelectedCounties([]);
        setSelectedZipcodes([]);
        setLoadingCounties(false);
      }, 500);
    } else {
      setCountyOptions([]);
      setSelectedCounties([]);
      setSelectedZipcodes([]);
    }
  }, [selectedStates]);
  const handleSubmit = async () => {
    if (selectedStates.length === 0) {
      Alert.alert('Error', 'Please select at least one state');
      return;
    }
  
    try {
      setIsSubmitting(true);
      
      // Get agent ID from AsyncStorage
      const agentId = await AsyncStorage.getItem('agentid');
      if (!agentId) {
        throw new Error('Agent ID not found');
      }
  
      // Get current agent data
      const agentRef = firestore().collection('agents').doc(agentId);
      const agentSnap = await agentRef.get();
      
      if (!agentSnap.exists) {
        throw new Error('Agent profile not found');
      }
  
      // Store the arrays directly using firestore() syntax
      await agentRef.update({
        states: selectedStates,
        counties: selectedCounties, // This will store values like "Orange-New York"
        zipcodes: selectedZipcodes,
       
      });
  
      Alert.alert(
        'Success',
        'Location preferences updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('AgentHome')
          }
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        'Failed to update location preferences. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle zipcodes loading when counties change
  useEffect(() => {
    if (selectedCounties.length > 0) {
      setLoadingZipcodes(true);
      setTimeout(() => {
        const zipcodes = selectedCounties.flatMap((countyValue) => {
          const [county, state] = countyValue.split("-");
          return statedata.states[state]?.counties[county]?.zipcodes.map((zipcode) => ({
            label: zipcode,
            value: zipcode,
          })) || [];
        });
        setZipcodeOptions(zipcodes);
        setSelectedZipcodes([]);
        setLoadingZipcodes(false);
      }, 500);
    } else {
      setZipcodeOptions([]);
      setSelectedZipcodes([]);
    }
  }, [selectedCounties]);

  const handleSelectAllStates = useCallback(() => {
    const allStates = stateOptions.map(option => option.value);
    setSelectedStates(selectedStates.length === allStates.length ? [] : allStates);
  }, [stateOptions, selectedStates]);

  const handleSelectAllCounties = useCallback(() => {
    const allCounties = countyOptions.map(option => option.value);
    if (selectedCounties.length === allCounties.length) {
      setSelectedCounties([]);
    } else {
      setLoadingZipcodes(true);
      setTimeout(() => {
        setSelectedCounties(allCounties);
      }, 100);
    }
  }, [countyOptions, selectedCounties]);

  const handleSelectAllZipcodes = useCallback(() => {
    const allZipcodes = zipcodeOptions.map(option => option.value);
    setSelectedZipcodes(selectedZipcodes.length === allZipcodes.length ? [] : allZipcodes);
  }, [zipcodeOptions, selectedZipcodes]);

  const handleDropdownOpen = useCallback((dropdownName, isOpen, position) => {
    Keyboard.dismiss();
    
    const showLoading = (setLoadingFn, setOpenFn, isOpen) => {
      if (isOpen) {
        setLoadingFn(true);
        setTimeout(() => {
          setLoadingFn(false);
          setOpenFn(true);
        }, 500);
      } else {
        setOpenFn(false);
      }
    };

    if (dropdownName === 'states') {
      setCountiesOpen(false);
      setZipcodesOpen(false);
      showLoading(setLoadingStatesDropdown, setStatesOpen, isOpen);
    } else if (dropdownName === 'counties') {
      setStatesOpen(false);
      setZipcodesOpen(false);
      showLoading(setLoadingCountiesDropdown, setCountiesOpen, isOpen);
    } else if (dropdownName === 'zipcodes') {
      setStatesOpen(false);
      setCountiesOpen(false);
      showLoading(setLoadingZipcodesDropdown, setZipcodesOpen, isOpen);
    }

    if (isOpen && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollTo({
          y: position - 50,
          animated: true
        });
      }, 600);
    }
  }, []);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 400 }}
      showsVerticalScrollIndicator={true}
      scrollEventThrottle={16}
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
    >

<View style={{ marginBottom: 24, alignItems: 'center',paddingTop:10 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' }}>
          Select Location Preferences
        </Text>
      </View>
      {/* States Selection */}
      <View
        style={{ marginBottom: 24, zIndex: 3000 }}
        onLayout={(event) => {
          dropdownPositions.current.states = event.nativeEvent.layout.y;
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>Select States</Text>
          <Text
            onPress={handleSelectAllStates}
            style={{ color: '#6710c2', fontSize: 14 }}
          >
            {selectedStates.length === stateOptions.length ? 'Deselect All' : 'Select All'}
          </Text>
        </View>
        {loadingStatesDropdown ? (
          <View style={{ 
            borderWidth: 1, 
            borderColor: '#E2E8F0', 
            borderRadius: 8, 
            minHeight: 50,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <ActivityIndicator size="small" color="#6710c2" />
          </View>
        ) : (
          <DropDownPicker
            multiple={true}
            open={statesOpen}
            value={selectedStates}
            items={stateOptions}
            setOpen={(isOpen) => handleDropdownOpen('states', isOpen, dropdownPositions.current.states)}
            setValue={setSelectedStates}
            setItems={setStateOptions}
            placeholder="Select States"
            mode="BADGE"
            listMode="SCROLLVIEW"
            maxHeight={300}
            style={{
              borderColor: '#E2E8F0',
              minHeight: 50,
            }}
            containerStyle={{
              position: 'relative'
            }}
            dropDownContainerStyle={{
              borderColor: '#E2E8F0',
              backgroundColor: 'white',
              position: 'relative',
            }}
            searchable={true}
            searchPlaceholder="Search states..."
            listItemContainerStyle={{
              height: 40
            }}
          />
        )}
      </View>

      {/* Counties Selection */}
      <View
        style={{ marginBottom: 24, zIndex: 2000 }}
        onLayout={(event) => {
          dropdownPositions.current.counties = event.nativeEvent.layout.y;
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>Select Counties</Text>
          {loadingCounties ? (
            <ActivityIndicator size="small" color="#6710c2" />
          ) : (
            <Text
              onPress={handleSelectAllCounties}
              style={{ color: '#6710c2', fontSize: 14 }}
            >
              {selectedCounties.length === countyOptions.length ? 'Deselect All' : 'Select All'}
            </Text>
          )}
        </View>
        {loadingCountiesDropdown ? (
          <View style={{ 
            borderWidth: 1, 
            borderColor: '#E2E8F0', 
            borderRadius: 8, 
            minHeight: 50,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <ActivityIndicator size="small" color="#6710c2" />
          </View>
        ) : (
          <DropDownPicker
            multiple={true}
            open={countiesOpen}
            value={selectedCounties}
            items={countyOptions}
            setOpen={(isOpen) => handleDropdownOpen('counties', isOpen, dropdownPositions.current.counties)}
            setValue={setSelectedCounties}
            setItems={setCountyOptions}
            placeholder={loadingCounties ? "Loading counties..." : "Select Counties"}
            mode="BADGE"
            listMode="SCROLLVIEW"
            maxHeight={300}
            style={{
              borderColor: '#E2E8F0',
              minHeight: 50,
            }}
            containerStyle={{
              position: 'relative'
            }}
            dropDownContainerStyle={{
              borderColor: '#E2E8F0',
              backgroundColor: 'white',
              position: 'relative',
            }}
            searchable={true}
            searchPlaceholder="Search counties..."
            disabled={selectedStates.length === 0 || loadingCounties}
            listItemContainerStyle={{
              height: 40
            }}
          />
        )}
      </View>

      {/* Zipcodes Selection */}
      <View
        style={{ marginBottom: 24, zIndex: 1000 }}
        onLayout={(event) => {
          dropdownPositions.current.zipcodes = event.nativeEvent.layout.y;
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>Select Zipcodes</Text>
          {loadingZipcodes ? (
            <ActivityIndicator size="small" color="#6710c2" />
          ) : (
            <Text
              onPress={handleSelectAllZipcodes}
              style={{ color: '#6710c2', fontSize: 14 }}
            >
              {selectedZipcodes.length === zipcodeOptions.length ? 'Deselect All' : 'Select All'}
            </Text>
          )}
        </View>
        {loadingZipcodesDropdown ? (
          <View style={{ 
            borderWidth: 1, 
            borderColor: '#E2E8F0', 
            borderRadius: 8, 
            minHeight: 50,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <ActivityIndicator size="small" color="#6710c2" />
          </View>
        ) : (
          <DropDownPicker
            multiple={true}
            open={zipcodesOpen}
            value={selectedZipcodes}
            items={zipcodeOptions}
            setOpen={(isOpen) => handleDropdownOpen('zipcodes', isOpen, dropdownPositions.current.zipcodes)}
            setValue={setSelectedZipcodes}
            setItems={setZipcodeOptions}
            placeholder={loadingZipcodes ? "Loading zipcodes..." : "Select Zipcodes"}
            mode="BADGE"
            listMode="SCROLLVIEW"
            maxHeight={300}
            style={{
              borderColor: '#E2E8F0',
              minHeight: 50,
            }}
            containerStyle={{
              position: 'relative'
            }}
            dropDownContainerStyle={{
              borderColor: '#E2E8F0',
              backgroundColor: 'white',
              position: 'relative',
            }}
            searchable={true}
            searchPlaceholder="Search zipcodes..."
            disabled={selectedCounties.length === 0 || loadingZipcodes}
            listItemContainerStyle={{
              height: 40
            }}
          />
        )}
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={{
          backgroundColor: '#6710c2',
          padding: 15,
          borderRadius: 8,
          marginTop: 20,
          opacity: isSubmitting ? 0.7 : 1,
        }}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '600' }}>
            Save Location Preferences
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default LocationSelector;