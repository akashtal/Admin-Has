import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';
import { getCoupons } from '../../store/slices/couponSlice';
import COLORS from '../../config/colors';

export default function CouponsScreen() {
  const dispatch = useDispatch();
  const { coupons, loading } = useSelector((state) => state.coupon);
  const [selectedCoupon, setSelectedCoupon] = React.useState(null);

  useEffect(() => {
    dispatch(getCoupons({ status: 'active' }));
  }, []);

  const renderCoupon = ({ item }) => {
    const isExpired = new Date(item.validUntil) < new Date();
    const hoursLeft = Math.max(0, Math.floor((new Date(item.validUntil) - new Date()) / (1000 * 60 * 60)));
    const minutesLeft = Math.max(0, Math.floor(((new Date(item.validUntil) - new Date()) % (1000 * 60 * 60)) / (1000 * 60)));

    return (
      <TouchableOpacity
        onPress={() => setSelectedCoupon(item)}
        className={`bg-white rounded-2xl p-5 mb-4 shadow-lg ${isExpired ? 'opacity-50' : ''}`}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900 mb-1">
              {item.business?.name || 'Business'}
            </Text>
            <View className="rounded-full px-3 py-1 self-start" style={{ backgroundColor: '#FFF9F0' }}>
              <Text className="text-xs font-bold" style={{ color: COLORS.secondary }}>{item.code}</Text>
            </View>
          </View>
          <View className="bg-green-100 rounded-full w-16 h-16 items-center justify-center">
            <Text className="text-2xl font-bold text-green-700">{item.rewardValue}%</Text>
          </View>
        </View>

        <Text className="text-sm text-gray-600 mb-3">{item.description}</Text>

        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <Icon name="time-outline" size={16} color={hoursLeft < 1 ? '#EF4444' : '#6B7280'} />
            <Text className={`text-xs ml-1 font-semibold ${hoursLeft < 1 ? 'text-red-600' : 'text-gray-600'}`}>
              {isExpired ? 'Expired' : `${hoursLeft}h ${minutesLeft}m left`}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedCoupon(item)}>
            <View className="flex-row items-center">
              <Icon name="qr-code-outline" size={16} color={COLORS.secondary} />
              <Text className="text-xs font-semibold ml-1" style={{ color: COLORS.secondary }}>Show QR</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="pt-12 pb-6 px-6 rounded-b-3xl"
      >
        <Text className="text-white text-2xl font-bold mb-2">My Coupons</Text>
        <Text className="text-white opacity-90">
          {coupons.length} active {coupons.length === 1 ? 'coupon' : 'coupons'}
        </Text>
      </LinearGradient>

      <View className="flex-1 px-6 mt-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={COLORS.secondary} />
          </View>
        ) : coupons.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Icon name="gift-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 text-center">
              No active coupons
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2">
              Write reviews to earn rewards!
            </Text>
          </View>
        ) : (
          <FlatList
            data={coupons}
            renderItem={renderCoupon}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* QR Code Modal with Full Details */}
      {selectedCoupon && (
        <TouchableOpacity
          onPress={() => setSelectedCoupon(null)}
          className="absolute inset-0 bg-black/50 justify-center items-center"
          activeOpacity={1}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl m-6 max-w-sm w-full"
          >
            <ScrollView className="max-h-[90%]" showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View className="p-6 pb-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-2xl font-bold text-gray-900 flex-1">
                    {selectedCoupon.business?.name || 'Business'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedCoupon(null)}
                    className="ml-2"
                  >
                    <Icon name="close-circle" size={28} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                {/* Business Logo */}
                {selectedCoupon.business?.logo?.url && (
                  <View className="items-center mb-3">
                    <Image
                      source={{ uri: selectedCoupon.business.logo.url }}
                      className="w-20 h-20 rounded-xl"
                      resizeMode="cover"
                    />
                  </View>
                )}
                
                {/* Coupon Code */}
                <View className="bg-[#FFF9F0] rounded-xl px-4 py-3 items-center">
                  <Text className="text-xs text-gray-600 mb-1">Coupon Code</Text>
                  <Text className="text-lg font-bold" style={{ color: COLORS.secondary }}>
                    {selectedCoupon.code}
                  </Text>
                </View>
              </View>

              {/* Business Details */}
              <View className="p-6 pt-4">
                <Text className="text-lg font-bold text-gray-900 mb-4">Business Details</Text>
                
                {/* Address */}
                {selectedCoupon.business?.address?.fullAddress && (
                  <View className="flex-row items-start mb-3">
                    <Icon name="location" size={20} color={COLORS.secondary} />
                    <View className="flex-1 ml-3">
                      <Text className="text-xs text-gray-500 mb-1">Address</Text>
                      <Text className="text-sm text-gray-900">
                        {selectedCoupon.business.address.fullAddress}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Phone */}
                {selectedCoupon.business?.phone && (
                  <View className="flex-row items-center mb-3">
                    <Icon name="call" size={20} color={COLORS.secondary} />
                    <View className="flex-1 ml-3">
                      <Text className="text-xs text-gray-500 mb-1">Phone</Text>
                      <Text className="text-sm text-gray-900">{selectedCoupon.business.phone}</Text>
                    </View>
                  </View>
                )}

                {/* Category */}
                {selectedCoupon.business?.category && (
                  <View className="flex-row items-center mb-4">
                    <Icon name="pricetag" size={20} color={COLORS.secondary} />
                    <View className="flex-1 ml-3">
                      <Text className="text-xs text-gray-500 mb-1">Category</Text>
                      <Text className="text-sm text-gray-900 capitalize">
                        {selectedCoupon.business.category}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Divider */}
                <View className="h-px bg-gray-200 my-4" />

                {/* Coupon Details */}
                <Text className="text-lg font-bold text-gray-900 mb-4">Coupon Details</Text>
                
                {/* Reward */}
                <View className="bg-green-50 rounded-xl p-4 mb-3">
                  <Text className="text-xs text-gray-600 mb-1">Discount</Text>
                  <Text className="text-2xl font-bold text-green-700">
                    {selectedCoupon.rewardType === 'percentage' 
                      ? `${selectedCoupon.rewardValue}% OFF`
                      : selectedCoupon.rewardType === 'fixed'
                      ? `£${selectedCoupon.rewardValue} OFF`
                      : selectedCoupon.rewardType === 'free_item' || selectedCoupon.rewardType === 'free_drink'
                      ? `Free ${selectedCoupon.itemName || 'Item'}`
                      : `${selectedCoupon.rewardValue}% OFF`}
                  </Text>
                </View>

                {/* Description */}
                {selectedCoupon.description && (
                  <View className="mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Description</Text>
                    <Text className="text-sm text-gray-700">{selectedCoupon.description}</Text>
                  </View>
                )}

                {/* Validity */}
                <View className="flex-row items-center mb-4">
                  <Icon name="time" size={18} color="#6B7280" />
                  <View className="flex-1 ml-2">
                    <Text className="text-xs text-gray-500 mb-1">Valid Until</Text>
                    <Text className="text-sm text-gray-900">
                      {new Date(selectedCoupon.validUntil).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Terms */}
                {selectedCoupon.terms && (
                  <View className="mb-4">
                    <Text className="text-xs text-gray-500 mb-1">Terms & Conditions</Text>
                    <Text className="text-xs text-gray-600">{selectedCoupon.terms}</Text>
                  </View>
                )}

                {/* QR Code Section */}
                <View className="mt-4 pt-4 border-t border-gray-200">
                  <Text className="text-center text-sm font-semibold text-gray-900 mb-3">
                    Scan QR Code to Redeem
                  </Text>
                  
                  <View className="bg-white p-6 rounded-2xl shadow-lg items-center border-2 border-gray-100">
                    <QRCode
                      value={selectedCoupon.qrCodeData || JSON.stringify({
                        type: 'coupon',
                        couponId: selectedCoupon._id,
                        code: selectedCoupon.code,
                        businessId: selectedCoupon.business?._id
                      })}
                      size={220}
                      backgroundColor="white"
                      color="black"
                    />
                  </View>

                  <Text className="text-center text-xs text-gray-500 mt-3">
                    Show this QR code to the business owner
                  </Text>
                </View>
              </View>

              {/* Close Button */}
              <View className="px-6 pb-6 pt-2">
                <TouchableOpacity
                  onPress={() => setSelectedCoupon(null)}
                  className="bg-gray-100 rounded-xl py-3 items-center"
                >
                  <Text className="text-gray-700 font-semibold">Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}

