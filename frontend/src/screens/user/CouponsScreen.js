import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
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

      {/* QR Code Modal */}
      {selectedCoupon && (
        <TouchableOpacity
          onPress={() => setSelectedCoupon(null)}
          className="absolute inset-0 bg-black/50 justify-center items-center"
          activeOpacity={1}
        >
          <View className="bg-white rounded-3xl p-6 m-6 items-center">
            <Text className="text-xl font-bold text-gray-900 mb-2">
              {selectedCoupon.business?.name}
            </Text>
            <Text className="text-sm text-gray-600 mb-4">{selectedCoupon.code}</Text>
            
            <View className="bg-white p-4 rounded-2xl shadow-lg">
              <QRCode
                value={JSON.stringify({
                  type: 'coupon',
                  id: selectedCoupon._id,
                  code: selectedCoupon.code,
                  business: selectedCoupon.business?._id
                })}
                size={200}
              />
            </View>

            <View className="rounded-xl p-4 mt-4 w-full" style={{ backgroundColor: '#FFF9F0' }}>
              <Text className="text-center font-semibold mb-2" style={{ color: COLORS.secondary }}>
                {selectedCoupon.rewardValue}% Discount
              </Text>
              <Text className="text-center text-xs text-gray-600">
                Show this QR code to the business to redeem
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setSelectedCoupon(null)}
              className="mt-4 bg-gray-200 rounded-full px-6 py-3"
            >
              <Text className="text-gray-700 font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

