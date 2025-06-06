import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  StatusBar, 
  FlatList, 
  TouchableOpacity,
  Image,
  ActivityIndicator 
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Types for our app
interface Provider {
  id: number;
  name: string;
  type: string;
  rating: number;
  reviewCount: number;
  location: string;
  education: string;
  specializations: string[];
  startingPrice: string;
  isTopRated?: boolean;
  isAvailable24_7?: boolean;
  imageUrl: string;
  latitude: number;
  longitude: number;
  serviceRadius: number;
  distance?: number;
}

// Import screens
import ProviderDetailScreen from './src/screens/ProviderDetailScreen';
import LocationSearchScreen from './src/screens/LocationSearchScreen';
import BookingScreen from './src/screens/BookingScreen';
import MessagesScreen from './src/screens/MessagesScreen';

// HomeScreen component
const HomeScreen = ({ navigation }: { navigation: any }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, fetch data from backend API
    fetchProviders();
  }, []);
  
  const fetchProviders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/providers');
      const data = await response.json();
      setProviders(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setLoading(false);
    }
  };
  
  const renderProviderItem = ({ item }: { item: Provider }) => (
    <TouchableOpacity 
      style={styles.providerCard}
      onPress={() => navigation.navigate('ProviderDetail', { providerId: item.id })}
    >
      <View style={styles.providerHeader}>
        <Image 
          source={{ uri: item.imageUrl?.startsWith('http') ? item.imageUrl : 'https://via.placeholder.com/100' }} 
          style={styles.providerImage} 
        />
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{item.name}</Text>
          <Text style={styles.providerType}>{item.type}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)} ({item.reviewCount})</Text>
          </View>
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      </View>
      <View style={styles.specializationsContainer}>
        {item.specializations?.slice(0, 3).map((spec, index) => (
          <View key={index} style={styles.specializationBadge}>
            <Text style={styles.specializationText}>{spec}</Text>
          </View>
        ))}
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>Starting from {item.startingPrice}</Text>
        {item.distance && (
          <Text style={styles.distance}>{item.distance < 1000 
            ? `${item.distance}m away` 
            : `${(item.distance / 1000).toFixed(1)}km away`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" />
      ) : (
        <FlatList
          data={providers}
          renderItem={renderProviderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.providerList}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Find Legal Services Near You</Text>
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => navigation.navigate('LocationSearch')}
              >
                <Text style={styles.searchButtonText}>Search by location</Text>
                <Ionicons name="search" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

// Search Screen
const SearchScreen = ({ navigation }: { navigation: any }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.placeholderText}>Advanced Search</Text>
    <TouchableOpacity 
      style={styles.placeholderButton}
      onPress={() => navigation.navigate('LocationSearch')}
    >
      <Text style={styles.placeholderButtonText}>Search by Location</Text>
    </TouchableOpacity>
  </View>
);

// Bookings Screen
const BookingsScreen = ({ navigation }: { navigation: any }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.placeholderText}>Your Bookings</Text>
    <Text style={styles.placeholderSubtext}>You don't have any bookings yet</Text>
    <TouchableOpacity 
      style={styles.placeholderButton}
      onPress={() => navigation.navigate('Home')}
    >
      <Text style={styles.placeholderButtonText}>Find a Provider</Text>
    </TouchableOpacity>
  </View>
);

// Profile Screen
const ProfileScreen = () => (
  <View style={styles.centerContainer}>
    <Text style={styles.placeholderText}>Your Profile</Text>
    <Text style={styles.placeholderSubtext}>Profile settings and account management</Text>
    <View style={styles.profilePlaceholder}>
      <Ionicons name="person-circle-outline" size={80} color="#0066cc" />
      <Text style={styles.placeholderName}>John Doe</Text>
      <Text style={styles.placeholderEmail}>john.doe@example.com</Text>
    </View>
  </View>
);

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home stack navigator
const HomeStack = createStackNavigator();
const HomeStackScreen = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
    <HomeStack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
    <HomeStack.Screen name="LocationSearch" component={LocationSearchScreen} />
    <HomeStack.Screen name="Booking" component={BookingScreen} />
  </HomeStack.Navigator>
);

// Search stack navigator
const SearchStack = createStackNavigator();
const SearchStackScreen = () => (
  <SearchStack.Navigator screenOptions={{ headerShown: false }}>
    <SearchStack.Screen name="SearchScreen" component={SearchScreen} />
    <SearchStack.Screen name="LocationSearch" component={LocationSearchScreen} />
    <SearchStack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
  </SearchStack.Navigator>
);

// Bookings stack navigator
const BookingsStack = createStackNavigator();
const BookingsStackScreen = () => (
  <BookingsStack.Navigator screenOptions={{ headerShown: false }}>
    <BookingsStack.Screen name="BookingsScreen" component={BookingsScreen} />
    <BookingsStack.Screen name="Booking" component={BookingScreen} />
  </BookingsStack.Navigator>
);

// Messages stack navigator
const MessagesStack = createStackNavigator();
const MessagesStackScreen = () => (
  <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
    <MessagesStack.Screen name="MessagesScreen" component={MessagesScreen} />
  </MessagesStack.Navigator>
);

// Profile stack navigator
const ProfileStack = createStackNavigator();
const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

// Main App component
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false, // Hide all tab screen headers
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Bookings') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Messages') {
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#0066cc',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Home" component={HomeStackScreen} />
        <Tab.Screen name="Search" component={SearchStackScreen} />
        <Tab.Screen name="Bookings" component={BookingsStackScreen} />
        <Tab.Screen name="Messages" component={MessagesStackScreen} />
        <Tab.Screen name="Profile" component={ProfileStackScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  providerList: {
    padding: 8,
  },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  providerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  providerImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  providerType: {
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 4,
    color: '#666',
  },
  locationText: {
    color: '#666',
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specializationBadge: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
  },
  specializationText: {
    color: '#0066cc',
    fontSize: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontWeight: 'bold',
  },
  distance: {
    color: '#666',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  placeholderButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  placeholderButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profilePlaceholder: {
    alignItems: 'center',
    marginTop: 32,
  },
  placeholderName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  placeholderEmail: {
    color: '#666',
    fontSize: 16,
  },
});