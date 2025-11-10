import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
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
  
  // Location state
  const [location, setLocation] = useState(null);
  const [currentDistance, setCurrentDistance] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [checkingLocation, setCheckingLocation] = useState(true);
  const [verificationTime, setVerificationTime] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [showGeofenceInfo, setShowGeofenceInfo] = useState(true); // Show info popup first
  
  // Security & monitoring state
  const [locationHistory, setLocationHistory] = useState([]);
  const [motionDetected, setMotionDetected] = useState(false);
  const [isMockLocation, setIsMockLocation] = useState(false);
  const [locationProvider, setLocationProvider] = useState('unknown');
  
  // Refs
  const locationSubscription = useRef(null);
  const verificationTimer = useRef(null);
  const accelerometerSubscription = useRef(null);

  // Verification requirements
  const REQUIRED_VERIFICATION_TIME = 30; // 30 seconds
  const MAX_GPS_ACCURACY = 50; // 50 meters
  const MAX_ALLOWED_RADIUS = business.radius || 500;

  useEffect(() => {
    // Show info popup first, don't start verification yet
    // Verification will start after user acknowledges popup
    
    return () => {
      // Cleanup on unmount
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (verificationTimer.current) {
        clearInterval(verificationTimer.current);
      }
      if (accelerometerSubscription.current) {
        accelerometerSubscription.current.remove();
      }
    };
  }, []);

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

  // Quick location verification (2-3 seconds max)
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

      // Step 3: Quick location check (2-3 seconds, not 15!)
      console.log('📍 Quick location check...');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Faster than High
        maximumAge: 10000, // Use 10-second cache for speed
        timeout: 3000, // Only wait 3 seconds
      });

      // Step 4: Validate GPS accuracy
      const accuracy = currentLocation.coords.accuracy;
      setLocationAccuracy(accuracy);
      
      console.log(`📡 GPS Accuracy: ${accuracy.toFixed(1)}m`);
      
      if (accuracy > MAX_GPS_ACCURACY) {
        showDetailedError(
          'Poor GPS Signal',
          `GPS accuracy is ${Math.round(accuracy)}m. We need better than ${MAX_GPS_ACCURACY}m for verification.\n\nTips:\n• Move to an open area\n• Step outside if indoors\n• Wait for better GPS signal`,
          'POOR_ACCURACY'
        );
        return;
      }

      // Step 5: Detect mock location (Android)
      if (Platform.OS === 'android') {
        const isMock = currentLocation.mocked || false;
        setIsMockLocation(isMock);
        
        if (isMock) {
          console.warn('⚠️ Mock location detected!');
          showDetailedError(
            'Mock Location Detected',
            'Please disable "Mock Location" or "Fake GPS" apps and try again.',
            'MOCK_LOCATION'
          );
          return;
        }
      }

      // Step 6: Calculate distance to business
      const businessLat = business.location.coordinates[1];
      const businessLon = business.location.coordinates[0];
      const userLat = currentLocation.coords.latitude;
      const userLon = currentLocation.coords.longitude;

      const distance = calculateDistance(userLat, userLon, businessLat, businessLon);
      setCurrentDistance(distance);

      console.log(`📏 Distance to business: ${distance.toFixed(1)}m (limit: ${MAX_ALLOWED_RADIUS}m)`);

      // Step 7: Check if within geofence
      if (distance > MAX_ALLOWED_RADIUS) {
        showDetailedError(
          'Outside Business Radius',
          `You are outside the business radius (${Math.round(distance)}m away).\n\nPlease visit the business location to leave a review.\n\nRequired: Within ${MAX_ALLOWED_RADIUS}m`,
          'OUT_OF_RANGE'
        );
        return;
      }

      // Step 8: Store initial location
      setLocation(currentLocation);
      addToLocationHistory(currentLocation, distance);

      // Step 9: Start continuous monitoring
      startContinuousLocationMonitoring();

      // Step 10: Start motion detection
      startMotionDetection();

      // Step 11: Start verification timer
      startVerificationTimer();

      // Step 12: Success - show form immediately
      setCheckingLocation(false);
      
      console.log('✅ Quick location check passed! Showing review form...');
      console.log('📊 Background monitoring started (30-second verification running)');
      
    } catch (error) {
      console.error('❌ Location verification error:', error);
      
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

  // Continuous location monitoring
  const startContinuousLocationMonitoring = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000, // Update every 3 seconds
          distanceInterval: 5, // Or when user moves 5 meters
        },
        (newLocation) => {
          handleLocationUpdate(newLocation);
        }
      );
      
      console.log('🔄 Continuous location monitoring started');
    } catch (error) {
      console.error('Failed to start location monitoring:', error);
    }
  };

  // Handle location updates
  const handleLocationUpdate = (newLocation) => {
    const businessLat = business.location.coordinates[1];
    const businessLon = business.location.coordinates[0];
    const userLat = newLocation.coords.latitude;
    const userLon = newLocation.coords.longitude;

    const distance = calculateDistance(userLat, userLon, businessLat, businessLon);
    
    setCurrentDistance(distance);
    setLocationAccuracy(newLocation.coords.accuracy);
    
    // Check for teleportation (sudden jumps)
    if (locationHistory.length > 0) {
      const lastLocation = locationHistory[locationHistory.length - 1];
      const timeDiff = (newLocation.timestamp - lastLocation.timestamp) / 1000; // seconds
      const distanceMoved = calculateDistance(
        lastLocation.coords.latitude,
        lastLocation.coords.longitude,
        userLat,
        userLon
      );
      
      // If moved more than 100m in 3 seconds = suspicious (33m/s = 120 km/h)
      if (distanceMoved > 100 && timeDiff < 5) {
        console.warn('⚠️ Teleportation detected!', {
          distanceMoved: distanceMoved.toFixed(1),
          timeDiff: timeDiff.toFixed(1),
          speed: (distanceMoved / timeDiff).toFixed(1) + ' m/s'
        });
        
        Alert.alert(
          'Suspicious Movement',
          'Detected unusual location changes. Please stay at the business location.',
          [{ text: 'OK' }]
        );
      }
    }
    
    // Add to history
    addToLocationHistory(newLocation, distance);
    
    // Check if user moved out of range
    if (distance > MAX_ALLOWED_RADIUS) {
      Alert.alert(
        'Outside Business Radius',
        `You have moved ${Math.round(distance)}m away from the business.\n\nPlease return to the business location to complete your review.\n\nRequired: Within ${MAX_ALLOWED_RADIUS}m`,
        [
          { text: 'OK, I Understand', onPress: () => navigation.goBack() }
        ],
        { cancelable: false }
      );
    }
    
    console.log(`📍 Location updated: ${distance.toFixed(1)}m away, accuracy: ${newLocation.coords.accuracy.toFixed(1)}m`);
  };

  // Add location to history
  const addToLocationHistory = (loc, distance) => {
    setLocationHistory(prev => {
      const newHistory = [...prev, {
        coords: loc.coords,
        timestamp: loc.timestamp,
        distance: distance,
        accuracy: loc.coords.accuracy
      }];
      
      // Keep only last 10 locations
      return newHistory.slice(-10);
    });
  };

  // Start verification timer
  const startVerificationTimer = () => {
    verificationTimer.current = setInterval(() => {
      setVerificationTime(prev => {
        const newTime = prev + 1;
        
        if (newTime >= REQUIRED_VERIFICATION_TIME && !isVerified) {
          setIsVerified(true);
          console.log('✅ 30-second verification complete!');
        }
        
        return newTime;
      });
    }, 1000);
  };

  // Start motion detection
  const startMotionDetection = () => {
    accelerometerSubscription.current = Accelerometer.addListener(accelerometerData => {
      const { x, y, z } = accelerometerData;
      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
      
      // If acceleration > 1.1 (slightly more than gravity), motion detected
      if (totalAcceleration > 1.1 && !motionDetected) {
        setMotionDetected(true);
        console.log('🚶 Motion detected - user is present');
      }
    });
    
    Accelerometer.setUpdateInterval(1000); // Check every second
  };

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

  // Handle report issue
  const handleReportIssue = (errorCode) => {
    Alert.alert(
      'Report Geofencing Issue',
      `We've recorded your issue (Code: ${errorCode}).\n\nOur team will review your case. If you believe you are at the correct location, you can contact support with this code.`,
      [
        {
          text: 'Contact Support',
          onPress: () => {
            // TODO: Navigate to support/chat screen
            console.log('Opening support with error code:', errorCode);
          }
        },
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
    
    // Log to backend for manual review
    console.log('📝 Issue reported:', {
      errorCode,
      business: business._id,
      location: location?.coords,
      timestamp: new Date().toISOString()
    });
  };

  // Handle submit with final validation
  const handleSubmit = () => {
    // Validation 1: Rating
    if (formData.rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    // Validation 2: Comment length
    if (formData.comment.length < 10) {
      Alert.alert('Error', 'Please write at least 10 characters');
      return;
    }

    // Validation 3: Location available
    if (!location) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    // Validation 4: Still within radius
    if (currentDistance > MAX_ALLOWED_RADIUS) {
      Alert.alert(
        'Outside Business Radius',
        `You've moved ${Math.round(currentDistance)}m away from the business.\n\nPlease return to the business location within ${MAX_ALLOWED_RADIUS}m to submit your review.`,
        [{ text: 'OK, I Understand' }]
      );
      return;
    }

    // Validation 5: GPS accuracy still good
    if (locationAccuracy > MAX_GPS_ACCURACY) {
      Alert.alert(
        'GPS Signal Issue',
        `Your GPS accuracy has degraded to ${Math.round(locationAccuracy)}m.\n\nPlease move to an area with better GPS signal (outdoor/near window) and try again.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Validation 6: Verification time (recommended, not required for quick reviews)
    if (verificationTime < REQUIRED_VERIFICATION_TIME) {
      Alert.alert(
        'Quick Review Detected',
        `For enhanced security, we recommend staying at the location for ${REQUIRED_VERIFICATION_TIME} seconds.\n\nYou've been here for ${verificationTime} seconds.\n\nProceed anyway?`,
        [
          { text: 'Wait Longer', style: 'cancel' },
          { text: 'Submit Now', onPress: () => submitReview() }
        ]
      );
      return;
    }

    submitReview();
  };

  // Submit review
  const submitReview = () => {
    // Include security metadata
    const reviewData = {
      business: business._id,
      rating: formData.rating,
      comment: formData.comment,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      // Security metadata
      locationAccuracy: locationAccuracy,
      verificationTime: verificationTime,
      motionDetected: motionDetected,
      isMockLocation: isMockLocation,
      locationHistoryCount: locationHistory.length,
      devicePlatform: Platform.OS,
    };

    dispatch(createReview(reviewData));
  };

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get verification status color
  const getVerificationColor = () => {
    if (isVerified) return '#10B981'; // Green
    if (verificationTime >= REQUIRED_VERIFICATION_TIME / 2) return '#F59E0B'; // Orange
    return '#6B7280'; // Gray
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

      {/* Real-time Distance & Verification Status */}
      <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <Icon name="navigate-circle" size={20} color={COLORS.secondary} />
            <Text className="text-sm font-semibold text-gray-700 ml-2">
              Distance: {currentDistance ? Math.round(currentDistance) : '---'}m
            </Text>
          </View>
          <View className="flex-row items-center">
            <Icon name="radio-button-on" size={12} color={getVerificationColor()} />
            <Text className="text-xs text-gray-600 ml-1">
              GPS: {locationAccuracy ? Math.round(locationAccuracy) : '--'}m
            </Text>
          </View>
        </View>
        
        {/* Verification Timer */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Icon 
              name={isVerified ? "checkmark-circle" : "time-outline"} 
              size={20} 
              color={getVerificationColor()} 
            />
            <Text className="text-sm ml-2" style={{ color: getVerificationColor() }}>
              {isVerified ? 'Verified ✓' : `Verifying... ${formatTime(verificationTime)}/${formatTime(REQUIRED_VERIFICATION_TIME)}`}
            </Text>
          </View>
          
          {motionDetected && (
            <View className="flex-row items-center">
              <Icon name="walk" size={16} color="#10B981" />
              <Text className="text-xs text-green-600 ml-1">Active</Text>
            </View>
          )}
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
