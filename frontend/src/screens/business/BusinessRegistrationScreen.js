import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  StatusBar,
  Image,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { registerBusiness } from '../../store/slices/businessSlice';
import SimpleLocationPicker from '../../components/SimpleLocationPicker';
import ApiService from '../../services/api.service';
import COLORS from '../../config/colors';

export default function BusinessRegistrationScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.business);
  
  const [formData, setFormData] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    website: '',
    tripAdvisorLink: '',
    googleBusinessName: '',
    category: ''
  });

  const [images, setImages] = useState({
    logo: null,
    coverImage: null,
    gallery: [] // Gallery images array
  });
  const [uploadedImages, setUploadedImages] = useState({
    logo: null,
    coverImage: null,
    gallery: []
  });
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({
    logo: false,
    coverImage: false,
    gallery: false
  });

  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: '',
    loading: true,
    error: null
  });

  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Address search states
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);

  const [openHours, setOpenHours] = useState({
    monday: { open: '09:00 AM', close: '05:00 PM', closed: false },
    tuesday: { open: '09:00 AM', close: '05:00 PM', closed: false },
    wednesday: { open: '09:00 AM', close: '05:00 PM', closed: false },
    thursday: { open: '09:00 AM', close: '05:00 PM', closed: false },
    friday: { open: '09:00 AM', close: '05:00 PM', closed: false },
    saturday: { open: '09:00 AM', close: '05:00 PM', closed: false },
    sunday: { open: '09:00 AM', close: '05:00 PM', closed: true }
  });

  // Function to search for addresses using Google Places API or Nominatim
  const searchAddress = async (query) => {
    if (query.trim().length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    try {
      setSearchingAddress(true);
      
      // Using Nominatim (OpenStreetMap) - Free API
      // You can replace this with Google Places API if you have an API key
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'HashView/1.0'  // Nominatim requires a User-Agent
          }
        }
      );
      
      // Check if response is ok
      if (!response.ok) {
        console.error('Address search API error:', response.status);
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
        return;
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Address search API returned non-JSON response');
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
        return;
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('Address search API returned invalid data');
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
        return;
      }
      
      const suggestions = data.map(item => ({
        id: item.place_id,
        address: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      }));
      
      setAddressSuggestions(suggestions);
      setShowAddressSuggestions(suggestions.length > 0);
      
      if (suggestions.length > 0) {
        console.log(`✅ Found ${suggestions.length} address suggestions`);
      }
    } catch (error) {
      console.error('Error searching address:', error);
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Debounce address search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (addressSearchQuery) {
        searchAddress(addressSearchQuery);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [addressSearchQuery]);

  // Function to select address from suggestions
  const selectAddressSuggestion = (suggestion) => {
    setFormData({ ...formData, address: suggestion.address });
    setAddressSearchQuery(suggestion.address);
    setLocation({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      address: suggestion.address,
      loading: false,
      error: null
    });
    setShowAddressSuggestions(false);
    setAddressSuggestions([]); // Clear suggestions after selection
    console.log('✅ Address selected from search:', suggestion.address);
    console.log('📍 Location:', suggestion.latitude.toFixed(6), suggestion.longitude.toFixed(6));
  };

  // Function to get location
  const getLocation = async () => {
    try {
      setLocation(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('📍 Requesting location permission...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: 'Location permission denied'
        }));
        Alert.alert(
          'Location Required',
          'This app needs location permission to register your business. Location is required for the geofencing feature (users can only review within 50 meters).',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Grant Permission', onPress: () => Location.requestForegroundPermissionsAsync().then(getLocation) }
          ]
        );
        return;
      }

      console.log('📍 Getting current location...');
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 0
      });
      
      console.log('✅ Location obtained:', currentLocation.coords.latitude, currentLocation.coords.longitude);
      
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        loading: false,
        error: null
      });

      // Reverse geocode to get address
      const addressData = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      });

      if (addressData && addressData.length > 0) {
        const addr = addressData[0];
        const fullAddress = `${addr.name || ''}, ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}, ${addr.country || ''}`.replace(/,\s*,/g, ',').trim();
        setFormData({ ...formData, address: fullAddress });
        setAddressSearchQuery(fullAddress);
        setLocation(prev => ({ ...prev, address: fullAddress }));
      }
    } catch (error) {
      console.error('❌ Error getting location:', error);
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please:\n\n1. Enable Location Services in device settings\n2. Make sure GPS is turned ON\n3. Try going outside or near a window\n\nGo to: Settings → Location → Turn ON',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: getLocation }
        ]
      );
    }
  };

  // Get current location on mount
  useEffect(() => {
    getLocation();
  }, []);

  const categories = [
    { label: 'Select Category', value: '' },
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
    'Closed',
    '12:00 AM', '12:30 AM', '01:00 AM', '01:30 AM', '02:00 AM', '02:30 AM',
    '03:00 AM', '03:30 AM', '04:00 AM', '04:30 AM', '05:00 AM', '05:30 AM',
    '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
    '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
  ];

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
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
        allowsEditing: type !== 'gallery',
        aspect: type === 'logo' ? [1, 1] : type === 'coverImage' ? [16, 9] : undefined,
        quality: 0.8,
        allowsMultipleSelection: type === 'gallery'
      });

      if (!result.canceled) {
        if (type === 'gallery') {
          // For gallery, add multiple images
          setImages({ ...images, gallery: [...images.gallery, ...result.assets] });
        } else {
          // For logo and cover, single image
          setImages({ ...images, [type]: result.assets[0] });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeGalleryImage = (index) => {
    const newGallery = images.gallery.filter((_, i) => i !== index);
    setImages({ ...images, gallery: newGallery });
  };

  // Upload image to Cloudinary via backend
  const uploadImageToCloudinary = async (imageUri, imageType, businessId = null) => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const extension = match ? match[1].toLowerCase() : 'jpg';
      const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

      const fieldName = imageType === 'logo' ? 'logo' : imageType === 'coverImage' ? 'coverImage' : 'images';
      
      formData.append(fieldName, {
        uri: imageUri,
        name: filename,
        type: mimeType
      });

      let response;
      if (imageType === 'logo') {
        response = await ApiService.uploadBusinessLogo(formData, businessId);
      } else if (imageType === 'coverImage') {
        response = await ApiService.uploadBusinessCover(formData, businessId);
      } else {
        response = await ApiService.uploadBusinessGallery(formData, businessId);
      }

      if (response.success || response.data) {
        // Handle response format
        const data = response.data || response;
        
        // For gallery, response has images array
        if (imageType === 'gallery' && response.images && response.images.length > 0) {
          return response.images[0]; // Return first image from array
        }
        
        return {
          url: data.url || data.imageUrl,
          publicId: data.publicId || data.public_id
        };
      }
      throw new Error(response.message || 'Upload failed');
    } catch (error) {
      console.error(`Error uploading ${imageType}:`, error);
      throw error;
    }
  };

  // Upload multiple gallery images at once
  const uploadGalleryImages = async (galleryImages, businessId = null) => {
    if (!galleryImages || galleryImages.length === 0) return [];

    try {
      const formData = new FormData();
      
      // Append all gallery images to formData
      galleryImages.forEach((img, index) => {
        const filename = img.uri.split('/').pop() || `gallery_${Date.now()}_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const extension = match ? match[1].toLowerCase() : 'jpg';
        const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
        
        formData.append('images', {
          uri: img.uri,
          name: filename,
          type: mimeType
        });
      });

      const response = await ApiService.uploadBusinessGallery(formData, businessId);
      
      if (response.success && response.images && response.images.length > 0) {
        return response.images.map((img, index) => ({
          url: img.url,
          publicId: img.publicId,
          originalUri: galleryImages[index]?.uri // Store original URI for matching
        }));
      }
      
      throw new Error(response.message || 'Gallery upload failed');
    } catch (error) {
      console.error('Error uploading gallery images:', error);
      throw error;
    }
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

  const validateForm = () => {
    if (!formData.businessName.trim()) {
      Alert.alert('Error', 'Please enter business name');
      return false;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Please enter business address');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select business category');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!location.latitude || !location.longitude) {
      Alert.alert(
        'Location Required',
        'Business location is required for geofencing. Please enable location services and restart the app.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    try {
      setUploading(true);

      // Register business FIRST (without blocking on image uploads)
      // Images will be uploaded after registration in the background
      const businessData = {
        name: formData.businessName?.trim() || '',
        ownerName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
        email: formData.email?.trim() || '',
        phone: formData.phone?.trim() || '',
        address: formData.address?.trim() || '',
        category: formData.category || '',
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        // Optional fields - only include if they have values
        ...(formData.description?.trim() && { description: formData.description.trim() }),
        ...(formData.website?.trim() && { website: formData.website.trim() }),
        ...(formData.tripAdvisorLink?.trim() && { tripAdvisorLink: formData.tripAdvisorLink.trim() }),
        ...(formData.googleBusinessName?.trim() && { googleBusinessName: formData.googleBusinessName.trim() }),
        ...(openHours && Object.keys(openHours).length > 0 && { openingHours: openHours }),
        // Images will be null initially, uploaded later
        logo: null,
        logoPublicId: null,
        coverImage: null,
        coverImagePublicId: null,
        images: []
      };

      console.log('📝 Submitting business registration (images will be uploaded separately)...');
      const result = await dispatch(registerBusiness(businessData)).unwrap();
      
      console.log('✅ Registration successful:', result);
      const businessId = result.business._id;

      // Upload images AFTER registration (non-blocking, with timeout)
      if (images.logo || images.coverImage || (images.gallery && images.gallery.length > 0)) {
        console.log('📸 Starting background image uploads...');
        
        // Upload images in parallel with timeout
        const uploadPromises = [];
        
        // Upload logo with timeout
        if (images.logo) {
          uploadPromises.push(
            Promise.race([
              uploadImageToCloudinary(images.logo.uri, 'logo', businessId).then(logoData => {
                console.log('✅ Logo uploaded:', logoData.url);
                // Update business with logo
                return ApiService.updateBusinessImages(businessId, {
                  logo: logoData.url,
                  logoPublicId: logoData.publicId
                }).catch(err => console.error('Failed to update logo:', err));
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Logo upload timeout')), 30000))
            ]).catch(error => {
              console.error('⚠️ Logo upload failed or timed out:', error.message);
              setUploadStatus(prev => ({ ...prev, logo: false }));
            })
          );
        }

        // Upload cover image with timeout
        if (images.coverImage) {
          uploadPromises.push(
            Promise.race([
              uploadImageToCloudinary(images.coverImage.uri, 'coverImage', businessId).then(coverData => {
                console.log('✅ Cover image uploaded:', coverData.url);
                // Update business with cover image
                return ApiService.updateBusinessImages(businessId, {
                  coverImage: coverData.url,
                  coverImagePublicId: coverData.publicId
                }).catch(err => console.error('Failed to update cover image:', err));
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Cover upload timeout')), 30000))
            ]).catch(error => {
              console.error('⚠️ Cover image upload failed or timed out:', error.message);
              setUploadStatus(prev => ({ ...prev, coverImage: false }));
            })
          );
        }

        // Upload gallery images with timeout
        if (images.gallery && images.gallery.length > 0) {
          uploadPromises.push(
            Promise.race([
              uploadGalleryImages(images.gallery, businessId).then(uploadedGallery => {
                console.log(`✅ Gallery images uploaded: ${uploadedGallery.length} images`);
                // Update business with gallery images
                const galleryUrls = uploadedGallery.map(img => ({
                  url: img.url,
                  publicId: img.publicId
                }));
                return ApiService.updateBusinessImages(businessId, {
                  images: galleryUrls
                }).catch(err => console.error('Failed to update gallery images:', err));
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Gallery upload timeout')), 60000))
            ]).catch(error => {
              console.error('⚠️ Gallery upload failed or timed out:', error.message);
              setUploadStatus(prev => ({ ...prev, gallery: false }));
            })
          );
        }

        // Wait for all uploads (but don't block navigation)
        Promise.allSettled(uploadPromises).then(() => {
          console.log('📸 All image uploads completed');
        });
      }
      
      // Navigate immediately (don't wait for image uploads)
      setTimeout(() => {
        navigation.navigate('VerifyBusiness', { businessId });
      }, 100);
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      // Handle error object from Redux thunk
      let errorMessage = 'Failed to register business. Please check your internet connection and try again.';
      let errorDetails = [];
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
        errorDetails = error.errors || [];
      } else if (error?.response?.data) {
        errorMessage = error.response.data.message || errorMessage;
        errorDetails = error.response.data.errors || [];
      }
      
      // Show detailed validation errors if available
      if (errorDetails.length > 0) {
        const detailedMessage = `${errorMessage}\n\n${errorDetails.join('\n')}`;
        Alert.alert('Registration Failed', detailedMessage);
      } else {
        Alert.alert('Registration Failed', errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

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
          <Text className="text-white text-2xl font-bold">Business Registration</Text>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        
        {/* Location Status */}
        <View className="mb-4 bg-blue-50 rounded-xl p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              {location.loading ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text className="ml-3 text-blue-700">Getting location...</Text>
                </>
              ) : location.error ? (
                <>
                  <Icon name="alert-circle" size={20} color="#DC2626" />
                  <Text className="ml-3 text-red-600 flex-1">Location Error</Text>
                </>
              ) : (
                <>
                  <Icon name="checkmark-circle" size={20} color="#10B981" />
                  <Text className="ml-3 text-green-700 flex-1">Location detected ✓</Text>
                </>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowLocationPicker(true)}
              className="ml-2"
            >
              <Icon name="map" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          {location.latitude && location.longitude && (
            <Text className="mt-1 text-xs text-gray-500">
              Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
            </Text>
          )}
          
          {location.error && (
            <View className="mt-3 flex-row">
              <TouchableOpacity
                onPress={getLocation}
                className="bg-red-500 rounded-lg py-2 px-4 items-center flex-1 mr-2"
              >
                <Text className="text-white font-semibold">Retry Auto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(true)}
                className="bg-blue-500 rounded-lg py-2 px-4 items-center flex-1 ml-2"
              >
                <Text className="text-white font-semibold">Pick Manually</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Business Name */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Business Name</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            placeholder="Relax Restaurant"
            placeholderTextColor="#9CA3AF"
            value={formData.businessName}
            onChangeText={(value) => handleInputChange('businessName', value)}
          />
        </View>

        {/* First Name & Last Name */}
        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <Text className="text-gray-900 font-semibold mb-2">First Name</Text>
            <TextInput
              className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
              placeholder="Enter First Name"
              placeholderTextColor="#9CA3AF"
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
            />
          </View>
          <View className="flex-1 ml-2">
            <Text className="text-gray-900 font-semibold mb-2">Last Name</Text>
            <TextInput
              className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
              placeholder="Enter Last Name"
              placeholderTextColor="#9CA3AF"
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
            />
          </View>
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Email</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            placeholder="Enter Valid Email Address"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
          />
        </View>

        {/* Phone Number */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Phone Number</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            placeholder="Enter Phone Number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
          />
        </View>

        {/* Enhanced Address with Search & Manual Location Picker */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Business Address & Location</Text>
          
          {/* Two Options: Search or Pick */}
          <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
            {/* Option 1: Search Address */}
            <View className="mb-3" style={{ zIndex: 100 }}>
              <View className="flex-row items-center mb-2">
                <View className="bg-blue-50 rounded-full w-8 h-8 items-center justify-center mr-2">
                  <Text className="font-bold text-blue-600">1</Text>
                </View>
                <Text className="text-gray-700 font-medium">Search Address</Text>
              </View>
              
              <View style={{ position: 'relative', zIndex: 100 }}>
                <View className="bg-gray-50 rounded-lg border border-gray-200 flex-row items-center px-3 py-3">
                  <Icon name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-gray-900"
                    placeholder="Type your business address..."
                    placeholderTextColor="#9CA3AF"
                    value={addressSearchQuery}
                    onChangeText={(value) => {
                      setAddressSearchQuery(value);
                      handleInputChange('address', value);
                      if (value.trim().length >= 3) {
                        setShowAddressSuggestions(true);
                      } else {
                        setShowAddressSuggestions(false);
                        setAddressSuggestions([]);
                      }
                    }}
                    onFocus={() => {
                      if (addressSearchQuery.trim().length >= 3 && addressSuggestions.length > 0) {
                        setShowAddressSuggestions(true);
                      }
                    }}
                  />
                  {searchingAddress && (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  )}
                  {addressSearchQuery.length > 0 && !searchingAddress && (
                    <TouchableOpacity onPress={() => {
                      setAddressSearchQuery('');
                      setAddressSuggestions([]);
                      setShowAddressSuggestions(false);
                      handleInputChange('address', '');
                    }}>
                      <Icon name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Address Suggestions Dropdown - Fixed positioning */}
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <View 
                    className="absolute left-0 right-0 bg-white rounded-lg border-2 border-blue-400 shadow-2xl" 
                    style={{ 
                      top: 48,  // Position right below the search input
                      maxHeight: 250, 
                      elevation: 10,
                      zIndex: 999,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 5
                    }}
                  >
                    <ScrollView 
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={true}
                    >
                      {addressSuggestions.map((item, index) => (
                        <TouchableOpacity
                          key={item.id.toString()}
                          onPress={() => selectAddressSuggestion(item)}
                          className="px-4 py-4 border-b border-gray-100 flex-row items-center"
                          activeOpacity={0.7}
                          style={{ 
                            backgroundColor: '#FAFAFA',
                            borderBottomWidth: index === addressSuggestions.length - 1 ? 0 : 1 
                          }}
                        >
                          <View className="bg-blue-50 rounded-full p-2 mr-3">
                            <Icon name="location" size={18} color={COLORS.primary} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-900 font-medium" numberOfLines={2}>
                              {item.address.split(',')[0]}
                            </Text>
                            <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
                              {item.address.split(',').slice(1).join(',')}
                            </Text>
                          </View>
                          <Icon name="arrow-forward-circle" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Divider */}
            <View className="flex-row items-center my-3">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-3 text-gray-500 text-xs">OR</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Option 2: Pick from Map */}
            <View>
              <View className="flex-row items-center mb-2">
                <View className="bg-orange-50 rounded-full w-8 h-8 items-center justify-center mr-2">
                  <Text className="font-bold text-orange-600">2</Text>
                </View>
                <Text className="text-gray-700 font-medium">Pick from Map</Text>
              </View>
              
              <TouchableOpacity
                onPress={() => setShowLocationPicker(true)}
                activeOpacity={0.7}
                style={{ backgroundColor: COLORS.secondary + '15' }}
                className="rounded-lg border-2 border-dashed py-4 items-center"
              >
                <View className="rounded-full p-3 mb-2" style={{ backgroundColor: COLORS.secondary + '20' }}>
                  <Icon name="map" size={28} color={COLORS.secondary} />
                </View>
                <Text className="font-semibold" style={{ color: COLORS.secondary }}>
                  Open Map Picker
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Manually select your business location
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Selected Location Display */}
          {location.latitude && location.longitude && (
            <View className="bg-green-50 rounded-xl p-4 border-2 border-green-300 mt-2">
              <View className="flex-row items-center mb-2">
                <View className="bg-green-500 rounded-full p-2">
                  <Icon name="checkmark-circle" size={24} color="#FFF" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-green-800 font-bold text-base">
                    Location Confirmed ✓
                  </Text>
                  <Text className="text-green-600 text-xs">
                    Your business location is set
                  </Text>
                </View>
              </View>
              {formData.address && (
                <View className="bg-white rounded-lg p-2 mt-2">
                  <Text className="text-gray-900 text-xs font-medium mb-1">
                    📍 Address:
                  </Text>
                  <Text className="text-gray-700 text-xs">
                    {formData.address}
                  </Text>
                </View>
              )}
              <View className="flex-row items-center mt-2 bg-white rounded-lg p-2">
                <Icon name="location" size={16} color="#10B981" />
                <Text className="text-gray-600 text-xs ml-2">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Business Description */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Business Description</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            placeholder="Short Business Description..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
          />
        </View>

        {/* Logo Upload */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-900 font-semibold">Logo</Text>
            {uploadedImages.logo && (
              <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-full">
                <Icon name="checkmark-circle" size={16} color="#10B981" />
                <Text className="text-green-700 text-xs font-semibold ml-1">Uploaded</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => pickImage('logo')}
            className="bg-white rounded-xl border-2 border-dashed border-gray-300 py-12 items-center justify-center relative"
            disabled={uploading}
          >
            {images.logo ? (
              <View className="items-center">
                <Image 
                  source={{ uri: images.logo.uri }} 
                  className="w-24 h-24 rounded-lg"
                  resizeMode="cover"
                />
                {uploadedImages.logo && (
                  <View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                    <Icon name="checkmark" size={16} color="#FFF" />
                  </View>
                )}
                {uploadStatus.logo && !uploadedImages.logo && (
                  <View className="absolute top-2 right-2">
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                )}
              </View>
            ) : (
              <>
                <Icon name="image-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 mt-2">Select File</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Business Cover Image */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-900 font-semibold">Business Cover Image</Text>
            {uploadedImages.coverImage && (
              <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-full">
                <Icon name="checkmark-circle" size={16} color="#10B981" />
                <Text className="text-green-700 text-xs font-semibold ml-1">Uploaded</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => pickImage('coverImage')}
            className="bg-white rounded-xl border-2 border-dashed border-gray-300 py-12 items-center justify-center relative"
            disabled={uploading}
          >
            {images.coverImage ? (
              <View className="w-full relative">
                <Image 
                  source={{ uri: images.coverImage.uri }} 
                  className="w-full h-32 rounded-lg"
                  resizeMode="cover"
                />
                {uploadedImages.coverImage && (
                  <View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                    <Icon name="checkmark" size={16} color="#FFF" />
                  </View>
                )}
                {uploadStatus.coverImage && !uploadedImages.coverImage && (
                  <View className="absolute top-2 right-2 bg-white rounded-full p-1">
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                )}
              </View>
            ) : (
              <>
                <Icon name="image-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 mt-2">Select File</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Business Gallery Images */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-900 font-semibold">Business Gallery Images</Text>
            <View className="flex-row items-center">
              {uploadedImages.gallery.length > 0 && (
                <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-full mr-2">
                  <Icon name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-green-700 text-xs font-semibold ml-1">
                    {uploadedImages.gallery.length} Uploaded
                  </Text>
                </View>
              )}
              <Text className="text-xs text-gray-500">Optional</Text>
            </View>
          </View>
          
          {/* Gallery Images Grid */}
          {images.gallery.length > 0 && (
            <View className="flex-row flex-wrap mb-3">
              {images.gallery.map((img, index) => {
                const isUploaded = uploadedImages.gallery.some(uploaded => uploaded.url === img.uri || uploaded.originalUri === img.uri);
                const isUploading = uploadStatus.gallery && !isUploaded;
                
                return (
                  <View key={index} className="relative mr-2 mb-2">
                    <Image 
                      source={{ uri: img.uri }} 
                      className="w-20 h-20 rounded-lg"
                      resizeMode="cover"
                    />
                    {isUploaded && (
                      <View className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                        <Icon name="checkmark" size={12} color="#FFF" />
                      </View>
                    )}
                    {isUploading && (
                      <View className="absolute inset-0 bg-black/30 rounded-lg items-center justify-center">
                        <ActivityIndicator size="small" color="#FFF" />
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => removeGalleryImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                    >
                      <Icon name="close" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            onPress={() => pickImage('gallery')}
            className="bg-white rounded-xl border-2 border-dashed border-gray-300 py-8 items-center justify-center"
          >
            <Icon name="images-outline" size={32} color="#D1D5DB" />
            <Text className="text-gray-500 mt-2">
              {images.gallery.length > 0 ? `Add More Images (${images.gallery.length} selected)` : 'Add Gallery Images'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Website */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Website</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            placeholder="www.yourbusiness.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
            autoCapitalize="none"
            value={formData.website}
            onChangeText={(value) => handleInputChange('website', value)}
          />
        </View>

        {/* TripAdvisor Profile Link */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">TripAdvisor Profile Link (Optional)</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            placeholder="https://www.tripadvisor.com/Restaurant_Review..."
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
            autoCapitalize="none"
            value={formData.tripAdvisorLink}
            onChangeText={(value) => handleInputChange('tripAdvisorLink', value)}
          />
        </View>

        {/* Google Business Name */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-900 font-semibold">Google Business Name *</Text>
            <Text className="text-xs text-gray-500">Required for ratings</Text>
          </View>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
            placeholder="e.g., My Restaurant, New York"
            placeholderTextColor="#9CA3AF"
            value={formData.googleBusinessName}
            onChangeText={(value) => handleInputChange('googleBusinessName', value)}
          />
          <Text className="text-xs text-gray-400 mt-1 ml-1">
            Enter your exact Google Business name (same as on Google Maps). Not a URL link.
          </Text>
        </View>

        {/* Open Hours */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 font-semibold">Open Hours</Text>
            <Text className="text-xs text-gray-500">Leave Unset if closed</Text>
          </View>

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

        {/* Business Category */}
        <View className="mb-6">
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

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || uploading}
          activeOpacity={0.8}
          className="mb-8"
        >
          <LinearGradient
            colors={[COLORS.secondary, COLORS.secondaryDark]}
            className="rounded-xl py-4 items-center"
          >
            {(loading || uploading) ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#FFF" size="small" />
                <Text className="text-white font-bold text-lg ml-3">
                  {uploading ? 'Uploading Images...' : 'Creating Business...'}
                </Text>
              </View>
            ) : (
              <Text className="text-white font-bold text-lg">Create Business</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* Location Picker Modal */}
      <SimpleLocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={(selectedLocation) => {
          setLocation({
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            address: selectedLocation.address,
            loading: false,
            error: null
          });
          setFormData({ ...formData, address: selectedLocation.address });
          setAddressSearchQuery(selectedLocation.address);
          console.log('✅ Manual location selected:', selectedLocation.latitude, selectedLocation.longitude);
        }}
        initialLocation={location}
      />
    </View>
  );
}