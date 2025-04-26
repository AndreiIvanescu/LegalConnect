import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';
import { storage } from './storage';

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

// Store connected clients with their user IDs
const connectedClients = new Map<number, ExtendedWebSocket>();

export function setupWebSocketServer(server: Server) {
  // Create WebSocket server on a separate path to avoid conflict with Vite's HMR
  const wss = new WebSocketServer({ server, path: '/ws' });

  console.log('WebSocket server initialized at path /ws');

  // Set up heartbeat interval to detect disconnected clients
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) {
        // Remove client that didn't respond to ping
        if (ws.userId) {
          connectedClients.delete(ws.userId);
        }
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Clean up on server close
  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // Handle new connections
  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    // Extract token or user ID from query parameters
    const { query } = parse(req.url || '', true);
    const userId = Number(query.userId);
    
    // Set initial state
    ws.isAlive = true;
    
    // Authenticate user (in production, use proper auth tokens)
    if (!userId || isNaN(userId)) {
      console.log('WebSocket connection rejected - invalid user ID');
      ws.send(JSON.stringify({ 
        type: 'error', 
        data: { message: 'Authentication required' } 
      }));
      return ws.close();
    }
    
    // Store user ID with connection
    ws.userId = userId;
    
    // Add to connected clients mapping
    connectedClients.set(userId, ws);
    console.log(`WebSocket client connected: User ID ${userId}`);
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connect', 
      data: { message: 'Connected to legal services marketplace' },
      timestamp: Date.now()
    }));
    
    // Handle ping/pong for connection monitoring
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle incoming messages
    ws.on('message', async (message: string) => {
      try {
        // Parse the message
        const parsedMessage = JSON.parse(message.toString());
        const { type, data } = parsedMessage;
        
        console.log(`Received message of type ${type} from user ${userId}`);
        
        // Process different message types
        switch (type) {
          case 'chat_message':
            // Handle new chat messages
            if (data.recipientId && data.text) {
              await handleChatMessage(userId, data.recipientId, data.text);
            }
            break;
            
          case 'booking_status_update':
            // Handle booking status updates
            if (data.bookingId && data.status) {
              await handleBookingUpdate(userId, data.bookingId, data.status);
            }
            break;
            
          case 'ping':
            // Simple ping/pong for connection checking
            ws.send(JSON.stringify({ 
              type: 'pong', 
              timestamp: Date.now() 
            }));
            break;
            
          default:
            console.log(`Unknown message type: ${type}`);
        }
        
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          data: { message: 'Invalid message format' } 
        }));
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      if (ws.userId) {
        connectedClients.delete(ws.userId);
        console.log(`WebSocket client disconnected: User ID ${ws.userId}`);
      }
    });
  });
  
  return wss;
}

// Send a message to a specific user
export function sendMessageToUser(userId: number, messageData: any) {
  const client = connectedClients.get(userId);
  
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({
      ...messageData,
      timestamp: Date.now()
    }));
    return true;
  }
  
  return false;
}

// Broadcast a message to all connected clients
export function broadcastMessage(messageData: any) {
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        ...messageData,
        timestamp: Date.now()
      }));
    }
  });
}

// Handle new chat messages
async function handleChatMessage(senderId: number, recipientId: number, content: string) {
  try {
    // Store message in database
    const message = await storage.createMessage({
      senderId,
      receiverId: recipientId,
      content,
      read: false
    });
    
    // Send to recipient if online
    const messageData = {
      type: 'message_received',
      data: {
        messageId: message.id,
        senderId,
        content,
        timestamp: message.createdAt ? message.createdAt.toISOString() : new Date().toISOString()
      }
    };
    
    sendMessageToUser(recipientId, messageData);
    
  } catch (error) {
    console.error('Error handling chat message:', error);
  }
}

// Handle booking status updates
async function handleBookingUpdate(userId: number, bookingId: number, status: string) {
  try {
    // Get the booking
    const booking = await storage.getBookingById(bookingId);
    
    if (!booking) {
      return;
    }
    
    // Only allow provider or client to update booking
    const isProvider = booking.providerId === userId;
    const isClient = booking.clientId === userId;
    
    if (!isProvider && !isClient) {
      return;
    }
    
    // Update booking status
    const updatedBooking = await storage.updateBooking(bookingId, { status });
    
    // Determine recipient ID (the other party)
    const recipientId = isProvider ? booking.clientId : booking.providerId;
    
    // Send update to the other party
    const messageData = {
      type: 'booking_updated',
      data: {
        bookingId,
        status,
        updatedAt: new Date().toISOString()
      }
    };
    
    sendMessageToUser(recipientId, messageData);
    
  } catch (error) {
    console.error('Error handling booking update:', error);
  }
}