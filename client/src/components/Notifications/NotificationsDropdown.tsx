"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, X, CheckCircle2, AlertCircle, Info, Calendar, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { notificationAPI, webSocketService, type Notification } from "../../services/notificationService";

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface PaginatedNotificationsResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const markAsReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMarkedAsReadRef = useRef<boolean>(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await notificationAPI.getNotifications({
        page: 1,
        limit: 50,
        unreadOnly: false
      });
      
      // Handle API response structure
      const apiResponse = response as unknown as ApiResponse<PaginatedNotificationsResponse>;
      
      if (apiResponse?.data) {
        setNotifications(apiResponse.data.notifications || []);
        setTotal(apiResponse.data.pagination?.total || 0);
      } else {
        console.error("Unexpected API response:", response);
        setNotifications([]);
        setTotal(0);
      }
      
      // Get unread count for badge
      try {
        await notificationAPI.getUnreadCount();
      } catch (error) {
        console.error("Failed to get unread count:", error);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
      setNotifications([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // Setup WebSocket callbacks
    webSocketService.setOnNotificationCallback((newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      setTotal(prev => prev + 1);
      
      // Show toast for new notification
      toast.info(newNotification.message, {
        description: newNotification.title,
        duration: 5000,
      });
    });

    webSocketService.setOnConnectionChangeCallback((connected) => {
      setWsConnected(connected);
      if (connected) {
        console.log("WebSocket connected successfully");
      }
    });

    // Connect WebSocket
    webSocketService.connect();

    // Fetch initial notifications
    fetchNotifications();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
  }, [fetchNotifications]);

  // Function to mark notifications as read
  const markNotificationsAsRead = useCallback(async (): Promise<void> => {
    const unreadNotifications = notifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);

    if (unreadNotifications.length === 0) return;

    try {
      // Mark each notification as read
      await Promise.all(
        unreadNotifications.map(id => notificationAPI.markAsRead(id))
      );

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          unreadNotifications.includes(notif.id)
            ? { ...notif, read: true }
            : notif
        )
      );
      hasMarkedAsReadRef.current = true;
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }, [notifications]);

  // Effect to handle dropdown open/close and automatic marking as read
  useEffect(() => {
    if (open && !hasMarkedAsReadRef.current) {
      markNotificationsAsRead();

      markAsReadTimeoutRef.current = setTimeout(() => {
        // Additional UI updates after 5 seconds
      }, 5000);
    } else {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
        markAsReadTimeoutRef.current = null;
      }
    }

    if (!open) {
      hasMarkedAsReadRef.current = false;
    }

    return () => {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
  }, [open, markNotificationsAsRead]);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type?.toLowerCase()) {
      case "success":
      case "create":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning":
      case "update":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
      case "delete":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationBadge = (type: Notification["type"]) => {
    switch (type?.toLowerCase()) {
      case "success":
      case "created":
        return <Badge className="bg-green-500 hover:bg-green-600 text-xs">Success</Badge>;
      case "warning":
      case "updated":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">Warning</Badge>;
      case "error":
      case "delete":
        return <Badge className="bg-red-500 hover:bg-red-600 text-xs">Error</Badge>;
      default:
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">Info</Badge>;
    }
  };

  const formatTime = (createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      await notificationAPI.markAllAsRead();
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const refreshNotifications = async (): Promise<void> => {
    await fetchNotifications();
    toast.success("Notifications refreshed");
  };

  const toggleWebSocket = (): void => {
    if (wsConnected) {
      webSocketService.disconnect();
    } else {
      webSocketService.connect();
    }
  };

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  return (
    <div className="relative">
      {/* Bell Button with Notification Count */}
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 rounded-lg flex items-center justify-center bg-hoverBg relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <Card className="absolute right-0 mt-2 w-96 rounded-xl shadow-lg border bg-background z-50 max-h-[80vh] overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary rounded-lg">
                  <Bell className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-xs text-muted-foreground">{total} total notifications</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleWebSocket}
                  title={wsConnected ? "Disconnect WebSocket" : "Connect WebSocket"}
                  className="h-8 w-8"
                >
                  {wsConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshNotifications}
                  className="h-8 w-8"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            {notifications.length > 0 && (
              <div className="flex justify-between px-4 py-2 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Mark all as read
                </Button>
                <Button variant="ghost" size="sm" onClick={refreshNotifications}>
                  Refresh
                </Button>
              </div>
            )}

            {/* Connection Status */}
            <div className={`px-4 py-2 text-xs border-b ${wsConnected ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
              <div className="flex items-center gap-2">
                {wsConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-green-700 dark:text-green-400">Connected to real-time notifications</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span className="text-red-700 dark:text-red-400">Disconnected - notifications may be delayed</span>
                  </>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-pulse" />
                  <p className="text-sm text-muted-foreground font-medium">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">No notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    New notifications will appear here
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`mb-2 transition-colors ${
                        !notification.read
                          ? "border-l-4 border-l-primary bg-blue-50 dark:bg-blue-950/20"
                          : ""
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-sm leading-tight">
                                  {notification.title}
                                </p>
                                {getNotificationBadge(notification.type)}
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground mb-2 leading-tight">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formatTime(notification.createdAt)}</span>
                              </div>
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await notificationAPI.markAsRead(notification.id);
                                      setNotifications(prev =>
                                        prev.map(n =>
                                          n.id === notification.id ? { ...n, read: true } : n
                                        )
                                      );
                                    } catch (error) {
                                      console.error("Failed to mark as read:", error);
                                    }
                                  }}
                                  className="h-6 text-xs"
                                >
                                  Mark read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}