import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/Ionicons';
import COLORS from '../config/colors';

const { width, height } = Dimensions.get('window');
const UK_DEFAULT_COORDS = { latitude: 54.5, longitude: -3.3 };

export default function AdvancedLocationPicker({ 
  visible, 
  onClose, 
  onSelectLocation, 
  initialLocation,
  googleApiKey 
}) {
  const [mode, setMode] = useState('map'); // Default to 'map' mode - 'autocomplete', 'map', 'manual'
  const [loading, setLoading] = useState(false);
  
  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  
  // Map state
  const [mapRegion, setMapRegion] = useState({
    latitude: initialLocation?.latitude ?? UK_DEFAULT_COORDS.latitude,
    longitude: initialLocation?.longitude ?? UK_DEFAULT_COORDS.longitude,
    latitudeDelta: initialLocation?.latitude ? 0.01 : 0.2,
    longitudeDelta: initialLocation?.longitude ? 0.01 : 0.2
  });
  const [markerPosition, setMarkerPosition] = useState({
    latitude: initialLocation?.latitude ?? UK_DEFAULT_COORDS.latitude,
    longitude: initialLocation?.longitude ?? UK_DEFAULT_COORDS.longitude
  });
  const [mapAddress, setMapAddress] = useState(initialLocation?.address || '');
  const mapRef = useRef(null);
  
  // Manual entry state
  const [manualAddress, setManualAddress] = useState({
    buildingNumber: '',
    street: '',
    city: initialLocation?.city || 'London',
    county: initialLocation?.county || 'England',
    postcode: '',
    landmark: ''
  });
  
  // Selected location state
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: initialLocation?.latitude || null,
    longitude: initialLocation?.longitude || null,
    address: initialLocation?.address || ''
  });

  // Autocomplete search with Google Places API
  const searchAddress = async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      setSearchingAddress(true);

      if (!googleApiKey) {
        Alert.alert('Error', 'Google API key is not configured');
        return;
      }

      // Google Places Autocomplete
      const autocompleteResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:gb&types=establishment|geocode&key=${googleApiKey}`
      );

      const autocompleteData = await autocompleteResponse.json();

      if (autocompleteData.status === 'OK' && autocompleteData.predictions) {
        // Get detailed info for each prediction
        const detailedSuggestions = await Promise.all(
          autocompleteData.predictions.slice(0, 5).map(async (prediction) => {
            try {
              const placeDetailsResponse = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=formatted_address,geometry&key=${googleApiKey}`
              );

              const placeDetailsData = await placeDetailsResponse.json();

              if (placeDetailsData.status === 'OK' && placeDetailsData.result) {
                return {
                  id: prediction.place_id,
                  address: placeDetailsData.result.formatted_address,
                  latitude: placeDetailsData.result.geometry.location.lat,
                  longitude: placeDetailsData.result.geometry.location.lng
                };
              }
              return null;
            } catch (error) {
              console.error('Error fetching place details:', error);
              return null;
            }
          })
        );

        const validSuggestions = detailedSuggestions.filter(s => s !== null);
        setSuggestions(validSuggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Address search error:', error);
      Alert.alert('Error', 'Failed to search addresses. Please try again.');
    } finally {
      setSearchingAddress(false);
    }
  };

  // Debounced autocomplete search
  useEffect(() => {
    if (mode === 'autocomplete') {
      const delayDebounce = setTimeout(() => {
        searchAddress(searchQuery);
      }, 500);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery, mode]);

  // Select from autocomplete
  const selectFromAutocomplete = (suggestion) => {
    setSelectedLocation({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      address: suggestion.address
    });
    setSuggestions([]);
    setSearchQuery('');
  };

  // Get current location for map
  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      };

      setMapRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      setMarkerPosition(coords);

      // Get address for current location
      const addressResults = await Location.reverseGeocodeAsync(coords);
      const addr = addressResults[0];
      const fullAddress = addr
        ? `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}, ${addr.postalCode || ''}, ${addr.country || ''}`
        : 'Current Location';

      setMapAddress(fullAddress.trim());
      setSelectedLocation({ ...coords, address: fullAddress.trim() });

      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 1000);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  // Handle map drag
  const handleMapDrag = async (e) => {
    const coords = e.nativeEvent.coordinate;
    setMarkerPosition(coords);

    try {
      const addressResults = await Location.reverseGeocodeAsync(coords);
      const addr = addressResults[0];
      const fullAddress = addr
        ? `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}, ${addr.postalCode || ''}, ${addr.country || ''}`
        : `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;

      setMapAddress(fullAddress.trim());
      setSelectedLocation({ ...coords, address: fullAddress.trim() });
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setMapAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
    }
  };

  // Confirm map location
  const confirmMapLocation = () => {
    setSelectedLocation({
      latitude: markerPosition.latitude,
      longitude: markerPosition.longitude,
      address: mapAddress
    });
  };

  // Geocode manual address
  const geocodeManualAddress = async () => {
    if (!manualAddress.street || !manualAddress.city || !manualAddress.postcode) {
      Alert.alert('Incomplete Address', 'Street, town/city, and postcode are required');
      return;
    }

    const fullAddress = `${manualAddress.buildingNumber ? manualAddress.buildingNumber + ' ' : ''}${manualAddress.street}, ${manualAddress.city}, ${manualAddress.county ? manualAddress.county + ', ' : ''}${manualAddress.postcode}, United Kingdom`;

    try {
      setLoading(true);

      // Use Google Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleApiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        setSelectedLocation({
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          address: result.formatted_address
        });
        Alert.alert('Success', 'Address geocoded successfully!');
      } else {
        Alert.alert('Not Found', 'Could not find coordinates for this address. Please check and try again.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Error', 'Failed to geocode address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm and close
  const confirmSelection = () => {
    if (!selectedLocation.latitude || !selectedLocation.longitude) {
      Alert.alert('Error', 'Please select a location first');
      return;
    }

    onSelectLocation(selectedLocation);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Business Location</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Mode Switcher */}
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'autocomplete' && styles.modeButtonActive]}
            onPress={() => setMode('autocomplete')}
          >
            <Icon name="search" size={20} color={mode === 'autocomplete' ? '#fff' : COLORS.primary} />
            <Text style={[styles.modeButtonText, mode === 'autocomplete' && styles.modeButtonTextActive]}>
              Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, mode === 'map' && styles.modeButtonActive]}
            onPress={() => setMode('map')}
          >
            <Icon name="map" size={20} color={mode === 'map' ? '#fff' : COLORS.primary} />
            <Text style={[styles.modeButtonText, mode === 'map' && styles.modeButtonTextActive]}>
              Map
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}
            onPress={() => setMode('manual')}
          >
            <Icon name="create" size={20} color={mode === 'manual' ? '#fff' : COLORS.primary} />
            <Text style={[styles.modeButtonText, mode === 'manual' && styles.modeButtonTextActive]}>
              Manual
            </Text>
          </TouchableOpacity>
        </View>

        {/* Autocomplete Mode */}
        {mode === 'autocomplete' && (
          <ScrollView style={styles.content}>
            <Text style={styles.modeDescription}>
              Search for your business by name or address
            </Text>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="e.g., Pret A Manger London, 10 Downing Street..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="words"
              />
              {searchingAddress && <ActivityIndicator size="small" color={COLORS.primary} />}
            </View>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={styles.suggestionItem}
                    onPress={() => selectFromAutocomplete(suggestion)}
                  >
                    <Icon name="location-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.suggestionText}>{suggestion.address}</Text>
                    <Icon name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Selected Location Display */}
            {selectedLocation.latitude && (
              <View style={styles.selectedContainer}>
                <Text style={styles.selectedTitle}>✅ Selected Location:</Text>
                <View style={styles.selectedCard}>
                  <Text style={styles.selectedAddress}>{selectedLocation.address}</Text>
                  <Text style={styles.selectedCoords}>
                    📍 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Map Mode */}
        {mode === 'map' && (
          <View style={styles.mapContainer}>
            {/* Instructions at top */}
            <View style={styles.mapInstructionsTop}>
              <View style={styles.instructionRow}>
                <Icon name="hand-right" size={20} color={COLORS.primary} />
                <Text style={styles.instructionTopText}>
                  Drag the 📍 marker to your business location
                </Text>
              </View>
            </View>

            <MapView
              ref={mapRef}
              style={styles.map}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
            >
              <Marker
                coordinate={markerPosition}
                draggable
                onDragEnd={handleMapDrag}
                title="📍 Drag Me!"
                description={mapAddress || "Drag to your business location"}
              >
                <View style={styles.customMarker}>
                  <Icon name="location-sharp" size={40} color="#EF4444" />
                </View>
              </Marker>
            </MapView>

            {/* My Location Button */}
            <TouchableOpacity
              style={styles.myLocationButton}
              onPress={getCurrentLocation}
              disabled={loading}
            >
              <Icon name="locate" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* Address Display Card at Bottom */}
            {mapAddress && (
              <View style={styles.mapAddressCardBottom}>
                <View style={styles.addressContentWrapper}>
                  <Icon name="location" size={20} color={COLORS.primary} />
                  <View style={styles.addressTextWrapper}>
                    <Text style={styles.addressLabel}>Selected Location:</Text>
                    <Text style={styles.mapAddressText}>{mapAddress}</Text>
                  </View>
                </View>
                {/* BIG CONFIRM BUTTON */}
                <TouchableOpacity
                  style={styles.confirmMapButton}
                  onPress={confirmMapLocation}
                  activeOpacity={0.8}
                >
                  <Icon name="checkmark-circle" size={28} color="#FFF" />
                  <Text style={styles.confirmMapButtonText}>✓ Select This Location</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Manual Entry Mode */}
        {mode === 'manual' && (
          <ScrollView style={styles.content}>
            <Text style={styles.modeDescription}>
              Enter your complete business address manually
            </Text>

            <View style={styles.manualForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Building No. (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 221B"
                  value={manualAddress.buildingNumber}
                  onChangeText={(text) => setManualAddress({ ...manualAddress, buildingNumber: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Street *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Baker Street"
                  value={manualAddress.street}
                  onChangeText={(text) => setManualAddress({ ...manualAddress, street: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Town/City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., London, Manchester"
                  value={manualAddress.city}
                  onChangeText={(text) => setManualAddress({ ...manualAddress, city: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>County (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Greater London"
                  value={manualAddress.county}
                  onChangeText={(text) => setManualAddress({ ...manualAddress, county: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Postcode *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="SW1A 1AA"
                  value={manualAddress.postcode}
                  onChangeText={(text) => setManualAddress({ ...manualAddress, postcode: text.toUpperCase() })}
                  autoCapitalize="characters"
                  maxLength={8}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Landmark (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Near Tesco, Opposite Tube Station"
                  value={manualAddress.landmark}
                  onChangeText={(text) => setManualAddress({ ...manualAddress, landmark: text })}
                />
              </View>

              <TouchableOpacity
                style={styles.geocodeButton}
                onPress={geocodeManualAddress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="navigate" size={20} color="#fff" />
                    <Text style={styles.geocodeButtonText}>Get Coordinates</Text>
                  </>
                )}
              </TouchableOpacity>

              {selectedLocation.latitude && (
                <View style={styles.selectedContainer}>
                  <Text style={styles.selectedTitle}>✅ Coordinates Found:</Text>
                  <View style={styles.selectedCard}>
                    <Text style={styles.selectedAddress}>{selectedLocation.address}</Text>
                    <Text style={styles.selectedCoords}>
                      📍 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedLocation.latitude || !selectedLocation.longitude) && styles.confirmButtonDisabled
            ]}
            onPress={confirmSelection}
            disabled={!selectedLocation.latitude || !selectedLocation.longitude}
          >
            <Text style={styles.confirmButtonText}>
              {selectedLocation.latitude ? '✅ Confirm Location' : 'Select a location first'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  closeButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  modeSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary
  },
  modeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary
  },
  modeButtonTextActive: {
    color: '#fff'
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20
  },
  content: {
    flex: 1,
    padding: 16
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333'
  },
  suggestionsContainer: {
    marginBottom: 16
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333'
  },
  selectedContainer: {
    marginTop: 16
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8
  },
  selectedCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10B981'
  },
  selectedAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8
  },
  selectedCoords: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600'
  },
  mapContainer: {
    flex: 1
  },
  map: {
    flex: 1
  },
  mapControls: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'column'
  },
  mapButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  mapButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  mapAddressCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  mapAddressText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18
  },
  mapInstructionsTop: {
    backgroundColor: '#EBF5FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE'
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  instructionTopText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  myLocationButton: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: COLORS.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6
  },
  mapAddressCardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8
  },
  addressContentWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  addressTextWrapper: {
    flex: 1,
    marginLeft: 10
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4
  },
  confirmMapButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  },
  confirmMapButtonText: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  },
  manualForm: {
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 16
  },
  inputRow: {
    flexDirection: 'row'
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333'
  },
  geocodeButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8
  },
  geocodeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB'
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

