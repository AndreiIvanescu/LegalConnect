import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWebSocket, WebSocketEventTypes, WebSocketMessage } from '../services/WebSocketService';

// Provider detail types
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

interface Review {
  id: number;
  reviewerId: number;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: string;
}

interface Provider {
  id: number;
  userId: number;
  name: string;
  type: string;
  rating: number;
  reviewCount: number;
  location: string;
  education: string;
  yearsOfExperience: number;
  description: string;
  languages: string[];
  specializations: string[];
  services: Service[];
  isTopRated: boolean;
  is24_7: boolean;
  latitude: number;
  longitude: number;
  serviceRadius: number;
  imageUrl: string;
}

// Chat message type
interface ChatMessage {
  id?: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  isMine: boolean;
}

// Component props
interface ProviderDetailScreenProps {
  route: { params: { providerId: number } };
  navigation: any;
}

// Format currency helper (RON - Romanian Leu)
const formatCurrency = (amount: number) => {
  return `${(amount / 100).toFixed(2)} RON`;
};

// Mock user ID - in a real app this would come from authentication
const currentUserId = 2; // Assuming the logged-in user has ID 2

const ProviderDetailScreen: React.FC<ProviderDetailScreenProps> = ({ route, navigation }) => {
  const { providerId } = route.params;
  
  // State
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Set up WebSocket
  const wsProtocol = Platform.OS === 'web' 
    ? (window.location.protocol === 'https:' ? 'wss:' : 'ws:') 
    : 'ws:';
  const wsHost = Platform.OS === 'web' 
    ? window.location.host 
    : 'localhost:5000';
  
  const wsUrl = `${wsProtocol}//${wsHost}/ws?userId=${currentUserId}`;
  
  const { isConnected, lastMessage, sendMessage } = useWebSocket(wsUrl);
  
  // Load provider data
  useEffect(() => {
    fetchProviderDetails();
    fetchChatHistory();
  }, []);
  
  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === WebSocketEventTypes.MESSAGE_RECEIVED) {
      const { senderId, content, timestamp, messageId } = lastMessage.data;
      
      // Only add to chat if it's from this provider
      if (provider && senderId === provider.userId) {
        setChatMessages(prev => [
          ...prev,
          {
            id: messageId,
            senderId,
            receiverId: currentUserId,
            content,
            timestamp,
            isMine: false
          }
        ]);
      }
    }
  }, [lastMessage, provider]);
  
  // Fetch provider details from API
  const fetchProviderDetails = async () => {
    try {
      // In a real app, this would fetch from your API
      const response = await fetch(`http://localhost:5000/api/providers/${providerId}`);
      const data = await response.json();
      
      if (response.ok) {
        setProvider(data);
      } else {
        Alert.alert('Error', 'Failed to load provider details');
      }
    } catch (error) {
      console.error('Error fetching provider details:', error);
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch chat history
  const fetchChatHistory = async () => {
    try {
      // In a real app, replace with your actual API endpoint
      const response = await fetch(`http://localhost:5000/api/messages/history/${providerId}`);
      
      if (response.ok) {
        const messages = await response.json();
        setChatMessages(messages.map((msg: any) => ({
          ...msg,
          isMine: msg.senderId === currentUserId
        })));
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };
  
  // Send a new message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !provider) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    // Add message to local state immediately for responsive UI
    const newChatMessage: ChatMessage = {
      senderId: currentUserId,
      receiverId: provider.userId,
      content: messageContent,
      timestamp: new Date().toISOString(),
      isMine: true
    };
    
    setChatMessages(prev => [...prev, newChatMessage]);
    
    // Send via WebSocket
    if (isConnected) {
      sendMessage({
        type: 'chat_message',
        data: {
          text: messageContent,
          recipientId: provider.userId
        }
      });
    } else {
      // Fallback to API if WebSocket isn't connected
      fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: provider.userId,
          content: messageContent
        })
      }).catch(err => {
        console.error('Error sending message via API:', err);
        Alert.alert('Error', 'Failed to send message');
      });
    }
  };
  
  // Book a service
  const handleBookService = (serviceId: number) => {
    navigation.navigate('BookingScreen', {
      providerId,
      serviceId
    });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }
  
  if (!provider) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Provider not found</Text>
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
      {showChat ? (
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.chatHeaderTitle}>Chat with {provider.name}</Text>
            <View style={[styles.connectionStatus, isConnected ? styles.connected : styles.disconnected]} />
          </View>
          
          <ScrollView style={styles.messagesContainer}>
            {chatMessages.map((message, index) => (
              <View 
                key={index} 
                style={[
                  styles.messageBubble, 
                  message.isMine ? styles.myMessage : styles.theirMessage
                ]}
              >
                <Text style={styles.messageText}>{message.content}</Text>
                <Text style={styles.timestampText}>
                  {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              multiline
            />
            <TouchableOpacity 
              style={styles.sendButton} 
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {/* Provider profile */}
          <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
              <Image 
                source={{ uri: provider.imageUrl.startsWith('http') ? provider.imageUrl : 'https://via.placeholder.com/150' }} 
                style={styles.providerImage} 
              />
              <View style={styles.headerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerType}>{provider.type}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{provider.rating.toFixed(1)} ({provider.reviewCount})</Text>
                </View>
                <Text style={styles.location}>{provider.location}</Text>
                
                <View style={styles.badgeContainer}>
                  {provider.isTopRated && (
                    <View style={styles.badge}>
                      <Ionicons name="trophy" size={12} color="#FFD700" />
                      <Text style={styles.badgeText}>Top Rated</Text>
                    </View>
                  )}
                  
                  {provider.is24_7 && (
                    <View style={styles.badge}>
                      <Ionicons name="time" size={12} color="#0066cc" />
                      <Text style={styles.badgeText}>24/7 Available</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'services' && styles.activeTab]} 
                onPress={() => setActiveTab('services')}
              >
                <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>Services</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'about' && styles.activeTab]}
                onPress={() => setActiveTab('about')}
              >
                <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>About</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
                onPress={() => setActiveTab('reviews')}
              >
                <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Reviews</Text>
              </TouchableOpacity>
            </View>
            
            {activeTab === 'services' && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Services Offered</Text>
                
                {provider.services && provider.services.length > 0 ? (
                  provider.services.map(service => (
                    <View key={service.id} style={styles.serviceCard}>
                      <View style={styles.serviceHeader}>
                        <Text style={styles.serviceTitle}>{service.title}</Text>
                        <Text style={styles.servicePrice}>{service.formattedPrice}</Text>
                      </View>
                      
                      {service.description && (
                        <Text style={styles.serviceDescription}>{service.description}</Text>
                      )}
                      
                      <TouchableOpacity 
                        style={styles.bookButton}
                        onPress={() => handleBookService(service.id)}
                      >
                        <Text style={styles.bookButtonText}>Book Now</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No services available</Text>
                )}
              </View>
            )}
            
            {activeTab === 'about' && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>About {provider.name}</Text>
                
                {provider.description && (
                  <Text style={styles.description}>{provider.description}</Text>
                )}
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Education:</Text>
                  <Text style={styles.infoValue}>{provider.education || 'Not specified'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Experience:</Text>
                  <Text style={styles.infoValue}>{provider.yearsOfExperience || 0} years</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Languages:</Text>
                  <Text style={styles.infoValue}>
                    {provider.languages && provider.languages.length > 0 
                      ? provider.languages.join(', ') 
                      : 'Not specified'}
                  </Text>
                </View>
                
                <Text style={styles.sectionSubtitle}>Specializations</Text>
                <View style={styles.specializationsContainer}>
                  {provider.specializations && provider.specializations.length > 0 ? (
                    provider.specializations.map((spec, index) => (
                      <View key={index} style={styles.specializationBadge}>
                        <Text style={styles.specializationText}>{spec}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No specializations listed</Text>
                  )}
                </View>
                
                <Text style={styles.sectionSubtitle}>Service Area</Text>
                <Text style={styles.serviceArea}>
                  {provider.location} (within {(provider.serviceRadius / 1000).toFixed(1)} km)
                </Text>
              </View>
            )}
            
            {activeTab === 'reviews' && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Client Reviews</Text>
                
                {provider.reviewCount > 0 ? (
                  <View>
                    <View style={styles.reviewSummary}>
                      <Text style={styles.reviewAverage}>{provider.rating.toFixed(1)}</Text>
                      <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Ionicons 
                            key={star}
                            name="star" 
                            size={18} 
                            color={star <= Math.round(provider.rating) ? "#FFD700" : "#e0e0e0"} 
                          />
                        ))}
                      </View>
                      <Text style={styles.reviewCount}>Based on {provider.reviewCount} reviews</Text>
                    </View>
                    
                    {/* In a real app, fetch and render actual reviews here */}
                    <Text style={styles.emptyText}>Review details not available in this view</Text>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No reviews yet</Text>
                )}
              </View>
            )}
          </ScrollView>
          
          <View style={styles.actionBar}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowChat(true)}
            >
              <Ionicons name="chatbubble" size={20} color="#0066cc" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={() => {
                if (provider.services && provider.services.length > 0) {
                  handleBookService(provider.services[0].id);
                } else {
                  Alert.alert('No Services', 'This provider has no services available for booking');
                }
              }}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.primaryActionButtonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  providerImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  providerName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  providerType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0066cc',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  serviceArea: {
    fontSize: 14,
    color: '#333',
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specializationBadge: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  specializationText: {
    fontSize: 12,
    color: '#0066cc',
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  bookButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  reviewSummary: {
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewAverage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  actionBar: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#0066cc',
    borderRadius: 8,
    marginRight: 8,
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#0066cc',
    fontWeight: 'bold',
  },
  primaryActionButton: {
    flex: 2,
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  primaryActionButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chatHeaderTitle: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectionStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connected: {
    backgroundColor: '#4cd964',
  },
  disconnected: {
    backgroundColor: '#ff3b30',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0066cc',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProviderDetailScreen;