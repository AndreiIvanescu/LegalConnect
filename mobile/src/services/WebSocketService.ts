// WebSocketService.ts
import { useRef, useEffect, useState, useCallback } from 'react';

// Define event types for our WebSocket
export enum WebSocketEventTypes {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  MESSAGE = 'message',
  BOOKING_UPDATED = 'booking_updated',
  BOOKING_CREATED = 'booking_created',
  MESSAGE_RECEIVED = 'message_received',
  PROVIDER_STATUS_CHANGED = 'provider_status_changed',
  ERROR = 'error'
}

// Message format for WebSocket communication
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: number;
}

// Example of typed events specific to our app
export interface BookingUpdatedEvent {
  bookingId: number;
  status: string;
  updatedAt: string;
}

export interface MessageReceivedEvent {
  messageId: number;
  senderId: number;
  content: string;
  timestamp: string;
}

// WebSocket hook for React components
export function useWebSocket(url: string) {
  const socket = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  // Set up event listeners & callbacks
  const onOpen = useCallback(() => {
    console.log('WebSocket connected');
    setIsConnected(true);
    setError(null);
  }, []);
  
  const onClose = useCallback(() => {
    console.log('WebSocket disconnected');
    setIsConnected(false);
  }, []);
  
  const onError = useCallback((event: Event) => {
    console.error('WebSocket error:', event);
    setError(new Error('WebSocket connection error'));
    setIsConnected(false);
  }, []);
  
  const onMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('WebSocket message received:', message);
      setLastMessage(message);
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  }, []);
  
  // Connect/disconnect WebSocket
  useEffect(() => {
    // Connect to WebSocket server
    socket.current = new WebSocket(url);
    
    // Set up event handlers
    socket.current.onopen = onOpen;
    socket.current.onclose = onClose;
    socket.current.onerror = onError;
    socket.current.onmessage = onMessage;
    
    // Clean up on unmount
    return () => {
      if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        socket.current.close();
      }
    };
  }, [url, onOpen, onClose, onError, onMessage]);
  
  // Send message via WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({
        ...message,
        timestamp: Date.now()
      }));
    } else {
      setError(new Error('WebSocket is not connected'));
    }
  }, []);
  
  return {
    isConnected,
    error,
    lastMessage,
    sendMessage
  };
}

// Usage example:
/*
import { useWebSocket, WebSocketEventTypes } from './services/WebSocketService';

function ChatScreen() {
  // Set up WebSocket connection
  const { isConnected, lastMessage, sendMessage } = useWebSocket('ws://your-backend-url/ws');
  
  // Send a message
  const sendChatMessage = (text: string, recipientId: number) => {
    sendMessage({
      type: 'chat_message',
      data: {
        text,
        recipientId
      }
    });
  };
  
  // Handle incoming messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'chat_message') {
      // Handle received chat message
      const { senderId, text } = lastMessage.data;
      // Update your chat UI
    }
  }, [lastMessage]);
  
  return (
    // Your chat UI components
  );
}
*/