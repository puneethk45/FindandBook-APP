import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../components/Login';
import Signup from '../components/Signup';

import SplashScreen from '../components/SplashScreen';
import OnboardingScreen from '../components/OnBoardingScreen';
import WelcomeScreen from '../components/WelcomeScreen';
import HealthConcernScreen from '../components/HealthConcernScreen';
import AgentSearchScreen from '../components/AgentSearchScreen';
import AgentDetailModal from '../components/AgentSearchScreen';
import MeetingScheduler from '../components/MeetingScheduler';
import PostMeetingInteraction from '../components/PostMeetingInteraction';

import AgentEntryScreen from '../components/AgentEntryScreen';

import AgentScreen from '../components/AgentScreen';
import AgentSignupScreen from '../components/AgentSignupScreen';
import AgentWelcomeScreen from '../components/AgentWelcomeScreen';
import AgentSignupFlow from '../components/AgentSignupFlow';
import AgentDashboard from '../components/AgentDashboard';
import DateTimePicker from '../components/DateTimePicker';
import CalComBooking from '../components/CalComBooking';
import MyMeetingsComponent from '../components/MyMeetingsComponent';
import UserProfileScreen from '../components/UserAccountScreen';
import AgentEditProfileScreen from '../components/AgentEditProfileScreen';
import AddListingScreen from '../components/AddListingScreen';
import ContactPropertyScreen from '../components/ContactPropertyScreen';
import MessageCardScreen from '../components/MessageCardScreen';
import ChatRoom from '../components/ChatRoom';
import AgentChatList from '../components/AgentChatList';
import AgentChatRoom from '../components/AgentChatRoom';
import UserChatList from '../components/UserChatList';
import AgentListingsComponent from '../components/MyListings';
import LocationSelector from '../components/LocationSelector';
import LocationEditor from '../components/LocationEditor';
import EditListingScreen from '../components/EditListingScreen';
import FeedbackScreen from '../components/FeedbackScreen';
import AgentFeedbackScreen from '../components/AgentFeedback';
import AllMeetings from '../components/AllMeetings';


const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Add Listing" component={AddListingScreen} /> 
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />

        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Home" component={AgentSearchScreen} />
      <Stack.Screen name="AgentHome" component={AgentDashboard} />
      <Stack.Screen name="My Meetings" component={MyMeetingsComponent} />
      <Stack.Screen name="Meetings" component={MeetingScheduler} />
      <Stack.Screen name="PostMeeting" component={PostMeetingInteraction} />
      <Stack.Screen name="Profile" component={AgentEditProfileScreen} />
      <Stack.Screen name="My Profile" component={UserProfileScreen} />
      <Stack.Screen name="AgentScreen" component={AgentScreen} />
      <Stack.Screen name="Locations" component={LocationSelector} />
      <Stack.Screen name="AgentSignup" component={AgentSignupScreen} />
      <Stack.Screen name="AgentEntry" component={AgentEntryScreen} />
      <Stack.Screen name="AgentWelcome" component={AgentWelcomeScreen} />
      <Stack.Screen name="ContactPropertyScreen" component={ContactPropertyScreen} />
      <Stack.Screen name="Messages" component={AgentChatList} />
      <Stack.Screen name="ChatRoom" component={ChatRoom} />
      <Stack.Screen name="AgentChatRoom" component={AgentChatRoom} />
      <Stack.Screen name="Chats" component={UserChatList} />
      <Stack.Screen name="My Listings" component={AgentListingsComponent} />
      <Stack.Screen name="LocationEditor" component={LocationEditor} />
      <Stack.Screen name="EditListing" component={EditListingScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="FeedBack" component={AgentFeedbackScreen} />
      <Stack.Screen name="AllMeetings" component={AllMeetings} />
    </Stack.Navigator>
  );
};
export default StackNavigator;