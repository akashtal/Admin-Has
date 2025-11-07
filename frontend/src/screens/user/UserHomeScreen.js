import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { getAllActiveBusinesses, getNearbyBusinesses } from '../../store/slices/businessSlice';
import COLORS from '../../config/colors';
import { FLATLIST_OPTIMIZATIONS, optimizeImageUri } from '../../utils/performanceHelpers';

export default function UserHomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { businesses, nearbyBusinesses, loading } = useSelector((state) => state.business);
  const { user } = useSelector((state) => state.auth);
  const [locationPermission, setLocationPermission] = useState(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Star-based rating filter states
  const [ratingFilter, setRatingFilter] = useState({
    source: null, // 'hashview', 'google', or 'tripadvisor'
    stars: null   // 3, 4, or 5
  });
  
  // Distance filter state
  const [distanceFilter, setDistanceFilter] = useState(null); // 'nearme', '1km', '5km', '10km', '25km'

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

  // Fetch businesses with server-side star-based rating and distance filters
  const fetchFilteredBusinesses = useCallback(async () => {
    const params = {};
    
    // Only apply rating filters if both source and stars are selected
    if (ratingFilter.source && ratingFilter.stars) {
      params.ratingSource = ratingFilter.source;
      params.minRating = ratingFilter.stars;
    }

    // Add distance filter if selected
    if (distanceFilter) {
      params.distance = distanceFilter;
    }

    // If location available, get nearby businesses with filters
    if (hasLocation) {
      await dispatch(getNearbyBusinesses({ 
        ...params,
        latitude: user?.location?.coordinates?.[1],
        longitude: user?.location?.coordinates?.[0]
      }));
    } else {
      // Get all active businesses with filters (no distance filter without location)
      await dispatch(getAllActiveBusinesses(params));
    }
  }, [ratingFilter, distanceFilter, hasLocation, user, dispatch]); // Close useCallback with dependencies

  // Memoize onRefresh to prevent recreation on every render
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFilteredBusinesses();
    setRefreshing(false);
  }, [fetchFilteredBusinesses]);

  // Re-fetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchFilteredBusinesses();
    }
  }, [ratingFilter.source, ratingFilter.stars, distanceFilter, fetchFilteredBusinesses]);

  // Determine which businesses to show (memoized for performance)
  const displayBusinesses = useMemo(() => {
    return hasLocation && nearbyBusinesses.length > 0 ? nearbyBusinesses : businesses;
  }, [hasLocation, nearbyBusinesses, businesses]);
  
  const isShowingNearby = hasLocation && nearbyBusinesses.length > 0;

  // Memoize renderBusiness to prevent unnecessary re-renders
  const renderBusiness = useCallback(({ item }) => (
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
              source={{ uri: optimizeImageUri(item.coverImage.url, 200, 80) }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              cache="force-cache"
            />
          ) : item.logo?.url ? (
            <View className="w-full h-full items-center justify-center">
              <Image
                source={{ uri: optimizeImageUri(item.logo.url, 150, 85) }}
                style={{ width: 70, height: 70, borderRadius: 8 }}
                resizeMode="cover"
                cache="force-cache"
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
  ), [navigation]); // Close useCallback with navigation dependency

  // Memoize key extractor
  const keyExtractor = useCallback((item) => item._id, []);

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

        {/* Star-Based Rating Filters */}
        <View className="mb-3">
          <Text className="text-white text-sm font-semibold mb-2">Filter by Rating:</Text>
          
          {/* Rating Source Selection */}
          <Text className="text-white text-xs mb-1 opacity-80">Step 1: Select Source</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setRatingFilter({ source: ratingFilter.source === 'hashview' ? null : 'hashview', stars: null })}
                className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                style={{ 
                  backgroundColor: ratingFilter.source === 'hashview' ? '#FFF' : 'rgba(255,255,255,0.2)',
                  borderWidth: 1,
                  borderColor: ratingFilter.source === 'hashview' ? COLORS.secondary : '#FFF'
                }}
              >
                <Icon name="star" size={16} color={ratingFilter.source === 'hashview' ? COLORS.secondary : '#FFF'} />
                <Text className={`ml-1 font-semibold text-xs ${ratingFilter.source === 'hashview' ? 'text-gray-900' : 'text-white'}`}>
                  HashView
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRatingFilter({ source: ratingFilter.source === 'google' ? null : 'google', stars: null })}
                className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                style={{ 
                  backgroundColor: ratingFilter.source === 'google' ? '#FFF' : 'rgba(255,255,255,0.2)',
                  borderWidth: 1,
                  borderColor: ratingFilter.source === 'google' ? '#4285F4' : '#FFF'
                }}
              >
                <Icon name="logo-google" size={16} color={ratingFilter.source === 'google' ? '#4285F4' : '#FFF'} />
                <Text className={`ml-1 font-semibold text-xs ${ratingFilter.source === 'google' ? 'text-gray-900' : 'text-white'}`}>
                  Google
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRatingFilter({ source: ratingFilter.source === 'tripadvisor' ? null : 'tripadvisor', stars: null })}
                className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                style={{ 
                  backgroundColor: ratingFilter.source === 'tripadvisor' ? '#FFF' : 'rgba(255,255,255,0.2)',
                  borderWidth: 1,
                  borderColor: ratingFilter.source === 'tripadvisor' ? '#00AA6C' : '#FFF'
                }}
              >
                <Image 
                  source={require('../../../assets/tripadvisor.png')}
                  style={{ width: 16, height: 16 }}
                  resizeMode="contain"
                />
                <Text className={`ml-1 font-semibold text-xs ${ratingFilter.source === 'tripadvisor' ? 'text-gray-900' : 'text-white'}`}>
                  TripAdvisor
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Star Level Selection (only show if source is selected) */}
          {ratingFilter.source && (
            <>
              <Text className="text-white text-xs mb-1 opacity-80">Step 2: Select Star Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row">
                  {[5, 4, 3].map((starLevel) => (
                    <TouchableOpacity
                      key={starLevel}
                      onPress={() => setRatingFilter({ ...ratingFilter, stars: ratingFilter.stars === starLevel ? null : starLevel })}
                      className="mr-2 px-3 py-2 rounded-full flex-row items-center"
                      style={{ 
                        backgroundColor: ratingFilter.stars === starLevel ? '#FFC107' : 'rgba(255,255,255,0.2)',
                        borderWidth: 1,
                        borderColor: ratingFilter.stars === starLevel ? '#FFC107' : '#FFF'
                      }}
                    >
                      {[...Array(starLevel)].map((_, i) => (
                        <Icon 
                          key={i}
                          name="star" 
                          size={12} 
                          color={ratingFilter.stars === starLevel ? '#000' : '#FFF'} 
                        />
                      ))}
                      <Text className={`ml-1 font-semibold text-xs ${ratingFilter.stars === starLevel ? 'text-gray-900' : 'text-white'}`}>
                        {starLevel}+
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}
        </View>
        
        {/* Active Filters Display */}
        {ratingFilter.source && ratingFilter.stars && (
          <View className="flex-row items-center mb-2 bg-white/20 rounded-lg px-3 py-2">
            <Icon name="checkmark-circle" size={16} color="#FFF" />
            <Text className="text-white text-xs ml-1 font-semibold">
              Filtering: {ratingFilter.source === 'hashview' ? 'HashView' : ratingFilter.source === 'google' ? 'Google' : 'TripAdvisor'} {ratingFilter.stars}+ stars
            </Text>
          </View>
        )}
        
        {/* Instruction when only source selected */}
        {ratingFilter.source && !ratingFilter.stars && (
          <View className="flex-row items-center mb-2">
            <Icon name="arrow-down" size={14} color="#FFF" />
            <Text className="text-white text-xs ml-1 italic">
              Select star level to apply filter
            </Text>
          </View>
        )}

        {/* Distance Filter (only if location available) */}
        {hasLocation && (
          <View className="mt-3">
            <Text className="text-white text-sm font-semibold mb-2">Filter by Distance:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setDistanceFilter(distanceFilter === 'nearme' ? null : 'nearme')}
                  className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                  style={{ 
                    backgroundColor: distanceFilter === 'nearme' ? '#FFF' : 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    borderColor: distanceFilter === 'nearme' ? '#10B981' : '#FFF'
                  }}
                >
                  <Icon name="navigate" size={16} color={distanceFilter === 'nearme' ? '#10B981' : '#FFF'} />
                  <Text className={`ml-1 font-semibold text-xs ${distanceFilter === 'nearme' ? 'text-gray-900' : 'text-white'}`}>
                    Near Me (5km)
                  </Text>
                </TouchableOpacity>

                {['1km', '5km', '10km', '25km'].map((dist) => (
                  <TouchableOpacity
                    key={dist}
                    onPress={() => setDistanceFilter(distanceFilter === dist ? null : dist)}
                    className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                    style={{ 
                      backgroundColor: distanceFilter === dist ? '#FFF' : 'rgba(255,255,255,0.2)',
                      borderWidth: 1,
                      borderColor: distanceFilter === dist ? '#3B82F6' : '#FFF'
                    }}
                  >
                    <Icon name="location" size={16} color={distanceFilter === dist ? '#3B82F6' : '#FFF'} />
                    <Text className={`ml-1 font-semibold text-xs ${distanceFilter === dist ? 'text-gray-900' : 'text-white'}`}>
                      {dist.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            {distanceFilter && (
              <View className="flex-row items-center mt-2">
                <Icon name="checkmark-circle" size={14} color="#FFF" />
                <Text className="text-white text-xs ml-1">
                  Showing businesses within {distanceFilter === 'nearme' ? '5km (Near Me)' : distanceFilter.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Location Permission Notification */}
        {locationPermission !== 'granted' && (
          <View className="mt-3">
            <TouchableOpacity
              onPress={requestLocationPermission}
              className="bg-white/20 rounded-xl p-3 flex-row items-center"
              activeOpacity={0.8}
            >
              <Icon name="location-outline" size={20} color="#FFF" />
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold text-sm">
                  Enable location for distance filters
                </Text>
                <Text className="text-white/80 text-xs mt-1">
                  Tap to allow location access
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
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
            keyExtractor={keyExtractor}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
            getItemLayout={(data, index) => ({
              length: 140,
              offset: 140 * index,
              index
            })}
          />
        )}
      </View>
    </View>
  );
}
