import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { createReview, clearSuccessMessage } from '../../store/slices/reviewSlice';
import COLORS from '../../config/colors';

export default function AddReviewScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { business } = route.params;
  const { loading, successMessage, error } = useSelector((state) => state.review);
  
  // Form state
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
  });
  
  // Location state (lightweight!)
  const [location, setLocation] = useState(null);
  const [checkingLocation, setCheckingLocation] = useState(true);
  const [showGeofenceInfo, setShowGeofenceInfo] = useState(true); // Show info popup first
  
  // Business radius from backend
  const MAX_ALLOWED_RADIUS = business.radius || 500;

  // No cleanup needed - we don't have any subscriptions/timers!

  useEffect(() => {
    if (successMessage) {
      Alert.alert('Success!', successMessage + '\n\nYou\'ve earned a coupon!', [
        {
          text: 'View Coupon',
          onPress: () => {
            dispatch(clearSuccessMessage());
            navigation.navigate('Coupons');
          }
        },
        {
          text: 'OK',
          onPress: () => {
            dispatch(clearSuccessMessage());
            navigation.goBack();
          }
        }
      ]);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  // LIGHTWEIGHT: Quick location check only (2-3 seconds)
  const initializeLocationVerification = async () => {
    try {
      // Step 1: Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showDetailedError(
          'Permission Required',
          'We need your location to verify you are at the business. This ensures review authenticity.',
          'PERMISSION_DENIED'
        );
        return;
      }

      // Step 2: Check if location services are enabled
      const locationEnabled = await Location.hasServicesEnabledAsync();
      if (!locationEnabled) {
        showDetailedError(
          'Enable Location Services',
          'Please turn on GPS/Location in your device settings to continue.',
          'LOCATION_DISABLED'
        );
        return;
      }

      // Step 3: Quick location check (one-time only!)
      console.log('📍 Getting current location...');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Fast & accurate enough
        maximumAge: 10000, // Use 10-second cache
        timeout: 3000, // Only wait 3 seconds
      });

      // Step 4: Calculate distance to business (LIGHTWEIGHT CLIENT-SIDE)
      const businessLat = business.location.coordinates[1];
      const businessLon = business.location.coordinates[0];
      const userLat = currentLocation.coords.latitude;
      const userLon = currentLocation.coords.longitude;

      const distance = calculateDistance(userLat, userLon, businessLat, businessLon);

      console.log(`📏 Distance: ${distance.toFixed(1)}m (limit: ${MAX_ALLOWED_RADIUS}m)`);

      // Step 5: Frontend check (quick feedback to user)
      if (distance > MAX_ALLOWED_RADIUS) {
        showDetailedError(
          'Outside Business Radius',
          `You are outside the business radius (${Math.round(distance)}m away).\n\nPlease visit the business location to leave a review.\n\nRequired: Within ${MAX_ALLOWED_RADIUS}m`,
          'OUT_OF_RANGE'
        );
        return;
      }

      // Step 6: Store location and show form
      setLocation(currentLocation);
      setCheckingLocation(false);
      
      console.log('✅ Location check passed! User can now write review.');
      console.log('🔒 Backend will validate again when review is submitted.');
      
    } catch (error) {
      console.error('❌ Location error:', error);
      
      if (error.code === 'E_LOCATION_TIMEOUT') {
        showDetailedError(
          'GPS Signal Issue',
          'Could not get your location quickly enough.\n\nPlease ensure:\n• GPS is enabled\n• You are not indoors or in a covered area\n• Your device has clear sky view',
          'TIMEOUT'
        );
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        showDetailedError(
          'Location Unavailable',
          'Your device location is temporarily unavailable. Please check your GPS settings and try again.',
          'UNAVAILABLE'
        );
      } else {
        showDetailedError(
          'Location Error',
          'Unable to access your location. Please check that Location Services are enabled in your device settings.',
          'UNKNOWN_ERROR'
        );
      }
    }
  };

  // NO MORE HEAVY MONITORING - All removed for lightweight frontend!

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Show detailed error with helpful guidance
  const showDetailedError = (title, message, errorCode) => {
    const buttons = [];
    
    // For "OUT_OF_RANGE", don't offer retry - they need to physically move
    if (errorCode === 'OUT_OF_RANGE') {
      buttons.push({
        text: 'OK, I Understand',
        onPress: () => navigation.goBack()
      });
    } else {
      // For other errors, offer retry
      buttons.push(
        {
          text: 'Retry',
          onPress: () => {
            setShowGeofenceInfo(true);
            setCheckingLocation(true);
          }
        },
        {
          text: 'Cancel',
          onPress: () => navigation.goBack(),
          style: 'cancel'
        }
      );
    }
    
    Alert.alert(
      title,
      message,
      buttons,
      { cancelable: false }
    );
  };

  // LIGHTWEIGHT: Simple submit - Backend will do all validation!
  const handleSubmit = () => {
    // Basic frontend validations
    if (formData.rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (formData.comment.length < 10) {
      Alert.alert('Error', 'Please write at least 10 characters');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    // Send to backend - backend will do ALL security checks!
    dispatch(createReview({
      business: business._id,
      rating: formData.rating,
      comment: formData.comment,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }));
    
    console.log('✅ Review submitted! Backend will validate location and all security checks.');
  };

  // Show geofence info popup first
  if (showGeofenceInfo) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-6">
        <View className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
          <View className="items-center mb-4">
            <Icon name="location" size={48} color={COLORS.secondary} />
          </View>
          
          <Text className="text-xl font-bold text-gray-900 text-center mb-3">
            Location Verification Required
          </Text>
          
          <Text className="text-gray-600 text-center mb-4 leading-6">
            To ensure authentic reviews, you must be within {MAX_ALLOWED_RADIUS}m of the business location.
            {'\n\n'}
            We'll quickly verify your location before you can write a review.
          </Text>
          
          <View className="bg-yellow-50 rounded-xl p-4 mb-4 border border-yellow-200">
            <View className="flex-row items-start">
              <Icon name="information-circle" size={20} color="#F59E0B" />
              <Text className="text-sm text-gray-700 ml-2 flex-1">
                This helps prevent fake reviews and ensures all reviews come from real visitors.
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => {
              setShowGeofenceInfo(false);
              initializeLocationVerification();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.secondary, COLORS.secondaryDark]}
              className="rounded-xl py-4 items-center"
            >
              <Text className="text-white font-bold text-lg">Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-3 py-3 items-center"
          >
            <Text className="text-gray-500 font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Quick location check (2-3 seconds)
  if (checkingLocation) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text className="text-gray-700 font-semibold mt-4 text-center px-8">
          Checking your location...
        </Text>
        <Text className="text-gray-400 text-sm mt-2 text-center px-8">
          This will only take 2-3 seconds
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-6 py-6">
      {/* Business Info */}
      <View className="bg-gray-50 rounded-xl p-4 mb-4">
        <Text className="text-lg font-bold text-gray-900 mb-2">{business.name}</Text>
        <View className="flex-row items-center">
          <Icon name="location" size={16} color={COLORS.secondary} />
          <Text className="text-sm text-gray-600 ml-1">
            {business.address?.city || 'Unknown location'}
          </Text>
        </View>
      </View>

      {/* Rating */}
      <Text className="text-xl font-bold text-gray-900 mb-4">Rate Your Experience</Text>

      <View className="flex-row justify-center items-center mb-6 py-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setFormData({ ...formData, rating: star })}
            className="mx-1"
          >
            <Icon
              name={formData.rating >= star ? 'star' : 'star-outline'}
              size={48}
              color={formData.rating >= star ? COLORS.secondary : '#E5E7EB'}
            />
          </TouchableOpacity>
        ))}
      </View>

      {formData.rating > 0 && (
        <Text className="text-center text-lg font-semibold mb-6" style={{ color: COLORS.secondary }}>
          {formData.rating === 5 ? 'Excellent!' : 
           formData.rating === 4 ? 'Great!' :
           formData.rating === 3 ? 'Good' :
           formData.rating === 2 ? 'Could be better' : 'Poor'}
        </Text>
      )}

      {/* Comment */}
      <Text className="text-lg font-bold text-gray-900 mb-3">Write Your Review</Text>
      
      <TextInput
        className="bg-gray-50 rounded-xl p-4 text-gray-900 mb-6"
        placeholder="Share your experience..."
        value={formData.comment}
        onChangeText={(text) => setFormData({ ...formData, comment: text })}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        maxLength={500}
      />

      <Text className="text-xs text-gray-500 mb-6 text-right">
        {formData.comment.length}/500 characters
      </Text>

      {/* Coupon Reward Info */}
      <View className="bg-green-50 rounded-xl p-4 mb-6">
        <View className="flex-row items-center mb-2">
          <Icon name="gift" size={20} color={COLORS.secondary} />
          <Text className="text-sm font-bold text-green-700 ml-2">Earn a Coupon!</Text>
        </View>
        <Text className="text-xs text-green-600">
          Post your review and receive a special discount coupon valid for 2 hours!
        </Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.secondary, COLORS.secondaryDark]}
          className="rounded-xl py-4 items-center shadow-lg"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Submit Review</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}
