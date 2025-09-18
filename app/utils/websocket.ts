// app/utils/websocket.ts
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  payload: any;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private eventHandlers: Map<string, Function[]> = new Map();
  private isConnected = false;
  private messageQueue: WebSocketMessage[] = [];
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.connect();
  }

  connect() {
    try {
      // Clear any existing connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      // Get user data for authentication
      const userDataString = localStorage.getItem('user');
      const userData = userDataString ? JSON.parse(userDataString) : null;
      const userId = userData?._id || 'anonymous';

      // Create Socket.io connection
      this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://185.225.223.193:3001', {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        auth: {
          token: localStorage.getItem('token'),
          userId: userId
        },
        query: {
          userId: userId
        }
      });

      // Set connection timeout (5 seconds)
      this.connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.error('WebSocket connection timeout');
          this.onConnectionError();
        }
      }, 5000);

      // Socket.io event handlers
      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Clear connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        this.emit('connected', null);
        
        // Process any queued messages
        this.processMessageQueue();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected', reason);
        this.isConnected = false;
        this.emit('disconnected', { reason });
        
        // Clear connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        // Attempt to reconnect
        this.attemptReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.onConnectionError();
      });

      // Listen for all custom events
      this.socket.onAny((event, data) => {
        this.emit(event, data);
      });

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.onConnectionError();
    }
  }

  private onConnectionError() {
    console.error('WebSocket connection error');
    this.isConnected = false;
    this.emit('connection-error', null);
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    this.attemptReconnect();
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('max-reconnect-attempts', null);
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message && this.socket) {
        this.socket.emit(message.type, message.payload);
      }
    }
  }

  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
    return this; // Allow method chaining
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
    return this; // Allow method chaining
  }

  once(event: string, handler: Function) {
    const onceHandler = (data: any) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
    return this; // Allow method chaining
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      // Use setTimeout to avoid blocking the WebSocket thread
      setTimeout(() => {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in event handler for ${event}:`, error);
          }
        });
      }, 0);
    }
  }

  send(type: string, payload: any = {}) {
    if (this.isConnected && this.socket) {
      this.socket.emit(type, payload);
      return true;
    } else {
      // If not connected, add to queue and try to connect
      this.messageQueue.push({ type, payload });
      if (!this.isConnected) {
        this.connect();
      }
      return false;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      queuedMessages: this.messageQueue.length
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    this.emit('disconnected', { reason: 'Manual disconnect' });
  }

  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  clearQueue() {
    this.messageQueue = [];
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();

// Export the class for testing or other use cases
export { WebSocketService };