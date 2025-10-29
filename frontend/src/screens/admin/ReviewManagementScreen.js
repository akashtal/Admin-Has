import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ApiService from '../../services/api.service';
import COLORS from '../../config/colors';

export default function ReviewManagementScreen() {
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAllReviews({ page: 1, limit: 50 });
      setReviews(response.reviews);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderReview = ({ item }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900">
            {item.business?.name || 'Business'}
          </Text>
          <Text className="text-xs text-gray-500">
            by {item.user?.name || 'User'}
          </Text>
        </View>
        <View className="flex-row items-center">
          {[...Array(5)].map((_, i) => (
            <Icon
              key={i}
              name="star"
              size={12}
              color={i < item.rating ? COLORS.secondary : '#E5E7EB'}
            />
          ))}
        </View>
      </View>
      <Text className="text-sm text-gray-700 mb-2">{item.comment}</Text>
      <Text className="text-xs text-gray-400">
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Icon name="chatbubbles-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4">No reviews found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

