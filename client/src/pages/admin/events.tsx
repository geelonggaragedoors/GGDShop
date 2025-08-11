import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Mail,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  DollarSign,
  Package,
  Users
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mock webhook events data (you'll need to create an API endpoint for this)
  const webhookEvents = [
    {
      id: "1",
      eventType: "PAYMENT.CAPTURE.COMPLETED",
      orderId: "ORD-2024-001",
      paypalTransactionId: "2VP123456789",
      amount: 1250.00,
      currency: "AUD",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: "processed",
      customerEmail: "customer@example.com"
    },
    {
      id: "2", 
      eventType: "CHECKOUT.ORDER.APPROVED",
      orderId: "ORD-2024-002",
      paypalTransactionId: "2VP987654321",
      amount: 850.00,
      currency: "AUD", 
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: "processed",
      customerEmail: "another@example.com"
    }
  ];

  const emailEvents = [
    {
      id: "1",
      type: "payment_confirmation",
      recipient: "customer@example.com",
      subject: "Payment Confirmed - Order #ORD-2024-001",
      status: "delivered",
      timestamp: new Date(Date.now() - 1000 * 60 * 35),
      orderId: "ORD-2024-001"
    },
    {
      id: "2",
      type: "order_confirmation", 
      recipient: "another@example.com",
      subject: "Order Confirmation - Order #ORD-2024-002",
      status: "delivered",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
      orderId: "ORD-2024-002"
    }
  ];

  const getEventIcon = (eventType: string) => {
    if (eventType.includes("PAYMENT.CAPTURE.COMPLETED")) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (eventType.includes("PAYMENT.CAPTURE.DENIED")) return <XCircle className="w-4 h-4 text-red-600" />;
    if (eventType.includes("DISPUTE")) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    if (eventType.includes("REFUND")) return <RefreshCw className="w-4 h-4 text-blue-600" />;
    if (eventType.includes("ORDER")) return <Package className="w-4 h-4 text-blue-600" />;
    return <CreditCard className="w-4 h-4 text-gray-600" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      processed: { color: "bg-green-100 text-green-800", label: "Processed" },
      delivered: { color: "bg-green-100 text-green-800", label: "Delivered" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      failed: { color: "bg-red-100 text-red-800", label: "Failed" },
      bounced: { color: "bg-red-100 text-red-800", label: "Bounced" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Events & Notifications</h1>
        <p className="text-gray-600">Monitor webhook events, email notifications, and system alerts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Notifications</p>
                <p className="text-2xl font-bold text-blue-600">{(notifications as any)?.length || 0}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Webhook Events</p>
                <p className="text-2xl font-bold text-green-600">{webhookEvents.length}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-purple-600">{emailEvents.length}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">100%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payment Events</SelectItem>
                <SelectItem value="order">Order Events</SelectItem>
                <SelectItem value="dispute">Disputes</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>System Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>PayPal Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Email Events</span>
          </TabsTrigger>
        </TabsList>

        {/* System Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>System Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {(notifications as any) && (notifications as any).length > 0 ? (
                    notifications.map((notification: any) => (
                      <div key={notification.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <Bell className={`w-5 h-5 mt-1 ${notification.isRead ? 'text-gray-400' : 'text-blue-600'}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          {!notification.isRead && (
                            <Badge className="mt-2 bg-blue-100 text-blue-800">New</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PayPal Webhooks Tab */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>PayPal Webhook Events</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {webhookEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      {getEventIcon(event.eventType)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{event.eventType}</h4>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(event.status)}
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Order:</span>
                            <span className="ml-1 font-medium">{event.orderId}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Amount:</span>
                            <span className="ml-1 font-medium">${event.amount}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Transaction:</span>
                            <span className="ml-1 font-medium text-xs">{event.paypalTransactionId}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Customer:</span>
                            <span className="ml-1 font-medium text-xs">{event.customerEmail}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Events Tab */}
        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {emailEvents.map((email) => (
                    <div key={email.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <Mail className="w-5 h-5 mt-1 text-blue-600" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{email.subject}</h4>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(email.status)}
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(email.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Type:</span>
                            <span className="ml-1 font-medium capitalize">{email.type.replace('_', ' ')}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Recipient:</span>
                            <span className="ml-1 font-medium text-xs">{email.recipient}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Order:</span>
                            <span className="ml-1 font-medium">{email.orderId}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Timestamp:</span>
                            <span className="ml-1 font-medium text-xs">
                              {format(email.timestamp, 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}