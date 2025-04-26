import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Common Romanian locations
const COMMON_LOCATIONS = [
  { name: 'Bucharest', latitude: 44.4268, longitude: 26.1025 },
  { name: 'Cluj-Napoca', latitude: 46.7712, longitude: 23.6236 },
  { name: 'Timișoara', latitude: 45.7489, longitude: 21.2087 },
  { name: 'Iași', latitude: 47.1585, longitude: 27.6014 },
  { name: 'Constanța', latitude: 44.1598, longitude: 28.6348 },
  { name: 'Brașov', latitude: 45.6427, longitude: 25.5887 },
  { name: 'Craiova', latitude: 44.3302, longitude: 23.7949 },
  { name: 'Galați', latitude: 45.4353, longitude: 28.0080 },
  { name: 'Oradea', latitude: 47.0465, longitude: 21.9189 },
  { name: 'Sibiu', latitude: 45.7983, longitude: 24.1469 }
];

interface LocationItem {
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface LocationSearchScreenProps {
  navigation: any;
  route: {
    params?: {
      onSelectLocation?: (location: LocationItem) => void;
    }
  };
}

const LocationSearchScreen: React.FC<LocationSearchScreenProps> = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<LocationItem[]>(COMMON_LOCATIONS);
  const [filteredLocations, setFilteredLocations] = useState<LocationItem[]>(COMMON_LOCATIONS);
  const [userLocation, setUserLocation] = useState<LocationItem | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);
  
  // Filter locations based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLocations(locations);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = locations.filter(location => 
        location.name.toLowerCase().includes(query)
      );
      setFilteredLocations(filtered);
    }
  }, [searchQuery, locations]);
  
  // Get user's current location
  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Permission to access location was denied. You can still search for locations manually.'
        );
        setLoadingLocation(false);
        return;
      }
      
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      const { latitude, longitude } = position.coords;
      
      // Try to get location name using reverse geocoding
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      let locationName = 'Current Location';
      if (geocode.length > 0) {
        const address = geocode[0];
        locationName = address.city || address.subregion || address.region || locationName;
      }
      
      const currentLocation = {
        name: locationName,
        latitude,
        longitude
      };
      
      setUserLocation(currentLocation);
      
      // Calculate distances for all locations
      const locationsWithDistance = COMMON_LOCATIONS.map(loc => ({
        ...loc,
        distance: calculateDistance(latitude, longitude, loc.latitude, loc.longitude)
      }));
      
      // Sort by distance
      locationsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setLocations(locationsWithDistance);
      setFilteredLocations(locationsWithDistance);
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Could not get your current location. You can still search for locations manually.'
      );
    } finally {
      setLoadingLocation(false);
    }
  };
  
  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return Math.round(R * c); // Distance in meters
  };
  
  // Handle location selection
  const handleSelectLocation = (location: LocationItem) => {
    if (route.params?.onSelectLocation) {
      route.params.onSelectLocation(location);
    }
    navigation.goBack();
  };
  
  // Format distance for display
  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${distance}m away`;
    } else {
      return `${(distance / 1000).toFixed(1)}km away`;
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={Platform.OS !== 'web'}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {loadingLocation ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      ) : (
        <>
          {userLocation && (
            <TouchableOpacity 
              style={styles.currentLocationItem}
              onPress={() => handleSelectLocation(userLocation)}
            >
              <View style={styles.locationIconContainer}>
                <Ionicons name="locate" size={20} color="#fff" />
              </View>
              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>Current Location</Text>
                <Text style={styles.locationAddress}>{userLocation.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
          
          {!userLocation && !loadingLocation && (
            <TouchableOpacity 
              style={styles.useLocationButton}
              onPress={getCurrentLocation}
            >
              <Ionicons name="locate" size={20} color="#0066cc" />
              <Text style={styles.useLocationText}>Use my current location</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.sectionHeader}>
            {userLocation ? 'Nearby Locations' : 'Popular Locations'}
          </Text>
          
          <FlatList
            data={filteredLocations}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.locationItem}
                onPress={() => handleSelectLocation(item)}
              >
                <View style={styles.locationIconContainer}>
                  <Ionicons name="location-sharp" size={20} color="#fff" />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationName}>{item.name}</Text>
                  {item.distance && (
                    <Text style={styles.locationAddress}>{formatDistance(item.distance)}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No locations found</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  currentLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  useLocationText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '500',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    backgroundColor: '#f5f5f5',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default LocationSearchScreen;