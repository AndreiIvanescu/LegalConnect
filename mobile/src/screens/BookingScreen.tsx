import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Types
interface Service {
  id: number;
  title: string;
  description: string;
  priceType: string;
  price?: number;
  percentageRate?: number;
  minPrice?: number;
  formattedPrice: string;
}

interface Provider {
  id: number;
  userId: number;
  name: string;
  type: string;
  imageUrl: string;
}

// Mock user data - in a real app, this would come from authentication
const currentUserId = 2;

// Screen props
interface BookingScreenProps {
  route: { 
    params: { 
      providerId: number;
      serviceId: number;
    } 
  };
  navigation: any;
}

// Available time slots for booking
const generateTimeSlots = (date: Date, interval: number = 30): string[] => {
  const slots: string[] = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM
  
  // Clone the date to avoid modifying the original
  const slotDate = new Date(date);
  
  // Set hours to start time
  slotDate.setHours(startHour, 0, 0, 0);
  
  // Generate slots
  while (slotDate.getHours() < endHour) {
    slots.push(
      slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    
    // Add interval minutes for next slot
    slotDate.setMinutes(slotDate.getMinutes() + interval);
  }
  
  return slots;
};

const BookingScreen: React.FC<BookingScreenProps> = ({ route, navigation }) => {
  const { providerId, serviceId } = route.params;
  
  // State
  const [provider, setProvider] = useState<Provider | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Generate next 7 days for date picker
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });
  
  // Generate time slots
  const timeSlots = generateTimeSlots(selectedDate);
  
  // Load provider and service data
  useEffect(() => {
    fetchProviderAndService();
  }, []);
  
  const fetchProviderAndService = async () => {
    try {
      // In a real app, these would be separate API calls
      const providerResponse = await fetch(`http://localhost:5000/api/providers/${providerId}`);
      const providerData = await providerResponse.json();
      
      const servicesResponse = await fetch(`http://localhost:5000/api/providers/${providerId}/services`);
      const services = await servicesResponse.json();
      
      if (providerResponse.ok && servicesResponse.ok) {
        setProvider(providerData);
        
        // Find the selected service
        const foundService = services.find((s: Service) => s.id === serviceId);
        
        if (foundService) {
          setService(foundService);
        } else {
          Alert.alert('Error', 'Service not found');
        }
      } else {
        Alert.alert('Error', 'Failed to load provider details');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };
  
  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedTime || !provider || !service) {
      Alert.alert('Missing Information', 'Please select a time for your booking');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Combine date and time
      const bookingDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);
      
      // Calculate end time (default: 1 hour later)
      const endDateTime = new Date(bookingDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1);
      
      // Prepare booking data
      const bookingData = {
        providerId: provider.id,
        clientId: currentUserId,
        serviceId: service.id,
        startTime: bookingDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        totalAmount: service.price || service.minPrice || 0,
        notes: notes.trim() || undefined,
        status: 'pending'
      };
      
      // In a real app, this would be an API call
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });
      
      if (response.ok) {
        const booking = await response.json();
        Alert.alert(
          'Booking Successful',
          `Your appointment with ${provider.name} has been booked for ${formatDate(bookingDateTime)} at ${selectedTime}.`,
          [
            { 
              text: 'OK', 
              onPress: () => navigation.navigate('Bookings') 
            }
          ]
        );
      } else {
        const error = await response.json();
        Alert.alert('Booking Failed', error.message || 'Could not create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }
  
  if (!provider || !service) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Provider or service not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.providerCard}>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <Text style={styles.providerType}>{provider.type}</Text>
          </View>
        </View>
        
        <View style={styles.serviceCard}>
          <Text style={styles.sectionTitle}>Service</Text>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle}>{service.title}</Text>
            <Text style={styles.servicePrice}>{service.formattedPrice}</Text>
          </View>
          {service.description && (
            <Text style={styles.serviceDescription}>{service.description}</Text>
          )}
        </View>
        
        <View style={styles.datePickerContainer}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroller}>
            {dates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateItem,
                  selectedDate.toDateString() === date.toDateString() && styles.selectedDateItem
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dayOfWeek,
                  selectedDate.toDateString() === date.toDateString() && styles.selectedDateText
                ]}>
                  {date.toLocaleDateString(undefined, { weekday: 'short' })}
                </Text>
                <Text style={[
                  styles.dayOfMonth,
                  selectedDate.toDateString() === date.toDateString() && styles.selectedDateText
                ]}>
                  {date.getDate()}
                </Text>
                {isToday(date) && (
                  <View style={styles.todayIndicator}>
                    <Text style={styles.todayText}>Today</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.timePickerContainer}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeSlotGrid}>
            {timeSlots.map((time, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTimeSlot
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[
                  styles.timeSlotText,
                  selectedTime === time && styles.selectedTimeSlotText
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.notesContainer}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder="Add any specific details or requests..."
            value={notes}
            onChangeText={setNotes}
            maxLength={500}
          />
          <Text style={styles.charactersLeft}>
            {500 - notes.length} characters left
          </Text>
        </View>
        
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{service.title}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Provider:</Text>
            <Text style={styles.summaryValue}>{provider.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{selectedTime || 'Not selected'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price:</Text>
            <Text style={styles.summaryValue}>{service.formattedPrice}</Text>
          </View>
          
          <View style={styles.policyContainer}>
            <Text style={styles.policyText}>
              By proceeding with this booking, you agree to our Terms of Service and Cancellation Policy.
              Cancellations made less than 24 hours in advance may incur a fee.
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.bookButton,
            (!selectedTime || submitting) && styles.disabledButton
          ]}
          onPress={handleBooking}
          disabled={!selectedTime || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="calendar-sharp" size={20} color="#fff" />
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ff3b30',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  providerCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  providerType: {
    fontSize: 14,
    color: '#666',
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  dateScroller: {
    flexDirection: 'row',
  },
  dateItem: {
    width: 60,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    padding: 10,
  },
  selectedDateItem: {
    backgroundColor: '#0066cc',
  },
  dayOfWeek: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dayOfMonth: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDateText: {
    color: '#fff',
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: '#ff9500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlot: {
    width: '30%',
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: '1.66%',
  },
  selectedTimeSlot: {
    backgroundColor: '#0066cc',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeSlotText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notesContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  charactersLeft: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 80,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  policyContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  policyText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bookButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  disabledButton: {
    backgroundColor: '#c7c7cc',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default BookingScreen;