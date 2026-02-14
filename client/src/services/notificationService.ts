import api from "./api";
import { toast } from "sonner";

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'create' | 'update' | 'delete';
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000; // 5 seconds
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private isConnecting: boolean = false;
  private onNotificationCallback: ((notification: Notification) => void) | null = null;
  private onConnectionChangeCallback: ((connected: boolean) => void) | null = null;

  constructor() {
    // Auto-reconnect on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.isConnected()) {
        this.connect();
      }
    });
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  connect(): void {
    if (this.isConnecting || this.isConnected()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token available for WebSocket connection');
      return;
    }

    this.isConnecting = true;
    const wsUrl = `ws://localhost:3001/ws?token=${token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        if (this.onConnectionChangeCallback) {
          this.onConnectionChangeCallback(true);
        }
        
        // Send initial ping to keep connection alive
        this.sendPing();
        
        // Start heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            if (this.onNotificationCallback) {
              this.onNotificationCallback(data.data);
            }
          } else if (data.type === 'pong') {
            console.log('Heartbeat received');
          } else if (data.type === 'connected') {
            console.log(data.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        
        if (this.onConnectionChangeCallback) {
          this.onConnectionChangeCallback(false);
        }
        
        // Attempt reconnection
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  private sendPing(): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({ type: 'ping' }));
    }
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds to keep connection alive
    setInterval(() => {
      if (this.isConnected()) {
        this.sendPing();
      }
    }, 30000);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
  }

  setOnNotificationCallback(callback: (notification: Notification) => void): void {
    this.onNotificationCallback = callback;
  }

  setOnConnectionChangeCallback(callback: (connected: boolean) => void): void {
    this.onConnectionChangeCallback = callback;
  }
}

// REST API calls
export const notificationAPI = {
  // Get notifications
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) => {
    return api.get<PaginatedNotifications>("/notifications", { params });
  },

  // Mark as read
  markAsRead: (id: number) => {
    return api.put(`/notifications/${id}/read`);
  },

  // Mark all as read
  markAllAsRead: () => {
    return api.put("/notifications/read-all");
  },

  // Get unread count
  getUnreadCount: () => {
    return api.get<{ count: number }>("/notifications/unread-count");
  },

  // Create notification (admin/backend use)
  createNotification: (data: {
    userId: number;
    title: string;
    message: string;
    type: Notification['type'];
  }) => {
    return api.post("/notifications", data);
  }
};

// Singleton WebSocket instance
export const webSocketService = new WebSocketService();

// Helper function to trigger notifications from other services
export const triggerNotification = (title: string, message: string, type: Notification['type'] = 'info') => {
  const notification: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'read'> = {
    title,
    message,
    type
  };
  
  // Show toast notification
  switch (type) {
    case 'success':
    case 'create':
      toast.success(message, { description: title });
      break;
    case 'warning':
    case 'update':
      toast.warning(message, { description: title });
      break;
    case 'error':
    case 'delete':
      toast.error(message, { description: title });
      break;
    default:
      toast.info(message, { description: title });
  }
  
  return notification;
};