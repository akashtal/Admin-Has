import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert, StatusBar, Image, TextInput, Modal, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { getAllActiveBusinesses, getNearbyBusinesses, searchBusinesses } from '../../store/slices/businessSlice';
import COLORS from '../../config/colors';
import { FLATLIST_OPTIMIZATIONS, optimizeImageUri } from '../../utils/performanceHelpers';

export default function UserHomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { businesses, nearbyBusinesses, loading } = useSelector((state) => state.business);
  const { user } = useSelector((state) => state.auth);
  const [locationPermission, setLocationPermission] = useState(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef(null);
  
  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Star-based rating filter states
  const [ratingFilter, setRatingFilter] = useState({
    source: null, // 'hashview', 'google', or 'tripadvisor'
    stars: null   // 3, 4, or 5
  });
  
  // Distance filter state
  const [distanceFilter, setDistanceFilter] = useState(null); // 'nearme', '1km', '5km', '10km', '25km'
  
  // Track active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (ratingFilter.source && ratingFilter.stars) count++;
    if (distanceFilter) count++;
    return count;
  }, [ratingFilter, distanceFilter]);

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

  // Fetch businesses - BACKEND HANDLES EVERYTHING
  const fetchFilteredBusinesses = useCallback(async () => {
    // Build params - backend will handle all logic
    const params = {};
    
    // Add rating filter (if both source and stars selected)
    if (ratingFilter.source && ratingFilter.stars) {
      params.ratingSource = ratingFilter.source;
      params.minRating = ratingFilter.stars;
    }

    // Add distance filter
    if (distanceFilter) {
      params.distance = distanceFilter;
    }

    // Add location (backend will calculate distances and sort)
    if (hasLocation && user?.location?.coordinates) {
      params.latitude = user.location.coordinates[1];
      params.longitude = user.location.coordinates[0];
      await dispatch(getNearbyBusinesses(params));
    } else {
      await dispatch(getAllActiveBusinesses(params));
    }
  }, [ratingFilter, distanceFilter, hasLocation, user, dispatch]);

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

  // Search - Simple debounce, backend does everything
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (!query.trim()) {
      setShowSearchDropdown(false);
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    setShowSearchDropdown(true);
    
    // Debounce only to reduce API calls - backend handles all logic
    searchTimeout.current = setTimeout(async () => {
      try {
        const params = { search: query.trim(), limit: 10 };
        
        // Add location - backend calculates & sorts
        if (hasLocation && user?.location?.coordinates) {
          params.latitude = user.location.coordinates[1];
          params.longitude = user.location.coordinates[0];
        }
        
        const result = await dispatch(searchBusinesses(params)).unwrap();
        setSearchResults(result || []);
      } catch (error) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [dispatch, hasLocation, user]);

  // Handle search result selection
  const handleSelectSearchResult = useCallback((business) => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSearchResults([]);
    Keyboard.dismiss();
    navigation.navigate('BusinessDetail', { businessId: business._id });
  }, [navigation]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setRatingFilter({ source: null, stars: null });
    setDistanceFilter(null);
    setShowFilterModal(false);
  }, []);

  // Apply filters and close modal
  const applyFilters = useCallback(() => {
    setShowFilterModal(false);
    fetchFilteredBusinesses();
  }, [fetchFilteredBusinesses]);

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
      
      {/* Header Section */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={{ paddingTop: 40, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
      >
        {/* Top Row: Greeting + Action Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFF', fontSize: 22, fontWeight: 'bold' }}>
              Hi {user?.name.split(' ')[0]} 👋
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
              Discover amazing businesses
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Filter Button with Badge */}
            <TouchableOpacity 
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.7}
              style={{ position: 'relative' }}
            >
              <View style={{ 
                backgroundColor: '#FFF', 
                borderRadius: 50, 
                width: 44, 
                height: 44, 
                alignItems: 'center', 
                justifyContent: 'center',
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4
              }}>
                <Icon name="options-outline" size={20} color={COLORS.primary} />
                {activeFiltersCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: '#EF4444',
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#FFF'
                  }}>
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>
                      {activeFiltersCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            {/* QR Scanner Button */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('QRScanner')}
              activeOpacity={0.7}
            >
              <View style={{ 
                backgroundColor: '#FFF', 
                borderRadius: 50, 
                width: 44, 
                height: 44, 
                alignItems: 'center', 
                justifyContent: 'center',
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4
              }}>
                <Icon name="qr-code-outline" size={20} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
            
            {/* Coupons Button */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Coupons')}
              activeOpacity={0.7}
            >
              <View style={{ 
                backgroundColor: '#FFF', 
                borderRadius: 50, 
                width: 44, 
                height: 44, 
                alignItems: 'center', 
                justifyContent: 'center',
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4
              }}>
                <Icon name="gift-outline" size={20} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Filters Indicator (if any) */}
        {activeFiltersCount > 0 && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            borderRadius: 12, 
            paddingHorizontal: 12, 
            paddingVertical: 8,
            marginBottom: 12
          }}>
            <Icon name="funnel" size={14} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
            </Text>
            <TouchableOpacity 
              onPress={clearFilters}
              style={{ marginLeft: 'auto' }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ color: '#FFF', fontSize: 12, textDecorationLine: 'underline' }}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Search Bar - OUTSIDE gradient to prevent overflow issues */}
      <View style={{ paddingHorizontal: 20, marginTop: -20, zIndex: 100 }}>
        <View style={{ 
          backgroundColor: '#FFF', 
          borderRadius: 16, 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 16, 
          paddingVertical: 14,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8
        }}>
          <Icon name="search" size={22} color={COLORS.primary} />
          <TextInput
            placeholder="Search businesses by name or location"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
            style={{ 
              flex: 1, 
              marginLeft: 12, 
              fontSize: 15, 
              fontWeight: '500',
              color: '#111827'
            }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
                setSearchResults([]);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close-circle" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Dropdown Results */}
        {showSearchDropdown && (
          <View 
            style={{
              position: 'absolute',
              top: 64,
              left: 0,
              right: 0,
              backgroundColor: '#FFF',
              borderRadius: 16,
              maxHeight: 300,
              elevation: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              zIndex: 1000
            }}
          >
            {searchLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 12 }}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <ScrollView 
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
                style={{ paddingVertical: 4 }}
              >
                {searchResults.map((business, index) => (
                  <TouchableOpacity
                    key={business._id}
                    onPress={() => handleSelectSearchResult(business)}
                    style={{ 
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderBottomWidth: index < searchResults.length - 1 ? 1 : 0,
                      borderBottomColor: '#F3F4F6'
                    }}
                    activeOpacity={0.6}
                  >
                    {business.logo?.url ? (
                      <Image
                        source={{ uri: optimizeImageUri(business.logo.url, 100, 85) }}
                        style={{ width: 48, height: 48, borderRadius: 12 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: 12, 
                        backgroundColor: '#F9FAFB',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon name="business" size={24} color={COLORS.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 15 }} numberOfLines={1}>
                        {business.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Icon name="location" size={14} color="#9CA3AF" />
                        <Text style={{ color: '#6B7280', fontSize: 13, marginLeft: 4, flex: 1 }} numberOfLines={1}>
                          {business.address?.city || business.address?.area || 'Unknown'}
                        </Text>
                      </View>
                    </View>
                    {business.distance !== undefined && business.distance > 0 && (
                      <View style={{ 
                        marginLeft: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: '#DBEAFE'
                      }}>
                        <Text style={{ color: '#1E40AF', fontSize: 12, fontWeight: 'bold' }}>
                          {business.distance.toFixed(1)}km
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Icon name="search-outline" size={48} color="#D1D5DB" />
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 12, fontWeight: '500' }}>
                  No businesses found
                </Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
                  Try a different search term
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

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

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setShowFilterModal(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={{ 
              backgroundColor: '#FFF', 
              borderTopLeftRadius: 24, 
              borderTopRightRadius: 24,
              maxHeight: 600
            }}>
              {/* Modal Header */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                paddingHorizontal: 20, 
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6'
              }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
                  Filters
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowFilterModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={28} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 450, paddingHorizontal: 20, paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
                {/* Rating Filters Section */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
                    Filter by Rating
                  </Text>
                  
                  {/* Step 1: Select Source */}
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    Step 1: Select Rating Source
                  </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                      <TouchableOpacity
                        onPress={() => setRatingFilter({ source: ratingFilter.source === 'hashview' ? null : 'hashview', stars: null })}
                        activeOpacity={0.7}
                        style={{ 
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 12,
                          marginRight: 8,
                          marginBottom: 8,
                          backgroundColor: ratingFilter.source === 'hashview' ? COLORS.secondary : '#F3F4F6',
                          borderWidth: 2,
                          borderColor: ratingFilter.source === 'hashview' ? COLORS.secondary : '#E5E7EB'
                        }}
                      >
                        <Icon name="star" size={18} color={ratingFilter.source === 'hashview' ? '#FFF' : '#6B7280'} />
                        <Text style={{ 
                          marginLeft: 8, 
                          fontWeight: '600',
                          color: ratingFilter.source === 'hashview' ? '#FFF' : '#374151'
                        }}>
                          HashView
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setRatingFilter({ source: ratingFilter.source === 'google' ? null : 'google', stars: null })}
                        activeOpacity={0.7}
                        style={{ 
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 12,
                          marginRight: 8,
                          marginBottom: 8,
                          backgroundColor: ratingFilter.source === 'google' ? '#4285F4' : '#F3F4F6',
                          borderWidth: 2,
                          borderColor: ratingFilter.source === 'google' ? '#4285F4' : '#E5E7EB'
                        }}
                      >
                        <Icon name="logo-google" size={18} color={ratingFilter.source === 'google' ? '#FFF' : '#6B7280'} />
                        <Text style={{ 
                          marginLeft: 8, 
                          fontWeight: '600',
                          color: ratingFilter.source === 'google' ? '#FFF' : '#374151'
                        }}>
                          Google
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setRatingFilter({ source: ratingFilter.source === 'tripadvisor' ? null : 'tripadvisor', stars: null })}
                        activeOpacity={0.7}
                        style={{ 
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 12,
                          marginRight: 8,
                          marginBottom: 8,
                          backgroundColor: ratingFilter.source === 'tripadvisor' ? '#00AA6C' : '#F3F4F6',
                          borderWidth: 2,
                          borderColor: ratingFilter.source === 'tripadvisor' ? '#00AA6C' : '#E5E7EB'
                        }}
                      >
                        <Image 
                          source={require('../../../assets/tripadvisor.png')}
                          style={{ width: 18, height: 18 }}
                          resizeMode="contain"
                        />
                        <Text style={{ 
                          marginLeft: 8, 
                          fontWeight: '600',
                          color: ratingFilter.source === 'tripadvisor' ? '#FFF' : '#374151'
                        }}>
                          TripAdvisor
                        </Text>
                      </TouchableOpacity>
                    </View>

                  {/* Step 2: Select Star Level */}
                  {ratingFilter.source && (
                    <>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                        Step 2: Select Star Level
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {[5, 4, 3].map((starLevel) => (
                          <TouchableOpacity
                            key={starLevel}
                            onPress={() => setRatingFilter({ ...ratingFilter, stars: ratingFilter.stars === starLevel ? null : starLevel })}
                            activeOpacity={0.7}
                            style={{ 
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 16,
                              paddingVertical: 10,
                              borderRadius: 12,
                              marginRight: 8,
                              marginBottom: 8,
                              backgroundColor: ratingFilter.stars === starLevel ? '#FFC107' : '#F3F4F6',
                              borderWidth: 2,
                              borderColor: ratingFilter.stars === starLevel ? '#FFC107' : '#E5E7EB'
                            }}
                          >
                            {[...Array(starLevel)].map((_, i) => (
                              <Icon 
                                key={i}
                                name="star" 
                                size={14} 
                                color={ratingFilter.stars === starLevel ? '#000' : '#6B7280'} 
                              />
                            ))}
                            <Text style={{ 
                              marginLeft: 8, 
                              fontWeight: '600',
                              color: ratingFilter.stars === starLevel ? '#111827' : '#374151'
                            }}>
                              {starLevel}+ Stars
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>

                {/* Distance Filters Section */}
                {hasLocation && (
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
                      Filter by Distance
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      <TouchableOpacity
                        onPress={() => setDistanceFilter(distanceFilter === 'nearme' ? null : 'nearme')}
                        activeOpacity={0.7}
                        style={{ 
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 12,
                          marginRight: 8,
                          marginBottom: 8,
                          backgroundColor: distanceFilter === 'nearme' ? '#10B981' : '#F3F4F6',
                          borderWidth: 2,
                          borderColor: distanceFilter === 'nearme' ? '#10B981' : '#E5E7EB'
                        }}
                      >
                        <Icon name="navigate" size={18} color={distanceFilter === 'nearme' ? '#FFF' : '#6B7280'} />
                        <Text style={{ 
                          marginLeft: 8, 
                          fontWeight: '600',
                          color: distanceFilter === 'nearme' ? '#FFF' : '#374151'
                        }}>
                          Near Me (5km)
                        </Text>
                      </TouchableOpacity>

                      {['1km', '5km', '10km', '25km'].map((dist) => (
                        <TouchableOpacity
                          key={dist}
                          onPress={() => setDistanceFilter(distanceFilter === dist ? null : dist)}
                          activeOpacity={0.7}
                          style={{ 
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 12,
                            marginRight: 8,
                            marginBottom: 8,
                            backgroundColor: distanceFilter === dist ? '#3B82F6' : '#F3F4F6',
                            borderWidth: 2,
                            borderColor: distanceFilter === dist ? '#3B82F6' : '#E5E7EB'
                          }}
                        >
                          <Icon name="location" size={18} color={distanceFilter === dist ? '#FFF' : '#6B7280'} />
                          <Text style={{ 
                            marginLeft: 8, 
                            fontWeight: '600',
                            color: distanceFilter === dist ? '#FFF' : '#374151'
                          }}>
                            {dist.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Location Permission Prompt */}
                {locationPermission !== 'granted' && (
                  <View style={{ marginBottom: 24 }}>
                    <TouchableOpacity
                      onPress={requestLocationPermission}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: '#EFF6FF',
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 2,
                        borderColor: '#BFDBFE'
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="location-outline" size={24} color="#3B82F6" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ color: '#1E3A8A', fontWeight: 'bold', fontSize: 14 }}>
                            Enable Location Access
                          </Text>
                          <Text style={{ color: '#1D4ED8', fontSize: 12, marginTop: 4 }}>
                            Get distance-based filters and nearby businesses
                          </Text>
                        </View>
                        <Icon name="chevron-forward" size={20} color="#3B82F6" />
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              {/* Modal Footer */}
              <View style={{ 
                flexDirection: 'row', 
                paddingHorizontal: 20, 
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: '#F3F4F6',
                gap: 12
              }}>
                <TouchableOpacity
                  onPress={clearFilters}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#D1D5DB',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ color: '#374151', fontWeight: 'bold', fontSize: 15 }}>
                    Clear All
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={applyFilters}
                  activeOpacity={0.7}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={[COLORS.secondary, COLORS.secondaryDark]}
                    style={{
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>
                      Apply Filters
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
