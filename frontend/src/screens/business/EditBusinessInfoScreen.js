import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Alert,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../../services/api.service';
import COLORS from '../../config/colors';

export default function EditBusinessInfoScreen({ navigation, route }) {
  const { businessId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    website: '',
    category: ''
  });
  const [images, setImages] = useState({
    logo: null,
    coverImage: null
  });
  const [openHours, setOpenHours] = useState({
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '17:00', closed: false },
    saturday: { open: '09:00', close: '17:00', closed: false },
    sunday: { open: '09:00', close: '17:00', closed: true }
  });

  const categories = [
    { label: 'Restaurant', value: 'restaurant' },
    { label: 'Café', value: 'cafe' },
    { label: 'Retail Store', value: 'retail' },
    { label: 'Services', value: 'services' },
    { label: 'Healthcare', value: 'healthcare' },
    { label: 'Education', value: 'education' },
    { label: 'Entertainment', value: 'entertainment' },
    { label: 'Salon & Spa', value: 'salon' },
    { label: 'Hotel', value: 'hotel' },
    { label: 'Gym & Fitness', value: 'gym' }
  ];

  const timeSlots = [
    'Closed', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', 
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00'
  ];

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getBusiness(businessId);
      const business = response.business;
      
      setFormData({
        name: business.name || '',
        email: business.email || '',
        phone: business.phone || '',
        address: business.address?.fullAddress || '',
        description: business.description || '',
        website: business.socialMedia?.website || '',
        category: business.category || ''
      });

      if (business.openingHours) {
        setOpenHours(business.openingHours);
      }

      if (business.logo?.url) {
        setImages(prev => ({ ...prev, logo: { uri: business.logo.url } }));
      }
      if (business.coverImage?.url) {
        setImages(prev => ({ ...prev, coverImage: { uri: business.coverImage.url } }));
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateOpenHours = (day, field, value) => {
    setOpenHours({
      ...openHours,
      [day]: {
        ...openHours[day],
        [field]: value,
        closed: value === 'Closed'
      }
    });
  };

  const pickImage = async (type) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImages({ ...images, [type]: result.assets[0] });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        description: formData.description,
        website: formData.website,
        category: formData.category,
        openingHours: openHours
      };

      // If images are new files (not URLs), include them
      if (images.logo && !images.logo.uri.startsWith('http')) {
        updateData.logo = images.logo;
      }
      if (images.coverImage && !images.coverImage.uri.startsWith('http')) {
        updateData.coverImage = images.coverImage;
      }

      await ApiService.updateBusiness(businessId, updateData);
      
      Alert.alert('Success', 'Business information updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update business');
    } finally {
      setSaving(false);
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

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        className="pt-12 pb-6 px-6"
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Edit Business Info</Text>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        
        {/* Logo */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Business Logo</Text>
          <TouchableOpacity
            onPress={() => pickImage('logo')}
            className="bg-white rounded-xl border-2 border-dashed border-gray-300 py-8 items-center justify-center"
          >
            {images.logo ? (
              <Image 
                source={{ uri: images.logo.uri }} 
                className="w-24 h-24 rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <>
                <Icon name="image-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 mt-2">Change Logo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Cover Image */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Cover Image</Text>
          <TouchableOpacity
            onPress={() => pickImage('coverImage')}
            className="bg-white rounded-xl border-2 border-dashed border-gray-300 py-8 items-center justify-center"
          >
            {images.coverImage ? (
              <Image 
                source={{ uri: images.coverImage.uri }} 
                className="w-full h-32 rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <>
                <Icon name="image-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 mt-2">Change Cover Image</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Business Name */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Business Name *</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
          />
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Email *</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
          />
        </View>

        {/* Phone */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Phone Number *</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
          />
        </View>

        {/* Address */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Address</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Description</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
          />
        </View>

        {/* Website */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Website</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            keyboardType="url"
            autoCapitalize="none"
            value={formData.website}
            onChangeText={(value) => handleInputChange('website', value)}
          />
        </View>

        {/* Category */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Business Category</Text>
          <View className="bg-white rounded-xl border border-gray-200">
            <Picker
              selectedValue={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
              style={{ height: 50 }}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Opening Hours */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-3">Opening Hours</Text>
          {Object.keys(openHours).map((day) => (
            <View key={day} className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 w-24 capitalize">{day}:</Text>
              
              <View className="flex-row flex-1">
                <View className="flex-1 mr-2 bg-white rounded-xl border border-gray-200">
                  <Picker
                    selectedValue={openHours[day].open}
                    onValueChange={(value) => updateOpenHours(day, 'open', value)}
                    style={{ height: 50 }}
                  >
                    {timeSlots.map((time) => (
                      <Picker.Item key={time} label={time} value={time} />
                    ))}
                  </Picker>
                </View>

                <View className="flex-1 ml-2 bg-white rounded-xl border border-gray-200">
                  <Picker
                    selectedValue={openHours[day].close}
                    onValueChange={(value) => updateOpenHours(day, 'close', value)}
                    style={{ height: 50 }}
                    enabled={openHours[day].open !== 'Closed'}
                  >
                    {timeSlots.map((time) => (
                      <Picker.Item key={time} label={time} value={time} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
          className="mb-8"
        >
          <LinearGradient
            colors={[COLORS.secondary, COLORS.secondaryDark]}
            className="rounded-xl py-4 items-center"
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-bold text-lg">Save Changes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

