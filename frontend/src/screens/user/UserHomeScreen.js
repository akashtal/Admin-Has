import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { getAllActiveBusinesses, getNearbyBusinesses } from '../../store/slices/businessSlice';
import COLORS from '../../config/colors';

export default function UserHomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { businesses, nearbyBusinesses, loading } = useSelector((state) => state.business);
  const { user } = useSelector((state) => state.auth);
  const [locationPermission, setLocationPermission] = useState(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    // Load all businesses first (regardless of location)
    dispatch(getAllActiveBusinesses());
    
    // Check location permission
    await checkLocationPermission();
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
      if (status === 'granted') {
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationPermission('denied');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      setHasLocation(true);
      
      // Get nearby businesses
      dispatch(getNearbyBusinesses({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        radius: 50000 // 50km
      }));
    } catch (error) {
      console.error('Error getting location:', error);
      setHasLocation(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        await getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission',
          'Location access is needed to show nearby businesses. You can enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeScreen();
    setRefreshing(false);
  };

  // Determine which businesses to show
  const displayBusinesses = hasLocation && nearbyBusinesses.length > 0 ? nearbyBusinesses : businesses;
  const isShowingNearby = hasLocation && nearbyBusinesses.length > 0;

  const renderBusiness = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('BusinessDetail', { businessId: item._id })}
      className="bg-white rounded-xl p-3 mb-3 shadow-md overflow-hidden"
      style={{ height: 140 }}
    >
      <View className="flex-row h-full">
        {/* Logo/Image Section - Left Side */}
        <View className="w-24 h-full mr-3 rounded-lg overflow-hidden" style={{ backgroundColor: '#FFF9F0' }}>
          {item.coverImage?.url ? (
            <Image
              source={{ uri: item.coverImage.url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : item.logo?.url ? (
            <View className="w-full h-full items-center justify-center">
              <Image
                source={{ uri: item.logo.url }}
                style={{ width: 70, height: 70, borderRadius: 8 }}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Icon name="business" size={40} color={COLORS.primary} />
            </View>
          )}
        </View>

        {/* Content Section - Right Side */}
        <View className="flex-1 justify-between">
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={1}>
              {item.name}
            </Text>
            <View className="flex-row items-center mb-1">
              <Icon name="star" size={14} color={COLORS.primary} />
              <Text className="text-xs text-gray-600 ml-1">
                {item.rating?.average?.toFixed(1) || '0.0'} ({item.rating?.count || 0})
              </Text>
            </View>
            <View className="flex-row items-center mb-1">
              <Icon name="location-outline" size={12} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1 flex-1" numberOfLines={1}>
                {item.address?.fullAddress || item.address?.city || 'Unknown'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="rounded-full px-2 py-1" style={{ backgroundColor: '#FFF9F0' }}>
              <Text className="text-xs font-semibold capitalize" style={{ color: COLORS.secondary }}>
                {item.category}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#D1D5DB" />
          </View>
        </View>
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
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-white text-2xl font-bold">Welcome back,</Text>
            <Text className="text-white text-2xl font-bold">{user?.name}!</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => navigation.navigate('QRScanner')}>
              <View className="bg-white rounded-full w-12 h-12 items-center justify-center">
                <Icon name="qr-code" size={24} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Coupons')}>
              <View className="bg-white rounded-full w-12 h-12 items-center justify-center">
                <Icon name="gift" size={24} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          className="bg-white rounded-xl p-4 flex-row items-center mb-3"
        >
          <Icon name="search" size={20} color={COLORS.primary} />
          <Text className="flex-1 ml-3 text-gray-500">Search businesses...</Text>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Location Permission Notification */}
        {locationPermission !== 'granted' && (
          <TouchableOpacity
            onPress={requestLocationPermission}
            className="bg-white/20 rounded-xl p-3 flex-row items-center"
            activeOpacity={0.8}
          >
            <Icon name="location-outline" size={20} color="#FFF" />
            <View className="flex-1 ml-3">
              <Text className="text-white font-semibold text-sm">
                Enable location to see nearby businesses
              </Text>
              <Text className="text-white/80 text-xs mt-1">
                Tap to allow location access
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      <View className="flex-1 px-6 mt-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">
            {isShowingNearby ? 'Nearby Businesses' : 'All Businesses'}
          </Text>
          <Text className="text-sm text-gray-500">{displayBusinesses.length} found</Text>
        </View>

        {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text className="text-gray-500 mt-4">Loading businesses...</Text>
          </View>
        ) : displayBusinesses.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Icon name="business-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 text-center">
              {isShowingNearby ? 'No businesses found nearby' : 'No businesses available'}
            </Text>
            <TouchableOpacity
              onPress={onRefresh}
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
            data={displayBusinesses}
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
