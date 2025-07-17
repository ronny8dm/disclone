const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5120';

export interface WebSocketMessage {
  type: string;
  conversationId?: string;
  content?: string;
  data?: any;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private listeners: Map<string, Function[]> = new Map();
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.setupEventHandlers();
  }

  connect(userId: string): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    
    if (this.isConnected && this.userId === userId) {
      return Promise.resolve();
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
       
        if (this.ws) {
          this.disconnect();
        }

        this.userId = userId;
        const wsUrl = `${WS_BASE_URL}/ws/connect?userId=${encodeURIComponent(userId)}`;
        
        console.log('🔌 Connecting to WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected for user:', userId);
          this.reconnectAttempts = 0;
          this.connectionPromise = null; 
          this.emit('connected', { userId });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', message);
            this.emit('message', message);
            this.emit(message.type, message);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
            this.emit('error', { type: 'parse_error', error });
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          this.connectionPromise = null; 
          this.emit('disconnected', { userId, code: event.code, reason: event.reason });
          
         
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.connectionPromise = null; 
          this.emit('error', { type: 'connection_error', error });
          reject(new Error('WebSocket connection failed'));
        };

     
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.connectionPromise = null;
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000); 

      } catch (error) {
        console.error('❌ Error connecting to WebSocket:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; 
    
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    
    this.userId = null;
    this.connectionPromise = null;
    console.log('🔌 WebSocket manually disconnected');
  }

  send(message: WebSocketMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log('📤 WebSocket message sent:', message);
      return true;
    } else {
      console.warn('⚠️ WebSocket not connected, message not sent:', message);
      return false;
    }
  }


  joinConversation(conversationId: string): void {
    this.send({
      type: 'join_conversation',
      conversationId
    });
  }

  leaveConversation(conversationId: string): void {
    this.send({
      type: 'leave_conversation',
      conversationId
    });
  }

  // Typing indicators
  startTyping(conversationId: string): void {
    this.send({
      type: 'typing_start',
      conversationId
    });
  }

  stopTyping(conversationId: string): void {
    this.send({
      type: 'typing_stop',
      conversationId
    });
  }

  
  ping(): void {
    this.send({ type: 'ping' });
  }

 
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }
    
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in ${event} callback:`, error);
        }
      });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId).catch(error => {
            console.error('❌ Reconnection failed:', error);
          });
        }
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max_reconnects_reached');
    }
  }

  private setupEventHandlers(): void {
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.userId && !this.isConnected) {
          console.log('🔄 Page became visible, reconnecting...');
          this.connect(this.userId).catch(console.error);
        }
      });
    }

   
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
    }
  }

  
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  get currentUserId(): string | null {
    return this.userId;
  }
}


export const webSocketService = new WebSocketService();