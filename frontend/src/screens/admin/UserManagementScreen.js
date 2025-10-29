import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import ApiService from '../../services/api.service';
import COLORS from '../../config/colors';

export default function UserManagementScreen() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAllUsers({ page: 1, limit: 50 });
      setUsers(response.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 mb-1">{item.name}</Text>
          <Text className="text-sm text-gray-600 mb-1">{item.email}</Text>
          <Text className="text-xs text-gray-500">{item.phone}</Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${
          item.status === 'active' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <Text className={`text-xs font-semibold ${
            item.status === 'active' ? 'text-green-700' : 'text-red-700'
          }`}>{item.status}</Text>
        </View>
      </View>
      <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
        <Icon name="calendar-outline" size={14} color="#9CA3AF" />
        <Text className="text-xs text-gray-500 ml-1">
          Joined {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="px-6 py-4"
      >
        <View className="flex-row items-center bg-white/20 rounded-xl px-4 py-3">
          <Icon name="search" size={20} color="white" />
          <TextInput
            className="flex-1 ml-3 text-white"
            placeholder="Search users..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : (
        <FlatList
          data={users.filter(u => 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          renderItem={renderUser}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Icon name="people-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4">No users found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

