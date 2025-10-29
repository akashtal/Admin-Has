import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import ApiService from '../../services/api.service';
import COLORS from '../../config/colors';

export default function ManageCouponsScreen({ navigation, route }) {
  const { businessId } = route.params;
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    rewardValue: '',
    description: '',
    validityHours: '2'
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getBusinessCoupons(businessId);
      setCoupons(response.coupons || []);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!formData.rewardValue || !formData.description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await ApiService.createCoupon({
        businessId,
        rewardValue: parseInt(formData.rewardValue),
        description: formData.description,
        validityHours: parseInt(formData.validityHours)
      });

      Alert.alert('Success', 'Coupon created successfully');
      setModalVisible(false);
      setFormData({ rewardValue: '', description: '', validityHours: '2' });
      fetchCoupons();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create coupon');
    }
  };

  const getCouponStatus = (coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    
    if (coupon.status === 'redeemed') return { text: 'Redeemed', color: 'bg-green-100 text-green-700' };
    if (validUntil < now) return { text: 'Expired', color: 'bg-gray-100 text-gray-700' };
    return { text: 'Active', color: 'bg-blue-100 text-blue-700' };
  };

  const renderCoupon = (coupon) => {
    const status = getCouponStatus(coupon);
    const hoursLeft = Math.max(0, Math.floor((new Date(coupon.validUntil) - new Date()) / (1000 * 60 * 60)));

    return (
      <View key={coupon._id} className="bg-white rounded-2xl p-5 mb-3 shadow-sm">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: '#FFF9F0' }}>
                <Text className="text-xs font-bold" style={{ color: COLORS.secondary }}>
                  {coupon.code}
                </Text>
              </View>
              <View className={`ml-2 rounded-full px-3 py-1 ${status.color}`}>
                <Text className="text-xs font-semibold">{status.text}</Text>
              </View>
            </View>
            <Text className="text-sm text-gray-700 mb-2">{coupon.description}</Text>
            <Text className="text-xs text-gray-500">
              Awarded to: {coupon.user?.name || 'User'}
            </Text>
          </View>
          <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: '#FFF9F0' }}>
            <Text className="text-2xl font-bold" style={{ color: COLORS.secondary }}>
              {coupon.rewardValue}%
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <Icon name="time-outline" size={14} color={COLORS.secondary} />
            <Text className="text-xs text-gray-600 ml-1">
              {status.text === 'Active' ? `${hoursLeft}h remaining` : 
               status.text === 'Expired' ? 'Expired' : 'Used'}
            </Text>
          </View>
          <Text className="text-xs text-gray-500">
            Created: {new Date(coupon.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="pt-12 pb-6 px-6"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
              <Icon name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Manage Coupons</Text>
          </View>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Icon name="add-circle" size={32} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView className="flex-1 px-6 py-6">
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color={COLORS.secondary} />
          </View>
        ) : coupons.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Icon name="ticket-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 text-center">
              No coupons yet.{'\n'}Create your first coupon!
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="mt-6"
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.secondary, COLORS.secondaryDark]}
                className="rounded-xl px-6 py-3"
              >
                <Text className="text-white font-bold">Create Coupon</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text className="text-sm text-gray-500 mb-4">
              {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'} issued
            </Text>
            {coupons.map(renderCoupon)}
          </>
        )}
      </ScrollView>

      {/* Create Coupon Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6" style={{ minHeight: '50%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-gray-900">Create Coupon</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Discount Value */}
              <View className="mb-4">
                <Text className="text-gray-900 font-semibold mb-2">Discount Percentage (%)</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
                  placeholder="e.g., 10, 20, 50"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={formData.rewardValue}
                  onChangeText={(value) => setFormData({ ...formData, rewardValue: value })}
                />
              </View>

              {/* Description */}
              <View className="mb-4">
                <Text className="text-gray-900 font-semibold mb-2">Description</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
                  placeholder="e.g., Thank you for your review!"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={formData.description}
                  onChangeText={(value) => setFormData({ ...formData, description: value })}
                />
              </View>

              {/* Validity Hours */}
              <View className="mb-6">
                <Text className="text-gray-900 font-semibold mb-2">Valid For (hours)</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
                  placeholder="2"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={formData.validityHours}
                  onChangeText={(value) => setFormData({ ...formData, validityHours: value })}
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Default: 2 hours (coupon will expire after this time)
                </Text>
              </View>

              {/* Info Box */}
              <View className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#FFF9F0' }}>
                <View className="flex-row items-center mb-2">
                  <Icon name="information-circle" size={20} color={COLORS.secondary} />
                  <Text className="text-sm font-bold ml-2" style={{ color: COLORS.secondary }}>
                    About Coupons
                  </Text>
                </View>
                <Text className="text-xs text-gray-600">
                  Coupons are automatically generated when customers leave reviews. You can also create manual coupons here for special promotions.
                </Text>
              </View>

              {/* Create Button */}
              <TouchableOpacity
                onPress={handleCreateCoupon}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.secondary, COLORS.secondaryDark]}
                  className="rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-bold text-lg">Create Coupon</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

