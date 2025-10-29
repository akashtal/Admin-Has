import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../config/colors';

export default function SignUpScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const role = route.params?.role || 'customer';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: role,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const roleConfig = {
    customer: {
      title: 'Create Account',
      subtitle: 'Join HashView as a Customer',
      icon: 'person',
      gradientColors: [COLORS.secondary, COLORS.secondaryDark],
    },
    business: {
      title: 'Business Registration',
      subtitle: 'Register Your Business',
      icon: 'business',
      gradientColors: [COLORS.secondary, COLORS.secondaryDark],
    },
  };

  const config = roleConfig[role] || roleConfig.customer;

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must not exceed 50 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-15 digit phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    // Navigate to email confirmation screen
    navigation.navigate('ConfirmEmail', { 
      userData: {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: role
      }
    });
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      className="flex-1"
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-12 ml-6 bg-white/10 rounded-full p-3 self-start"
          >
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Logo */}
          <View className="items-center mt-4 mb-4">
            <Image
              source={require('../../../assets/HashViewlogo-01.png')}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
          </View>

          {/* Sign Up Form Card */}
          <View className="flex-1 bg-white rounded-t-3xl px-6 pt-6">
            {/* Header */}
            <View className="items-center mb-6">
              <LinearGradient
                colors={config.gradientColors}
                className="rounded-full p-3 mb-3"
              >
                <Icon name={config.icon} size={28} color="white" />
              </LinearGradient>
              <Text className="text-2xl font-bold text-gray-900">
                {config.title}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                {config.subtitle}
              </Text>
            </View>

            {/* Name Input */}
            <View className="mb-3">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Full Name</Text>
              <View 
                className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border"
                style={{ borderColor: errors.name ? COLORS.error : COLORS.gray200 }}
              >
                <Icon name="person-outline" size={20} color={errors.name ? COLORS.error : COLORS.gray500} />
                <TextInput
                  className="flex-1 ml-3 text-gray-900"
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.gray400}
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData({ ...formData, name: text });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  autoCapitalize="words"
                />
              </View>
              {errors.name && (
                <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>
              )}
            </View>

            {/* Email Input */}
            <View className="mb-3">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Email Address</Text>
              <View 
                className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border"
                style={{ borderColor: errors.email ? COLORS.error : COLORS.gray200 }}
              >
                <Icon name="mail-outline" size={20} color={errors.email ? COLORS.error : COLORS.gray500} />
                <TextInput
                  className="flex-1 ml-3 text-gray-900"
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.gray400}
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData({ ...formData, email: text });
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>
              )}
            </View>

            {/* Phone Number Input */}
            <View className="mb-3">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Phone Number</Text>
              <View 
                className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border"
                style={{ borderColor: errors.phone ? COLORS.error : COLORS.gray200 }}
              >
                <Icon name="call-outline" size={20} color={errors.phone ? COLORS.error : COLORS.gray500} />
                <TextInput
                  className="flex-1 ml-3 text-gray-900"
                  placeholder="Enter your phone number"
                  placeholderTextColor={COLORS.gray400}
                  value={formData.phone}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, phone: numericText });
                    if (errors.phone) setErrors({ ...errors, phone: null });
                  }}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
              {errors.phone && (
                <Text className="text-red-500 text-xs mt-1">{errors.phone}</Text>
              )}
            </View>

            {/* Password Input */}
            <View className="mb-3">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Password</Text>
              <View 
                className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border"
                style={{ borderColor: errors.password ? COLORS.error : COLORS.gray200 }}
              >
                <Icon name="lock-closed-outline" size={20} color={errors.password ? COLORS.error : COLORS.gray500} />
                <TextInput
                  className="flex-1 ml-3 text-gray-900"
                  placeholder="Create a password"
                  placeholderTextColor={COLORS.gray400}
                  value={formData.password}
                  onChangeText={(text) => {
                    setFormData({ ...formData, password: text });
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={COLORS.gray500}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Confirm Password</Text>
              <View 
                className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border"
                style={{ borderColor: errors.confirmPassword ? COLORS.error : COLORS.gray200 }}
              >
                <Icon name="lock-closed-outline" size={20} color={errors.confirmPassword ? COLORS.error : COLORS.gray500} />
                <TextInput
                  className="flex-1 ml-3 text-gray-900"
                  placeholder="Confirm your password"
                  placeholderTextColor={COLORS.gray400}
                  value={formData.confirmPassword}
                  onChangeText={(text) => {
                    setFormData({ ...formData, confirmPassword: text });
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                  }}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Icon
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={COLORS.gray500}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
              className="mb-4"
            >
              <LinearGradient
                colors={config.gradientColors}
                className="rounded-xl py-4 items-center"
                style={{ elevation: 4 }}
              >
                <Text className="text-white font-bold text-base">
                  Create Account
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row justify-center items-center mb-6">
              <Text className="text-gray-600 text-sm">Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login', { role })}>
                <Text style={{ color: config.gradientColors[0] }} className="font-bold text-sm">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
