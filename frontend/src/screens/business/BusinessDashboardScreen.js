import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import ApiService from '../../services/api.service';
import COLORS from '../../config/colors';

export default function BusinessDashboardScreen({ navigation }) {
  const [business, setBusiness] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getMyBusinesses();
      if (response.businesses && response.businesses.length > 0) {
        setBusiness(response.businesses[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="flex-1 justify-center items-center"
      >
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </LinearGradient>
    );
  }

  if (!business) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="business-outline" size={80} color="#D1D5DB" />
          <Text className="text-xl font-bold text-gray-900 mt-6 mb-2">No Business Registered</Text>
          <Text className="text-gray-500 text-center mb-8">
            Register your business to start receiving reviews and managing your presence
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('BusinessRegistration')}
            className="rounded-xl px-8 py-4 shadow-lg"
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.secondary, COLORS.secondaryDark]}
              className="rounded-xl px-8 py-4"
            >
              <Text className="text-white font-bold text-base">Register Business</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="pt-12 pb-15 px-6"
      >
        <Text className="text-white text-2xl font-bold mb-2">My Business</Text>
      </LinearGradient>

      <ScrollView className="flex-1 bg-gray-50">

      <View className="px-4 -mt-0 mb-0">
        <View className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 mb-2">{business.name}</Text>
              <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
                {business.address?.fullAddress || 'No address'}
              </Text>
            </View>
          </View>

          <View className={`rounded-full px-4 py-2 self-start mb-4 ${getStatusColor(business.status)}`}>
            <Text className="text-sm font-semibold capitalize">{business.status}</Text>
          </View>

          <View className="flex-row justify-between pt-4 border-t border-gray-100">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {business.rating?.average?.toFixed(1) || '0.0'}
              </Text>
              <Text className="text-xs text-gray-500">Rating</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {business.reviewCount || 0}
              </Text>
              <Text className="text-xs text-gray-500">Reviews</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {business.rating?.count || 0}
              </Text>
              <Text className="text-xs text-gray-500">Total</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row flex-wrap justify-between mb-4">
          <TouchableOpacity 
            onPress={() => navigation.navigate('ManageCoupons', { businessId: business._id })}
            className="bg-white rounded-2xl p-4 shadow-sm items-center w-[48%] mb-3"
          >
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: '#FFF9F0' }}>
              <Icon name="ticket" size={24} color={COLORS.secondary} />
            </View>
            <Text className="text-sm font-semibold text-gray-900">Coupons</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('ViewReviews', { businessId: business._id })}
            className="bg-white rounded-2xl p-4 shadow-sm items-center w-[48%] mb-3"
          >
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: '#FFF9F0' }}>
              <Icon name="chatbubbles" size={24} color={COLORS.secondary} />
            </View>
            <Text className="text-sm font-semibold text-gray-900">Reviews</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('AnalyticsDashboard', { businessId: business._id })}
            className="bg-white rounded-2xl p-4 shadow-sm items-center w-[48%] mb-3"
          >
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: '#FFF9F0' }}>
              <Icon name="bar-chart" size={24} color={COLORS.secondary} />
            </View>
            <Text className="text-sm font-semibold text-gray-900">Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('EditBusinessInfo', { businessId: business._id })}
            className="bg-white rounded-2xl p-4 shadow-sm items-center w-[48%] mb-3"
          >
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: '#FFF9F0' }}>
              <Icon name="create" size={24} color={COLORS.secondary} />
            </View>
            <Text className="text-sm font-semibold text-gray-900">Edit Info</Text>
          </TouchableOpacity>
        </View>

        {/* Business Info */}
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">Business Information</Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center py-2">
              <Icon name="mail" size={20} color="#6B7280" />
              <Text className="text-sm text-gray-700 ml-3">{business.email}</Text>
            </View>

            <View className="flex-row items-center py-2">
              <Icon name="call" size={20} color="#6B7280" />
              <Text className="text-sm text-gray-700 ml-3">{business.phone}</Text>
            </View>

            <View className="flex-row items-center py-2">
              <Icon name="pricetag" size={20} color="#6B7280" />
              <Text className="text-sm text-gray-700 ml-3 capitalize">{business.category}</Text>
            </View>

            <View className="flex-row items-center py-2">
              <Icon name="shield-checkmark" size={20} color="#6B7280" />
              <Text className="text-sm text-gray-700 ml-3 capitalize">
                KYC: {business.kycStatus}
              </Text>
            </View>
          </View>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

