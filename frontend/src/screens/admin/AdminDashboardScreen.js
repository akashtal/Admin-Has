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

  // All management features moved to Web Dashboard
  // Mobile app shows read-only analytics only

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="pt-12 pb-6 px-6 rounded-b-3xl"
      >
        <Text className="text-white text-2xl font-bold mb-2">Platform Analytics</Text>
        <Text className="text-white opacity-90">Monitor your platform performance</Text>
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

        {/* Pending Approvals - Info Only (Manage on Web Dashboard) */}
        {stats?.businesses?.pending > 0 && (
          <View
            className="rounded-2xl p-4 mb-4 flex-row items-center border-2"
            style={{ backgroundColor: '#FFF7ED', borderColor: COLORS.secondaryLight }}
          >
            <View className="rounded-full w-12 h-12 items-center justify-center mr-3" style={{ backgroundColor: COLORS.secondary }}>
              <Text className="text-xl font-bold text-white">{stats.businesses.pending}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">Pending Approvals</Text>
              <Text className="text-xs text-gray-600">Manage from Web Dashboard</Text>
            </View>
            <Icon name="globe" size={24} color={COLORS.secondary} />
          </View>
        )}

        {/* Management Notice */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border-2" style={{ borderColor: COLORS.primary + '20' }}>
          <View className="flex-row items-center mb-3">
            <View className="rounded-full w-12 h-12 items-center justify-center mr-3" style={{ backgroundColor: COLORS.primary + '15' }}>
              <Icon name="desktop" size={28} color={COLORS.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">Web Dashboard</Text>
              <Text className="text-xs text-gray-500">Full Admin Control</Text>
            </View>
          </View>
          
          <Text className="text-sm text-gray-600 mb-4">
            🎯 <Text className="font-semibold">Mobile App:</Text> Read-only analytics{'\n'}
            💻 <Text className="font-semibold">Web Dashboard:</Text> Complete management
          </Text>
          
          <View className="border-t border-gray-100 pt-4 mb-3">
            <Text className="text-xs font-semibold text-gray-700 mb-2">Available on Web Dashboard:</Text>
            <View className="space-y-1">
              <Text className="text-xs text-gray-600">✓ Approve/Reject Businesses</Text>
              <Text className="text-xs text-gray-600">✓ Manage Users & Reviews</Text>
              <Text className="text-xs text-gray-600">✓ View Verification Documents</Text>
              <Text className="text-xs text-gray-600">✓ Send Notifications</Text>
            </View>
          </View>
          
          <View className="rounded-xl p-3" style={{ backgroundColor: COLORS.primary + '10' }}>
            <Text className="text-xs font-medium text-gray-600 mb-1">📱 Local Network:</Text>
            <Text className="text-xs font-semibold" style={{ color: COLORS.primary }}>
              http://192.168.108.239:3000
            </Text>
          </View>
        </View>

        {/* Platform Insights */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Platform Insights</Text>
        
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex-row items-center mb-4">
            <Icon name="trending-up" size={24} color={COLORS.secondary} />
            <Text className="text-base font-semibold text-gray-900 ml-2">Growth Summary</Text>
          </View>
          
          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Active Businesses</Text>
            <View className="flex-row items-center">
              <View className="flex-1 h-2 bg-gray-200 rounded-full mr-3 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ 
                    width: `${stats?.businesses?.total > 0 ? (stats.businesses.active / stats.businesses.total * 100) : 0}%`,
                    backgroundColor: COLORS.secondary
                  }}
                />
              </View>
              <Text className="text-sm font-semibold text-gray-900">
                {stats?.businesses?.active || 0}/{stats?.businesses?.total || 0}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between pt-3 border-t border-gray-100">
            <View>
              <Text className="text-xs text-gray-500">New Users</Text>
              <Text className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                +{stats?.users?.newThisMonth || 0}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-gray-500">New Businesses</Text>
              <Text className="text-2xl font-bold" style={{ color: COLORS.secondary }}>
                +{stats?.businesses?.newThisMonth || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

