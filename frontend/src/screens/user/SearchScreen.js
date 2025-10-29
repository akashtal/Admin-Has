import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { searchBusinesses } from '../../store/slices/businessSlice';
import COLORS from '../../config/colors';

export default function SearchScreen({ navigation }) {
  const dispatch = useDispatch();
  const { businesses, loading } = useSelector((state) => state.business);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    { id: 'restaurant', name: 'Restaurant', icon: 'restaurant' },
    { id: 'cafe', name: 'Café', icon: 'cafe' },
    { id: 'retail', name: 'Retail', icon: 'cart' },
    { id: 'services', name: 'Services', icon: 'construct' },
    { id: 'healthcare', name: 'Healthcare', icon: 'medical' },
    { id: 'education', name: 'Education', icon: 'school' },
  ];

  const handleSearch = () => {
    const params = {};
    if (searchQuery) params.query = searchQuery;
    if (selectedCategory) params.category = selectedCategory;

    dispatch(searchBusinesses(params));
  };

  const renderBusiness = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('BusinessDetail', { businessId: item._id })}
      className="bg-white rounded-2xl p-4 mb-3 shadow-md flex-row"
    >
      <View className="w-16 h-16 rounded-xl mr-3 items-center justify-center" style={{ backgroundColor: '#FFF9F0' }}>
        <Icon name="business" size={24} color={COLORS.secondary} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-gray-900 mb-1">{item.name}</Text>
        <View className="flex-row items-center mb-1">
          <Icon name="star" size={14} color={COLORS.secondary} />
          <Text className="text-xs text-gray-600 ml-1">
            {item.rating?.average?.toFixed(1) || '0.0'} ({item.rating?.count || 0})
          </Text>
        </View>
        <Text className="text-xs text-gray-500 capitalize">{item.category}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="pt-12 pb-6 px-6 rounded-b-3xl"
      >
        <Text className="text-white text-2xl font-bold mb-4">Search Businesses</Text>
        
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-lg">
          <Icon name="search" size={20} color={COLORS.secondary} />
          <TextInput
            className="flex-1 ml-3 text-gray-900"
            placeholder="Search for businesses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View className="px-6 mt-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => {
                setSelectedCategory(category.id === selectedCategory ? null : category.id);
                handleSearch();
              }}
              className="mr-3 px-4 py-3 rounded-xl flex-row items-center"
              style={{ 
                backgroundColor: selectedCategory === category.id ? COLORS.secondary : '#FFF',
                shadowColor: '#000', 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: 0.1, 
                shadowRadius: 3, 
                elevation: 3 
              }}
            >
              <Icon 
                name={category.icon} 
                size={18} 
                color={selectedCategory === category.id ? '#FFF' : COLORS.secondary} 
              />
              <Text 
                className={`ml-2 font-semibold ${
                  selectedCategory === category.id ? 'text-white' : 'text-gray-700'
                }`}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.secondary, COLORS.secondaryDark]}
            className="rounded-xl py-3 items-center mb-4"
          >
            <Text className="text-white font-bold">Search</Text>
          </LinearGradient>
        </TouchableOpacity>

        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color={COLORS.secondary} />
          </View>
        ) : businesses.length === 0 ? (
          <View className="flex-1 items-center py-20">
            <Icon name="search-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 text-center">
              No results found.{'\n'}Try adjusting your search.
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-sm text-gray-500 mb-3">{businesses.length} results found</Text>
            <FlatList
              data={businesses}
              renderItem={renderBusiness}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </View>
  );
}

