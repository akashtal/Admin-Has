import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Linking,
  ScrollView,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config/api.config';
import COLORS from '../../config/colors';

export default function VerifyBusinessScreen({ route, navigation }) {
  const { businessId } = route.params;
  const [loading, setLoading] = useState(true);
  const [verificationData, setVerificationData] = useState(null);
  const [status, setStatus] = useState('not_started');
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeVerification();
  }, []);

  const initializeVerification = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Create Didit verification session
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/verification/initiate/${businessId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setVerificationData(response.data);
        setStatus(response.data.status || 'pending');
      } else {
        setError(response.data.error || 'Failed to create verification session');
      }
    } catch (err) {
      console.error('❌ Verification init failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initialize verification');
    } finally {
      setLoading(false);
    }
  };

  const ensureVerificationLink = async () => {
    // If we already have a link, return it
    if (verificationData?.verificationLink) return verificationData.verificationLink;

    try {
      // 1) Try to fetch latest status (may include link)
      const token = await AsyncStorage.getItem('token');
      const statusResp = await axios.get(
        `${API_CONFIG.BASE_URL}/verification/status-app/${businessId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const statusLink = statusResp?.data?.verificationLink 
        || statusResp?.data?.data?.verificationLink 
        || statusResp?.data?.data?.didit?.verificationLink;
      if (statusLink) {
        setVerificationData((prev) => ({ ...prev, verificationLink: statusLink }));
        return statusResp.data.verificationLink;
      }

      // 2) If still missing, re-initiate a new session and return fresh link
      const initResp = await axios.post(
        `${API_CONFIG.BASE_URL}/verification/initiate/${businessId}`,
        {},
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      const initLink = initResp?.data?.verificationLink || initResp?.data?.data?.verificationLink;
      if (initLink) {
        setVerificationData({ ...(initResp.data?.data || {}), ...initResp.data });
        setStatus(initResp.data.status || 'pending');
        return initLink;
      }
    } catch (e) {
      console.error('Failed to ensure verification link:', e);
    }
    return null;
  };

  const openVerificationLink = async () => {
    const link = await ensureVerificationLink();
    if (!link) {
      Alert.alert('Error', 'Verification link is not available. Please try again.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(link);
      
      if (supported) {
        await Linking.openURL(link);
        
        // Show instructions
        Alert.alert(
          'Complete Verification',
          'You will complete the following steps on Didit:\n\n' +
          '✓ ID Verification\n' +
          '✓ Liveness Check\n' +
          '✓ Face Match\n' +
          '✓ Proof of Address\n' +
          '✓ Phone Verification\n\n' +
          'Return to the app when complete.',
          [
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Error', `Unable to open verification link`);
      }
    } catch (err) {
      console.error('Error opening link:', err);
      Alert.alert('Error', 'Failed to open verification link');
    }
  };

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/verification/status-app/${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setStatus(response.data.status);
        setVerificationData(response.data);
        
        if (response.data.status === 'completed') {
          Alert.alert(
            'Verification Complete!',
            'Your documents have been verified by Didit. Our admin team will review and approve your business shortly.',
            [
              {
                text: 'Go to Dashboard',
                onPress: () => navigation.replace('BusinessDashboard')
              }
            ]
          );
        }
      }
    } catch (err) {
      console.error('❌ Status check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !verificationData) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-gray-600 mt-4">Initializing verification...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          className="pt-12 pb-6 px-6"
        >
          <Text className="text-white text-2xl font-bold">Verification Error</Text>
        </LinearGradient>

        <View className="flex-1 justify-center items-center px-6">
          <Icon name="alert-circle" size={80} color={COLORS.error} />
          <Text className="text-gray-900 text-xl font-bold mt-6 text-center">
            Verification Failed
          </Text>
          <Text className="text-gray-600 text-center mt-3">
            {error}
          </Text>
          
          <TouchableOpacity
            onPress={initializeVerification}
            className="mt-8 bg-blue-500 px-8 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-4"
            activeOpacity={0.8}
          >
            <Text className="text-blue-500 font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="pt-12 pb-6 px-6"
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Business Verification</Text>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          
          {/* Status Badge */}
          <View className={`rounded-xl p-4 mb-6 ${
            status === 'completed' ? 'bg-green-50 border-2 border-green-300' :
            status === 'in_progress' ? 'bg-blue-50 border-2 border-blue-300' :
            status === 'failed' ? 'bg-red-50 border-2 border-red-300' :
            'bg-yellow-50 border-2 border-yellow-300'
          }`}>
            <View className="flex-row items-center">
              <Icon 
                name={
                  status === 'completed' ? 'checkmark-circle' :
                  status === 'in_progress' ? 'time' :
                  status === 'failed' ? 'close-circle' :
                  'alert-circle'
                }
                size={28}
                color={
                  status === 'completed' ? '#10B981' :
                  status === 'in_progress' ? '#3B82F6' :
                  status === 'failed' ? '#EF4444' :
                  '#F59E0B'
                }
              />
              <View className="ml-3 flex-1">
                <Text className={`font-bold text-base ${
                  status === 'completed' ? 'text-green-900' :
                  status === 'in_progress' ? 'text-blue-900' :
                  status === 'failed' ? 'text-red-900' :
                  'text-yellow-900'
                }`}>
                  {status === 'completed' ? 'Verification Complete' :
                   status === 'in_progress' ? 'Verification In Progress' :
                   status === 'failed' ? 'Verification Failed' :
                   'Verification Pending'}
                </Text>
                <Text className={`text-sm mt-1 ${
                  status === 'completed' ? 'text-green-700' :
                  status === 'in_progress' ? 'text-blue-700' :
                  status === 'failed' ? 'text-red-700' :
                  'text-yellow-700'
                }`}>
                  {status === 'completed' ? 'Awaiting admin approval' :
                   status === 'in_progress' ? 'Complete verification on Didit' :
                   status === 'failed' ? 'Please try again or contact support' :
                   'Ready to start verification'}
                </Text>
              </View>
            </View>
          </View>

          {/* Verification Steps */}
          <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-4">
              Verification Process
            </Text>
            
            <Text className="text-gray-600 mb-4">
              Complete these verification steps on Didit's secure platform:
            </Text>

            {[
              { icon: 'card', title: 'ID Verification', desc: 'Upload your government-issued ID' },
              { icon: 'person-circle', title: 'Liveness Check', desc: 'Verify you are a real person' },
              { icon: 'people', title: 'Face Match', desc: 'Match your selfie with ID photo' },
              { icon: 'home', title: 'Proof of Address', desc: 'Verify your residential address' },
              { icon: 'call', title: 'Phone Verification', desc: 'Verify your phone number' },
              { icon: 'shield-checkmark', title: 'Security Analysis', desc: 'IP and fraud detection' },
            ].map((step, index) => (
              <View key={index} className="flex-row items-start mb-4">
                <View className="bg-blue-50 rounded-full p-2 mr-3">
                  <Icon name={step.icon} size={20} color={COLORS.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold">{step.title}</Text>
                  <Text className="text-gray-500 text-sm mt-0.5">{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          {status !== 'completed' && (
            <TouchableOpacity
              onPress={openVerificationLink}
              activeOpacity={0.8}
              className="mb-4"
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                className="rounded-xl py-4 items-center flex-row justify-center"
              >
                <Icon name="open-outline" size={24} color="#FFF" />
                <Text className="text-white text-lg font-bold ml-2">
                  Start Verification on Didit
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={checkVerificationStatus}
            disabled={loading}
            className="bg-white border-2 border-blue-500 rounded-xl py-4 items-center flex-row justify-center"
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <Icon name="refresh" size={20} color={COLORS.primary} />
                <Text className="text-blue-500 font-semibold ml-2">
                  Refresh Status
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info Card */}
          <View className="bg-blue-50 rounded-xl p-4 mt-6">
            <View className="flex-row items-start">
              <Icon name="information-circle" size={24} color={COLORS.primary} />
              <View className="flex-1 ml-3">
                <Text className="text-blue-900 font-semibold mb-2">
                  Why Didit?
                </Text>
                <Text className="text-blue-700 text-sm leading-5">
                  We use Didit's secure verification platform to ensure all businesses on HashView are legitimate and trustworthy. This protects both you and our users.
                </Text>
              </View>
            </View>
          </View>

          {/* Help */}
          <View className="mt-6 items-center">
            <Text className="text-gray-500 text-sm">Need help?</Text>
            <TouchableOpacity className="mt-2">
              <Text className="text-blue-500 font-semibold">Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
