import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { logout } from '../../store/slices/authSlice';
import COLORS from '../../config/colors';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => dispatch(logout())
        }
      ]
    );
  };

  const menuItems = [
    {
      title: 'Personal Information',
      icon: 'person-outline',
      onPress: () => Alert.alert('Coming Soon', 'This feature is under development')
    },
    {
      title: 'My Reviews',
      icon: 'chatbubbles-outline',
      onPress: () => navigation.navigate('History')
    },
    {
      title: 'My Coupons',
      icon: 'gift-outline',
      onPress: () => navigation.navigate('Coupons')
    },
    {
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => Alert.alert('Coming Soon', 'This feature is under development')
    },
    {
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => Alert.alert('Coming Soon', 'This feature is under development')
    },
    {
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => Alert.alert('Coming Soon', 'This feature is under development')
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="pt-12 pb-20 px-6"
      >
        <Text className="text-white text-2xl font-bold mb-4">Profile</Text>
        
        <View className="bg-white rounded-2xl p-6 shadow-lg -mb-16">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-3" style={{ backgroundColor: '#FFF9F0' }}>
              <Text className="text-3xl font-bold" style={{ color: COLORS.secondary }}>
                {user?.name?.charAt(0) || 'U'}
              </Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">{user?.name}</Text>
            <Text className="text-sm text-gray-500 mb-2">{user?.email}</Text>
            
            <View className="rounded-full px-4 py-2 mt-2" style={{ backgroundColor: '#FFF9F0' }}>
              <Text className="text-sm font-semibold capitalize" style={{ color: COLORS.secondary }}>
                {user?.role}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 mt-20 mb-6">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center"
          >
            <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: '#FFF9F0' }}>
              <Icon name={item.icon} size={20} color={COLORS.secondary} />
            </View>
            <Text className="flex-1 text-base text-gray-900 font-medium">{item.title}</Text>
            <Icon name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 rounded-xl p-4 mt-4 shadow-sm flex-row items-center"
        >
          <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
            <Icon name="log-out-outline" size={20} color="#EF4444" />
          </View>
          <Text className="flex-1 text-base text-red-600 font-semibold">Logout</Text>
        </TouchableOpacity>
      </View>

      <View className="px-6 pb-6">
        <Text className="text-center text-gray-400 text-xs">
          HashView v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

