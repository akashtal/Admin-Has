import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { getBusiness } from '../../store/slices/businessSlice';
import { getBusinessReviews } from '../../store/slices/reviewSlice';
import COLORS from '../../config/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BusinessDetailScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { businessId, business, fromQR } = route.params || {};
  const { selectedBusiness, loading } = useSelector((state) => state.business);
  const { reviews } = useSelector((state) => state.review);
  const [qrBusiness, setQrBusiness] = useState(null);

  useEffect(() => {
    // If business data is provided directly (from QR scan), use it
    if (fromQR && business) {
      setQrBusiness(business);
      dispatch(getBusinessReviews({ businessId: business._id, params: { limit: 5 } }));
    } else if (businessId) {
      // Otherwise, fetch business by ID
      dispatch(getBusiness(businessId));
      dispatch(getBusinessReviews({ businessId, params: { limit: 5 } }));
    }
  }, [businessId, business, fromQR]);

  // Use QR business if available, otherwise use selectedBusiness from Redux
  const displayBusiness = fromQR ? qrBusiness : selectedBusiness;

  const handleAddReview = () => {
    navigation.navigate('AddReview', { business: displayBusiness });
  };

  if ((!fromQR && loading) || !displayBusiness) {
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
      
      {/* Cover Image or Placeholder */}
      {displayBusiness.coverImage?.url ? (
        <Image
          source={{ uri: displayBusiness.coverImage.url }}
          style={{ width: SCREEN_WIDTH, height: 200 }}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          className="h-48 items-center justify-center"
        >
          {displayBusiness.logo?.url ? (
            <Image
              source={{ uri: displayBusiness.logo.url }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
              resizeMode="cover"
            />
          ) : (
            <Icon name="business" size={80} color="#FFF" />
          )}
        </LinearGradient>
      )}

      <View className="px-6 py-4">
        {/* Logo Display */}
        {displayBusiness.logo?.url && (
          <View className="items-center -mt-20 mb-4">
            <View className="bg-white rounded-full p-2 shadow-lg">
              <Image
                source={{ uri: displayBusiness.logo.url }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
                resizeMode="cover"
              />
            </View>
          </View>
        )}
        
        <View className={displayBusiness.logo?.url ? 'mt-16' : ''}>
          <Text className="text-2xl font-bold text-gray-900 mb-2">{displayBusiness.name}</Text>
          
          <View className="flex-row items-center mb-3">
            <Icon name="star" size={20} color={COLORS.secondary} />
            <Text className="text-lg font-semibold text-gray-700 ml-2">
              {displayBusiness.rating?.average?.toFixed(1) || '0.0'}
            </Text>
            <Text className="text-sm text-gray-500 ml-2">
              ({displayBusiness.rating?.count || 0} reviews)
            </Text>
          </View>

        {/* Google Rating Display */}
        {displayBusiness.externalProfiles?.googleBusiness?.rating && (
          <View className="flex-row items-center mb-3 bg-blue-50 rounded-lg px-4 py-2">
            <Icon name="logo-google" size={18} color="#4285F4" />
            <Text className="text-base font-semibold text-gray-700 ml-2">
              Google: {displayBusiness.externalProfiles.googleBusiness.rating.toFixed(1)}
            </Text>
            <Icon name="star" size={16} color="#FFC107" style={{ marginLeft: 4 }} />
            <Text className="text-sm text-gray-500 ml-2">
              ({displayBusiness.externalProfiles.googleBusiness.reviewCount || 0} reviews)
            </Text>
          </View>
        )}

        <View className="rounded-full px-4 py-2 self-start mb-4" style={{ backgroundColor: '#FFF9F0' }}>
          <Text className="text-sm font-semibold capitalize" style={{ color: COLORS.secondary }}>
            {displayBusiness.category}
          </Text>
        </View>

        {displayBusiness.description && (
          <View className="mb-4">
            <Text className="text-base text-gray-700">{displayBusiness.description}</Text>
          </View>
        )}

        {/* Gallery Images */}
        {displayBusiness.images && displayBusiness.images.length > 0 && (
          <View className="mb-4">
            <Text className="text-xl font-bold text-gray-900 mb-3">Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {displayBusiness.images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img.url }}
                  style={{ width: 200, height: 150, borderRadius: 12, marginRight: 12 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}
        </View>

        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <View className="flex-row items-start mb-3">
            <Icon name="location" size={20} color={COLORS.secondary} />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-gray-900 mb-1">Address</Text>
              <Text className="text-sm text-gray-600">
                {displayBusiness.address?.fullAddress || 'Address not available'}
              </Text>
            </View>
          </View>

          {displayBusiness.phone && (
            <View className="flex-row items-center mb-3">
              <Icon name="call" size={20} color={COLORS.secondary} />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-900 mb-1">Phone</Text>
                <Text className="text-sm text-gray-600">{displayBusiness.phone}</Text>
              </View>
            </View>
          )}

          {displayBusiness.email && (
            <View className="flex-row items-center">
              <Icon name="mail" size={20} color={COLORS.secondary} />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-900 mb-1">Email</Text>
                <Text className="text-sm text-gray-600">{displayBusiness.email}</Text>
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

