import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import COLORS from '../../config/colors';

export default function RoleSelectionScreen({ navigation }) {
  const handleRoleSelect = (role) => {
    navigation.navigate('Login', { role });
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      className="flex-1"
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View className="flex-1 justify-center items-center px-6">
        {/* Logo */}
        <View className="items-center mb-12">
          <Image
            source={require('../../../assets/HashViewlogo-01.png')}
            style={{ width: 200, height: 200, marginBottom: 20 }}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-white text-center mb-2">
            Welcome to HashView
          </Text>
          <Text className="text-base text-white/80 text-center">
            Choose your account type to continue
          </Text>
        </View>

        {/* Role Cards */}
        <View className="w-full space-y-4">
          {/* Customer Card */}
          <TouchableOpacity
            onPress={() => handleRoleSelect('customer')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.secondary, COLORS.secondaryDark]}
              className="rounded-3xl p-6"
              style={{ elevation: 8 }}
            >
              <View className="flex-row items-center">
                <View className="bg-white/20 rounded-full p-4 mr-4">
                  <Icon name="person" size={32} color="white" />
                  
                </View>
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-white mb-1">
                    Customer
                  </Text>
                  <Text className="text-white/90 text-sm">
                    Discover and review local businesses
                  </Text>
                </View>
                <Icon name="chevron-forward" size={28} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Business Owner Card */}
          <TouchableOpacity
            onPress={() => handleRoleSelect('business')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.secondary, COLORS.secondaryDark]}
              className="rounded-3xl p-6"
              style={{ elevation: 8 }}
            >
              <View className="flex-row items-center">
                <View className="bg-white/20 rounded-full p-4 mr-4">
                  <Icon name="business" size={32} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-white mb-1">
                    Business Owner
                  </Text>
                  <Text className="text-white/90 text-sm">
                    Manage your business and customers
                  </Text>
                </View>
                <Icon name="chevron-forward" size={28} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Admin Login Hint */}
        <View className="mt-8">
          <Text className="text-white/60 text-sm text-center">
            Admin? Login as Customer with admin credentials
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
