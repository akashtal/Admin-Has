import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import ApiService from '../../services/api.service';
import COLORS from '../../config/colors';

export default function BusinessManagementScreen() {
  const [businesses, setBusinesses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('pending');

  useEffect(() => {
    fetchBusinesses();
  }, [filter]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAllBusinesses({ 
        page: 1, 
        limit: 50,
        kycStatus: filter 
      });
      setBusinesses(response.businesses);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await ApiService.updateBusinessKYC(id, { action: 'approve' });
      Alert.alert('Success', 'Business approved successfully');
      fetchBusinesses();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await ApiService.updateBusinessKYC(id, { 
        action: 'reject',
        reason: 'Documents verification failed'
      });
      Alert.alert('Success', 'Business rejected');
      fetchBusinesses();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderBusiness = ({ item }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 mb-1">{item.name}</Text>
          <Text className="text-sm text-gray-600 mb-1">{item.email}</Text>
          <Text className="text-xs text-gray-500 capitalize">{item.category}</Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${
          item.kycStatus === 'approved' ? 'bg-green-100' :
          item.kycStatus === 'pending' ? 'bg-yellow-100' :
          'bg-red-100'
        }`}>
          <Text className={`text-xs font-semibold capitalize ${
            item.kycStatus === 'approved' ? 'text-green-700' :
            item.kycStatus === 'pending' ? 'text-yellow-700' :
            'text-red-700'
          }`}>{item.kycStatus}</Text>
        </View>
      </View>

      {item.kycStatus === 'pending' && (
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => handleApprove(item._id)}
            className="flex-1 bg-green-500 rounded-lg py-2 items-center mr-2"
          >
            <Text className="text-white font-semibold">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleReject(item._id)}
            className="flex-1 bg-red-500 rounded-lg py-2 items-center ml-2"
          >
            <Text className="text-white font-semibold">Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="px-6 py-4"
      >
        <View className="flex-row">
          {['pending', 'approved', 'rejected'].map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setFilter(status)}
              className="flex-1 py-2 rounded-lg mx-1"
              style={{ backgroundColor: filter === status ? COLORS.secondary : 'rgba(255,255,255,0.2)' }}
            >
              <Text className="text-center text-sm font-semibold capitalize text-white">{status}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : (
        <FlatList
          data={businesses}
          renderItem={renderBusiness}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Icon name="business-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4">No businesses found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

