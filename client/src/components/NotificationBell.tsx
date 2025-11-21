import { useState, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [, navigate] = useLocation();

  // Fetch notifications
  const { data: notificationData } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      fetch(`/api/notifications/${notificationId}/read`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => fetch("/api/notifications/mark-all-read", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    },
  });

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!user) return;

    let reconnectTimeout: NodeJS.Timeout;
    let websocket: WebSocket | null = null;
    let isIntentionalClose = false;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      
      // Handle different environments with better error checking
      let wsUrl: string = `${protocol}//${host}/ws/notifications`; // Default fallback
      
      try {
        if (host.includes('replit.dev') || host.includes('spock.replit.dev')) {
          // In Replit environment, use the current host
          wsUrl = `${protocol}//${host}/ws/notifications`;
        } else if (host.includes('localhost')) {
          // In development, ensure port is included
          const port = window.location.port;
          if (!port || port === 'undefined' || port === '') {
            console.warn('Port is undefined or empty, using default 5000');
            wsUrl = `${protocol}//localhost:5000/ws/notifications`;
          } else {
            wsUrl = `${protocol}//localhost:${port}/ws/notifications`;
          }
        } else {
          // Production or other environments
          wsUrl = `${protocol}//${host}/ws/notifications`;
        }
        
        // Validate URL before creating WebSocket
        new URL(wsUrl); // This will throw if URL is invalid
      } catch (urlError) {
        console.error('Invalid WebSocket URL constructed:', wsUrl, urlError);
        console.log('Falling back to hostname with default port');
        // Fallback to hostname with default port
        wsUrl = `${protocol}//${window.location.hostname}:5000/ws/notifications`;
      }
      
      console.log('Connecting to WebSocket:', wsUrl);
      websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log("Connected to notification WebSocket");
        websocket?.send(JSON.stringify({ type: "auth", userId: user.id }));
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "notification" && message.data) {
            // Ensure we only add valid notification objects
            const notification = message.data;
            if (notification && typeof notification === 'object' && notification.id && notification.title) {
              setNotifications(prev => Array.isArray(prev) ? [notification, ...prev] : [notification]);
              
              // Show browser notification if permission granted
              if (Notification.permission === "granted") {
                new Notification(notification.title, {
                  body: notification.message,
                  icon: "/favicon.ico",
                });
              }
            }
          } else if (message.type === "auth_success") {
            console.log("WebSocket authentication successful");
          }
        } catch (error) {
          console.error("Error processing notification:", error);
        }
      };

      websocket.onerror = (error) => {
        console.error("WebSocket connection error:", error);
      };

      websocket.onclose = (event) => {
        if (!isIntentionalClose) {
          console.warn("WebSocket closed unexpectedly:", event.code);
          // Reconnect after 3 seconds if not intentionally closed
          reconnectTimeout = setTimeout(() => {
            if (!isIntentionalClose) {
              connect();
            }
          }, 3000);
        } else {
          console.log("WebSocket connection closed intentionally");
        }
      };

      setWs(websocket);
    };

    connect();

    return () => {
      isIntentionalClose = true;
      clearTimeout(reconnectTimeout);
      if (websocket) {
        websocket.close(1000, "Component unmounting");
      }
    };
  }, [user]);

  // Update notifications from query data
  useEffect(() => {
    if (notificationData) {
      // Ensure we have an array, not an object
      const notificationsArray = Array.isArray(notificationData) ? notificationData : [];
      setNotifications(notificationsArray);
    }
  }, [notificationData]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    // Close the popover
    setIsOpen(false);
    
    // Navigate to order if it's a payment notification
    if (notification.type === 'payment' && notification.data?.orderId) {
      navigate(`/admin/orders/${notification.data.orderId}`);
    } else if (notification.type === 'payment' && notification.data?.orderNumber) {
      // Navigate to orders page and filter by order number
      navigate(`/admin/orders?search=${notification.data.orderNumber}`);
    } else {
      // For other notification types, navigate to relevant page
      switch (notification.type) {
        case 'order_new':
        case 'order_updated':
          navigate('/admin/orders');
          break;
        case 'low_stock':
          navigate('/admin/products');
          break;
        default:
          navigate('/admin');
      }
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment":
        return "💰";
      case "order_new":
        return "🆕";
      case "order_updated":
        return "📦";
      case "low_stock":
        return "⚠️";
      default:
        return "📢";
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(() => {
                          try {
                            const date = new Date(notification.createdAt);
                            if (isNaN(date.getTime())) {
                              return 'Recently';
                            }
                            return formatDistanceToNow(date, { addSuffix: true });
                          } catch (error) {
                            return 'Recently';
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}