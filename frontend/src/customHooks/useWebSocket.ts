import { useEffect, useCallback, useState } from 'react';
import { webSocketService, WebSocketMessage } from '@/lib/api/webSocketService';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (data?: any) => void;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
}

export const useWebSocket = (userId: string | null, options: UseWebSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const {
    autoConnect = true,
    onConnect,
    onDisconnect,
    onMessage,
    onError
  } = options;

  // Connection function
  const connect = useCallback(async () => {
    if (!userId) {
      console.warn('⚠️ Cannot connect WebSocket: userId is null');
      return false;
    }

    try {
      setError(null);
      await webSocketService.connect(userId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'WebSocket connection failed';
      console.error('❌ WebSocket connection error:', errorMessage);
      setError(errorMessage);
      onError?.(err);
      return false;
    }
  }, [userId, onError]);

  // Disconnect function
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  // Send message function
  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    return webSocketService.send(message);
  }, []);

  // Join conversation
  const joinConversation = useCallback((conversationId: string) => {
    webSocketService.joinConversation(conversationId);
  }, []);

  // Leave conversation
  const leaveConversation = useCallback((conversationId: string) => {
    webSocketService.leaveConversation(conversationId);
  }, []);

  // Typing indicators
  const startTyping = useCallback((conversationId: string) => {
    webSocketService.startTyping(conversationId);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    webSocketService.stopTyping(conversationId);
  }, []);

  // Set up event listeners and auto-connect
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
      setError(null);
      onConnect?.();
    };

    const handleDisconnect = (data: any) => {
      setIsConnected(false);
      setConnectionState('disconnected');
      onDisconnect?.(data);
    };

    const handleMessage = (message: any) => {
      onMessage?.(message);
    };

    const handleError = (errorData: any) => {
      setError(errorData.error?.message || 'WebSocket error');
      onError?.(errorData);
    };

    // Register event listeners
    webSocketService.on('connected', handleConnect);
    webSocketService.on('disconnected', handleDisconnect);
    webSocketService.on('message', handleMessage);
    webSocketService.on('error', handleError);

    // Auto-connect if enabled and userId is available
    if (autoConnect && userId) {
      connect();
    }

    // Update connection state
    setIsConnected(webSocketService.isConnected);
    setConnectionState(webSocketService.connectionState);

    // Cleanup
    return () => {
      webSocketService.off('connected', handleConnect);
      webSocketService.off('disconnected', handleDisconnect);
      webSocketService.off('message', handleMessage);
      webSocketService.off('error', handleError);
    };
  }, [userId, autoConnect, connect, onConnect, onDisconnect, onMessage, onError]);

  return {
    isConnected,
    connectionState,
    error,
    connect,
    disconnect,
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
  };
};