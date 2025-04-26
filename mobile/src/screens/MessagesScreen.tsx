import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWebSocket, WebSocketEventTypes } from '../services/WebSocketService';

// Types
interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  imageUrl: string;
  userId: number;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  read: boolean;
}

// Mock user data
const currentUserId = 2; // Assuming the logged-in user has ID 2

interface MessagesScreenProps {
  navigation: any;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation }) => {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Reference to scroll to bottom of messages
  const listRef = useRef<FlatList>(null);
  
  // Set up WebSocket
  const wsProtocol = Platform.OS === 'web' 
    ? (window.location.protocol === 'https:' ? 'wss:' : 'ws:') 
    : 'ws:';
  const wsHost = Platform.OS === 'web' 
    ? window.location.host 
    : 'localhost:5000';
  
  const wsUrl = `${wsProtocol}//${wsHost}/ws?userId=${currentUserId}`;
  
  const { isConnected, lastMessage, sendMessage } = useWebSocket(wsUrl);
  
  // Fetch data
  useEffect(() => {
    fetchConversations();
  }, []);
  
  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === WebSocketEventTypes.MESSAGE_RECEIVED) {
      const { senderId, content, timestamp, messageId } = lastMessage.data;
      
      // If it's a message for the active conversation, add it to messages
      if (activeConversation && senderId === activeConversation.userId) {
        const newMsg: Message = {
          id: messageId,
          senderId,
          receiverId: currentUserId,
          content,
          timestamp,
          read: false
        };
        
        setMessages(prev => [...prev, newMsg]);
        
        // Scroll to bottom
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
      
      // Update conversation list
      updateConversationWithNewMessage(senderId, content, timestamp);
    }
  }, [lastMessage, activeConversation]);
  
  // Fetch conversations
  const fetchConversations = async () => {
    try {
      // In a real app, fetch from your API
      const response = await fetch('http://localhost:5000/api/messages/conversations');
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch messages for a conversation
  const fetchMessages = async (otherUserId: number) => {
    setLoadingMessages(true);
    
    try {
      // In a real app, fetch from your API
      const response = await fetch(`http://localhost:5000/api/messages/history/${otherUserId}`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // Mark messages as read
        markMessagesAsRead(otherUserId);
        
        // Scroll to bottom
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };
  
  // Mark messages as read
  const markMessagesAsRead = async (senderId: number) => {
    try {
      // In a real app, this would be an API call
      await fetch('http://localhost:5000/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderId,
          receiverId: currentUserId
        })
      });
      
      // Update unread count in conversation list
      setConversations(prev => 
        prev.map(conv => 
          conv.userId === senderId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  // Update conversation list with new message
  const updateConversationWithNewMessage = (senderId: number, content: string, timestamp: string) => {
    setConversations(prev => {
      // Find if conversation exists
      const existingConvIndex = prev.findIndex(c => c.userId === senderId);
      
      if (existingConvIndex >= 0) {
        // Update existing conversation
        const updatedConvs = [...prev];
        const conv = updatedConvs[existingConvIndex];
        
        // Only increment unread if it's not the active conversation
        const unreadIncrement = activeConversation?.userId === senderId ? 0 : 1;
        
        updatedConvs[existingConvIndex] = {
          ...conv,
          lastMessage: content,
          timestamp,
          unreadCount: conv.unreadCount + unreadIncrement
        };
        
        // Move to top
        updatedConvs.splice(existingConvIndex, 1);
        updatedConvs.unshift(updatedConvs[existingConvIndex]);
        
        return updatedConvs;
      } else {
        // This would need to fetch the user info from API in a real app
        // For demo, we'll create a stub conversation
        return [{
          id: Date.now(),
          userId: senderId,
          name: `User ${senderId}`,
          lastMessage: content,
          timestamp,
          unreadCount: 1,
          imageUrl: 'https://via.placeholder.com/50'
        }, ...prev];
      }
    });
  };
  
  // Open a conversation
  const openConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.userId);
  };
  
  // Go back to conversation list
  const goBackToList = () => {
    setActiveConversation(null);
    setMessages([]);
  };
  
  // Send a message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    const content = newMessage.trim();
    setNewMessage('');
    
    // Create message object
    const msgObj: Message = {
      id: Date.now(), // Temporary ID
      senderId: currentUserId,
      receiverId: activeConversation.userId,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Add to messages
    setMessages(prev => [...prev, msgObj]);
    
    // Scroll to bottom
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    // Update conversation
    updateConversationWithNewMessage(currentUserId, content, msgObj.timestamp);
    
    // Send via WebSocket
    if (isConnected) {
      sendMessage({
        type: 'chat_message',
        data: {
          text: content,
          recipientId: activeConversation.userId
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
          receiverId: activeConversation.userId,
          content
        })
      }).catch(err => {
        console.error('Error sending message via API:', err);
      });
    }
  };
  
  // Format date for display
  const formatMessageDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Render conversation item
  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => openConversation(item)}
    >
      <Image 
        source={{ uri: item.imageUrl.startsWith('http') ? item.imageUrl : 'https://via.placeholder.com/50' }} 
        style={styles.avatar} 
      />
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.name}</Text>
          <Text style={styles.timestamp}>{formatMessageDate(item.timestamp)}</Text>
        </View>
        
        <View style={styles.lastMessageContainer}>
          <Text 
            style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
  
  // Render message
  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === currentUserId;
    
    return (
      <View 
        style={[
          styles.messageContainer,
          isMine ? styles.myMessageContainer : styles.theirMessageContainer
        ]}
      >
        <View 
          style={[
            styles.messageBubble,
            isMine ? styles.myMessage : styles.theirMessage
          ]}
        >
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.messageTime}>
            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {activeConversation ? (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={goBackToList}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            
            <Image 
              source={{ uri: activeConversation.imageUrl.startsWith('http') ? activeConversation.imageUrl : 'https://via.placeholder.com/40' }}
              style={styles.chatHeaderAvatar}
            />
            
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderName}>{activeConversation.name}</Text>
              <View style={styles.onlineStatus}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>
          </View>
          
          {loadingMessages ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066cc" />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.messagesList}
              ListEmptyComponent={
                <View style={styles.emptyMessages}>
                  <Ionicons name="chatbubble-ellipses-outline" size={50} color="#ccc" />
                  <Text style={styles.emptyMessagesText}>No messages yet</Text>
                  <Text style={styles.emptyMessagesSubtext}>
                    Send a message to start a conversation
                  </Text>
                </View>
              }
            />
          )}
          
          <View style={styles.chatFooter}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.disabledSendButton
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.headerTitle}>Messages</Text>
            <View style={styles.connectionStatus}>
              {isConnected ? (
                <>
                  <View style={styles.connectedIndicator} />
                  <Text style={styles.connectedText}>Connected</Text>
                </>
              ) : (
                <>
                  <View style={styles.disconnectedIndicator} />
                  <Text style={styles.disconnectedText}>Offline</Text>
                </>
              )}
            </View>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066cc" />
            </View>
          ) : (
            <FlatList
              data={conversations}
              renderItem={renderConversationItem}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyTitle}>No Messages Yet</Text>
                  <Text style={styles.emptyText}>
                    Your conversations with service providers will appear here
                  </Text>
                </View>
              }
            />
          )}
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
  listHeader: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CD964',
    marginRight: 6,
  },
  connectedText: {
    fontSize: 12,
    color: '#4CD964',
  },
  disconnectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  disconnectedText: {
    fontSize: 12,
    color: '#FF3B30',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#333',
  },
  unreadBadge: {
    backgroundColor: '#0066cc',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CD964',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: '#666',
  },
  messagesList: {
    padding: 12,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: '#0066cc',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  chatFooter: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#ccc',
  },
});

export default MessagesScreen;