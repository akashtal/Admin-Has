import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import ApiService from '../../services/api.service';
import COLORS from '../../config/colors';

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getDashboardStats();
      setStats(response.stats);
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

  const menuItems = [
    { title: 'User Management', icon: 'people', screen: 'UserManagement', color: '#FFF9F0', iconColor: COLORS.secondary },
    { title: 'Business Management', icon: 'business', screen: 'BusinessManagement', color: '#FFF9F0', iconColor: COLORS.secondary },
    { title: 'Review Management', icon: 'chatbubbles', screen: 'ReviewManagement', color: '#FFF9F0', iconColor: COLORS.secondary },
    { title: 'Notifications', icon: 'notifications', color: '#FFF9F0', iconColor: COLORS.secondary },
    { title: 'Analytics', icon: 'bar-chart', color: '#FFF9F0', iconColor: COLORS.secondary },
    { title: 'Settings', icon: 'settings', color: '#FFF9F0', iconColor: COLORS.secondary },
  ];

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="pt-12 pb-6 px-6 rounded-b-3xl"
      >
        <Text className="text-white text-2xl font-bold mb-2">Admin Dashboard</Text>
        <Text className="text-white opacity-90">Manage your platform</Text>
      </LinearGradient>

      <ScrollView className="flex-1 bg-gray-50">

      <View className="px-6 mt-4">
        {/* Stats Cards */}
        <View className="flex-row flex-wrap justify-between mb-4">
          <View className="bg-white rounded-2xl p-4 shadow-sm w-[48%] mb-3">
            <View className="rounded-full w-10 h-10 items-center justify-center mb-2" style={{ backgroundColor: '#FFF9F0' }}>
              <Icon name="people" size={20} color={COLORS.secondary} />
            </View>
            <Text className="text-2xl font-bold text-gray-900">{stats?.users?.total || 0}</Text>
            <Text className="text-xs text-gray-500">Total Users</Text>
            <Text className="text-xs mt-1" style={{ color: COLORS.secondary }}>
              +{stats?.users?.newThisMonth || 0} this month
            </Text>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm w-[48%] mb-3">
            <View className="rounded-full w-10 h-10 items-center justify-center mb-2" style={{ backgroundColor: '#FFF9F0' }}>
              <Icon name="business" size={20} color={COLORS.secondary} />
            </View>
            <Text className="text-2xl font-bold text-gray-900">{stats?.businesses?.total || 0}</Text>
            <Text className="text-xs text-gray-500">Total Businesses</Text>
            <Text className="text-xs mt-1" style={{ color: COLORS.secondary }}>
              +{stats?.businesses?.newThisMonth || 0} this month
            </Text>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm w-[48%] mb-3">
            <View className="rounded-full w-10 h-10 items-center justify-center mb-2" style={{ backgroundColor: '#FFF9F0' }}>
              <Icon name="chatbubbles" size={20} color={COLORS.secondary} />
            </View>
            <Text className="text-2xl font-bold text-gray-900">{stats?.reviews?.total || 0}</Text>
            <Text className="text-xs text-gray-500">Total Reviews</Text>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm w-[48%] mb-3">
            <View className="rounded-full w-10 h-10 items-center justify-center mb-2" style={{ backgroundColor: '#FFF9F0' }}>
              <Icon name="gift" size={20} color={COLORS.secondary} />
            </View>
            <Text className="text-2xl font-bold text-gray-900">{stats?.coupons?.total || 0}</Text>
            <Text className="text-xs text-gray-500">Total Coupons</Text>
          </View>
        </View>

        {/* Pending Approvals */}
        {stats?.businesses?.pending > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('BusinessManagement')}
            className="rounded-2xl p-4 mb-4 flex-row items-center border-2"
            style={{ backgroundColor: '#FFF7ED', borderColor: COLORS.secondaryLight }}
          >
            <View className="rounded-full w-12 h-12 items-center justify-center mr-3" style={{ backgroundColor: COLORS.secondary }}>
              <Text className="text-xl font-bold text-white">{stats.businesses.pending}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">Pending Approvals</Text>
              <Text className="text-xs text-gray-600">Businesses awaiting verification</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        {/* Management Menu */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Management</Text>
        
        <View className="flex-row flex-wrap justify-between">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => item.screen && navigation.navigate(item.screen)}
              className="bg-white rounded-2xl p-4 shadow-sm w-[48%] mb-3"
            >
              <View className="rounded-full w-12 h-12 items-center justify-center mb-2" style={{ backgroundColor: item.color }}>
                <Icon name={item.icon} size={24} color={item.iconColor} />
              </View>
              <Text className="text-sm font-semibold text-gray-900">{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

