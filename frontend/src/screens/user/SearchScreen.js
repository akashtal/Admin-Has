import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { searchBusinesses } from '../../store/slices/businessSlice';
import ApiService from '../../services/api.service';
import COLORS from '../../config/colors';
import { debounce, optimizeImageUri } from '../../utils/performanceHelpers';

export default function SearchScreen({ navigation }) {
  const dispatch = useDispatch();
  const { businesses, loading } = useSelector((state) => state.business);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories from backend on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await ApiService.getCategories();
      
      // Add "All" category at the beginning
      const allCategory = {
        _id: 'all',
        name: 'All',
        slug: 'all',
        icon: 'apps',
        color: COLORS.secondary,
        order: -1
      };
      
      setCategories([allCategory, ...response.categories]);
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback to empty categories if failed
      setCategories([{
        _id: 'all',
        name: 'All',
        slug: 'all',
        icon: 'apps',
        color: COLORS.secondary
      }]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSearch = useCallback(() => {
    const params = {};
    if (searchQuery) params.query = searchQuery;
    if (selectedCategory) params.category = selectedCategory;

    dispatch(searchBusinesses(params));
  }, [searchQuery, selectedCategory, dispatch]);

  // Debounced search for text input
  const debouncedSearch = useMemo(() => debounce(handleSearch, 500), [handleSearch]);

  // Memoize renderBusiness for performance
  const renderBusiness = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('BusinessDetail', { businessId: item._id })}
      className="bg-white rounded-2xl p-3 mb-3 shadow-sm overflow-hidden"
      style={{ height: 120 }}
    >
      <View className="flex-row h-full">
        {/* Logo/Image Section */}
        <View className="w-24 h-full mr-3 rounded-xl overflow-hidden" style={{ backgroundColor: '#FFF9F0' }}>
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
              <Icon name="business" size={36} color={COLORS.secondary} />
            </View>
          )}
        </View>

        {/* Content Section */}
        <View className="flex-1 justify-between">
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={1}>
              {item.name}
            </Text>
            
            {/* Ratings Row */}
            <View className="flex-row items-center mb-1 flex-wrap">
              <Icon name="star" size={14} color={COLORS.secondary} />
              <Text className="text-xs text-gray-600 ml-1 mr-2">
                {item.rating?.average?.toFixed(1) || '0.0'}
              </Text>
              {item.externalProfiles?.googleBusiness?.rating && (
                <>
                  <Icon name="logo-google" size={12} color="#4285F4" />
                  <Text className="text-xs text-gray-600 ml-1 mr-2">
                    {item.externalProfiles.googleBusiness.rating.toFixed(1)}
                  </Text>
                </>
              )}
              {item.externalProfiles?.tripAdvisor?.rating && (
                <>
                  <Image 
                    source={require('../../../assets/tripadvisor.png')}
                    style={{ width: 12, height: 12 }}
                    resizeMode="contain"
                  />
                  <Text className="text-xs text-gray-600 ml-1">
                    {item.externalProfiles.tripAdvisor.rating.toFixed(1)}
                  </Text>
                </>
              )}
            </View>
            
            <View className="flex-row items-center">
              <Icon name="location-outline" size={12} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1 flex-1" numberOfLines={1}>
                {item.address?.fullAddress || 'Location not specified'}
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
  ), [navigation]); // Close useCallback

  // Memoize keyExtractor
  const keyExtractor = useCallback((item) => item._id, []);

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="pt-12 pb-6 px-6"
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-2xl font-bold">Search</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-lg">
          <Icon name="search" size={22} color={COLORS.secondary} />
          <TextInput
            className="flex-1 ml-3 text-gray-900 text-base"
            placeholder="Search restaurants, cafes, hotels..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length > 2) {
                debouncedSearch();
              } else if (text.length === 0) {
                handleSearch(); // Immediate search when cleared
              }
            }}
            returnKeyType="search"
            autoFocus={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              handleSearch();
            }}>
              <Icon name="close-circle" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View className="px-6 mt-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-gray-900">Browse by Category</Text>
          {selectedCategory && (
            <TouchableOpacity 
              onPress={() => {
                setSelectedCategory(null);
                setTimeout(handleSearch, 100);
              }}
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              <Text className="text-xs font-semibold text-red-600">Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {loadingCategories ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="small" color={COLORS.secondary} />
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            className="mb-4"
            contentContainerStyle={{ paddingRight: 24, paddingBottom: 2, paddingTop: 2 }}
          >
            {categories.map((category) => {
              const isSelected = category.slug === 'all' 
                ? selectedCategory === null 
                : selectedCategory === category.slug;
              
              return (
                <TouchableOpacity
                  key={category._id}
                  onPress={() => {
                    const newCategory = category.slug === 'all' ? null : category.slug;
                    setSelectedCategory(newCategory);
                    setTimeout(handleSearch, 100);
                  }}
                  className="mr-3 rounded-2xl overflow-hidden"
                  style={{ 
                    width: 100,
                    height: 100,
                    shadowColor: '#000', 
                    shadowOffset: { width: 0, height: 2 }, 
                    shadowOpacity: isSelected ? 0.15 : 0.08, 
                    shadowRadius: isSelected ? 4 : 3, 
                    elevation: isSelected ? 4 : 2 
                  }}
                >
                  <LinearGradient
                    colors={isSelected 
                      ? [category.color || COLORS.secondary, category.color || COLORS.secondaryDark]
                      : ['#FFFFFF', '#F9FAFB']
                    }
                    className="flex-1 items-center justify-center p-2"
                  >
                    <View 
                      className="w-12 h-12 rounded-full items-center justify-center mb-1"
                      style={{ 
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : category.color + '15' || COLORS.secondary + '15'
                      }}
                    >
                      <Icon 
                        name={category.icon || 'apps'} 
                        size={24} 
                        color={isSelected ? '#FFF' : category.color || COLORS.secondary} 
                      />
                    </View>
                    <Text 
                      className={`text-xs font-bold text-center ${
                        isSelected ? 'text-white' : 'text-gray-700'
                      }`}
                      numberOfLines={2}
                    >
                      {category.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {loading ? (
          <View className="justify-center items-center py-20">
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text className="text-gray-500 mt-3">Searching...</Text>
          </View>
        ) : businesses.length === 0 ? (
          <View className="items-center py-20">
            <Icon name="search-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-900 text-lg font-bold mt-4">No results found</Text>
            <Text className="text-gray-500 mt-2 text-center px-8">
              Try searching with different keywords or select a category
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-sm text-gray-500 mb-3">{businesses.length} results found</Text>
            <FlatList
              data={businesses}
              renderItem={renderBusiness}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={5}
              initialNumToRender={10}
              updateCellsBatchingPeriod={50}
              getItemLayout={(data, index) => ({
                length: 120,
                offset: 120 * index + (index * 12), // height + margin
                index
              })}
            />
          </>
        )}
      </View>
    </View>
  );
}

