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
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
  });
  const [location, setLocation] = useState(null);
  const [checkingLocation, setCheckingLocation] = useState(true);

  useEffect(() => {
    checkUserLocation();
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

  const checkUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to post a review');
        navigation.goBack();
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Calculate distance to business
      const businessLat = business.location.coordinates[1];
      const businessLon = business.location.coordinates[0];
      const userLat = currentLocation.coords.latitude;
      const userLon = currentLocation.coords.longitude;

      const distance = calculateDistance(userLat, userLon, businessLat, businessLon);

      if (distance > business.radius) {
        Alert.alert(
          'Too Far Away',
          `You must be within ${business.radius}m of the business to post a review. You are currently ${Math.round(distance)}m away.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
          { cancelable: false } // Prevent dismissing by tapping outside
        );
        // Don't set checkingLocation to false - force user to go back
        return;
      }

      setCheckingLocation(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to get your location');
      navigation.goBack();
    }
  };

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

  const handleSubmit = () => {
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

    dispatch(createReview({
      business: business._id,
      rating: formData.rating,
      comment: formData.comment,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }));
  };

  if (checkingLocation) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text className="text-gray-500 mt-4">Verifying your location...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-6 py-6">
      <View className="bg-gray-50 rounded-xl p-4 mb-6">
        <Text className="text-lg font-bold text-gray-900 mb-2">{business.name}</Text>
        <View className="flex-row items-center">
          <Icon name="location" size={16} color={COLORS.secondary} />
          <Text className="text-sm text-gray-600 ml-1">
            {business.address?.city || 'Unknown location'}
          </Text>
        </View>
      </View>

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

      <View className="bg-green-50 rounded-xl p-4 mb-6">
        <View className="flex-row items-center mb-2">
          <Icon name="gift" size={20} color={COLORS.secondary} />
          <Text className="text-sm font-bold text-green-700 ml-2">Earn a Coupon!</Text>
        </View>
        <Text className="text-xs text-green-600">
          Post your review and receive a special discount coupon valid for 2 hours!
        </Text>
      </View>

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

