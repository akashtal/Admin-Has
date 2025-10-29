import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { getBusiness } from '../../store/slices/businessSlice';
import { getBusinessReviews } from '../../store/slices/reviewSlice';
import COLORS from '../../config/colors';

export default function BusinessDetailScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { businessId } = route.params;
  const { selectedBusiness, loading } = useSelector((state) => state.business);
  const { reviews } = useSelector((state) => state.review);

  useEffect(() => {
    dispatch(getBusiness(businessId));
    dispatch(getBusinessReviews({ businessId, params: { limit: 5 } }));
  }, [businessId]);

  const handleAddReview = () => {
    navigation.navigate('AddReview', { business: selectedBusiness });
  };

  if (loading || !selectedBusiness) {
    return (
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="flex-1 justify-center items-center"
      >
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </LinearGradient>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="h-48 items-center justify-center"
      >
        <Icon name="business" size={80} color="#FFF" />
      </LinearGradient>

      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">{selectedBusiness.name}</Text>
        
        <View className="flex-row items-center mb-3">
          <Icon name="star" size={20} color={COLORS.secondary} />
          <Text className="text-lg font-semibold text-gray-700 ml-2">
            {selectedBusiness.rating?.average?.toFixed(1) || '0.0'}
          </Text>
          <Text className="text-sm text-gray-500 ml-2">
            ({selectedBusiness.rating?.count || 0} reviews)
          </Text>
        </View>

        <View className="rounded-full px-4 py-2 self-start mb-4" style={{ backgroundColor: '#FFF9F0' }}>
          <Text className="text-sm font-semibold capitalize" style={{ color: COLORS.secondary }}>
            {selectedBusiness.category}
          </Text>
        </View>

        {selectedBusiness.description && (
          <View className="mb-4">
            <Text className="text-base text-gray-700">{selectedBusiness.description}</Text>
          </View>
        )}

        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <View className="flex-row items-start mb-3">
            <Icon name="location" size={20} color={COLORS.secondary} />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-gray-900 mb-1">Address</Text>
              <Text className="text-sm text-gray-600">
                {selectedBusiness.address?.fullAddress || 'Address not available'}
              </Text>
            </View>
          </View>

          {selectedBusiness.phone && (
            <View className="flex-row items-center mb-3">
              <Icon name="call" size={20} color={COLORS.secondary} />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-900 mb-1">Phone</Text>
                <Text className="text-sm text-gray-600">{selectedBusiness.phone}</Text>
              </View>
            </View>
          )}

          {selectedBusiness.email && (
            <View className="flex-row items-center">
              <Icon name="mail" size={20} color={COLORS.secondary} />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-900 mb-1">Email</Text>
                <Text className="text-sm text-gray-600">{selectedBusiness.email}</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={handleAddReview}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.secondary, COLORS.secondaryDark]}
            className="rounded-xl py-4 items-center shadow-lg mb-6"
          >
            <View className="flex-row items-center">
              <Icon name="star" size={20} color="#FFF" />
              <Text className="text-white font-bold text-base ml-2">Write a Review</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-900 mb-4">Recent Reviews</Text>

        {reviews.length === 0 ? (
          <View className="items-center py-8">
            <Icon name="chatbubbles-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-500 mt-2">No reviews yet</Text>
            <Text className="text-gray-400 text-sm">Be the first to review!</Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review._id} className="bg-gray-50 rounded-xl p-4 mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#FFF9F0' }}>
                    <Text className="font-bold" style={{ color: COLORS.secondary }}>
                      {review.user?.name?.charAt(0) || 'U'}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-gray-900">
                      {review.user?.name || 'Anonymous'}
                    </Text>
                    <View className="flex-row items-center">
                      {[...Array(5)].map((_, i) => (
                        <Icon
                          key={i}
                          name="star"
                          size={12}
                          color={i < review.rating ? COLORS.secondary : '#E5E7EB'}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                <Text className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text className="text-sm text-gray-700">{review.comment}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

