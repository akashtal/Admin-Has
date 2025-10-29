import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { getNearbyBusinesses } from '../../store/slices/businessSlice';
import COLORS from '../../config/colors';

export default function UserHomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { businesses, loading } = useSelector((state) => state.business);
  const { user } = useSelector((state) => state.auth);
  const [location, setLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getLocationAndBusinesses();
  }, []);

  const getLocationAndBusinesses = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show nearby businesses');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      dispatch(getNearbyBusinesses({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        radius: 5000 // 5km
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getLocationAndBusinesses();
    setRefreshing(false);
  };

  const renderBusiness = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('BusinessDetail', { businessId: item._id })}
      className="bg-white rounded-2xl p-4 mb-4 shadow-lg"
    >
      <View className="flex-row">
        <View className="w-20 h-20 rounded-xl mr-4 items-center justify-center" style={{ backgroundColor: '#FFF9F0' }}>
          <Icon name="business" size={32} color={COLORS.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 mb-1">{item.name}</Text>
          <View className="flex-row items-center mb-1">
            <Icon name="star" size={16} color={COLORS.primary} />
            <Text className="text-sm text-gray-600 ml-1">
              {item.rating?.average?.toFixed(1) || '0.0'} ({item.rating?.count || 0} reviews)
            </Text>
          </View>
          <View className="flex-row items-center mb-1">
            <Icon name="location-outline" size={14} color="#6B7280" />
            <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
              {item.address?.city || 'Unknown location'}
            </Text>
          </View>
          <View className="rounded-full px-3 py-1 self-start mt-1" style={{ backgroundColor: '#FFF9F0' }}>
            <Text className="text-xs font-semibold capitalize" style={{ color: COLORS.secondary }}>{item.category}</Text>
          </View>
        </View>
        <Icon name="chevron-forward" size={24} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="pt-12 pb-6 px-6 rounded-b-3xl shadow-lg"
      >
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white text-2xl font-bold">Welcome back,</Text>
            <Text className="text-white text-2xl font-bold">{user?.name}!</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Coupons')}>
            <View className="bg-white rounded-full w-12 h-12 items-center justify-center">
              <Icon name="gift" size={24} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row bg-white rounded-xl p-4 items-center">
          <Icon name="location" size={20} color={COLORS.primary} />
          <Text className="flex-1 ml-2 text-gray-700 font-medium">
            {location ? 'Showing nearby businesses' : 'Getting your location...'}
          </Text>
          <TouchableOpacity onPress={getLocationAndBusinesses}>
            <Icon name="refresh" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View className="flex-1 px-6 mt-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Nearby Businesses</Text>
          <Text className="text-sm text-gray-500">{businesses.length} found</Text>
        </View>

        {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text className="text-gray-500 mt-4">Loading businesses...</Text>
          </View>
        ) : businesses.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Icon name="business-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 text-center">
              No businesses found nearby
            </Text>
            <TouchableOpacity
              onPress={getLocationAndBusinesses}
              className="mt-4"
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.secondary, COLORS.secondaryDark]}
                className="rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold">Refresh</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={businesses}
            renderItem={renderBusiness}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

