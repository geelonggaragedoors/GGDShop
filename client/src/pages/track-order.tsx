import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const statusConfig = {
  pending: { color: "bg-yellow-500", icon: Clock, label: "Order Received" },
  processing: { color: "bg-blue-500", icon: Package, label: "Processing" },
  shipped: { color: "bg-purple-500", icon: Truck, label: "Shipped" },
  delivered: { color: "bg-green-500", icon: CheckCircle, label: "Delivered" },
  cancelled: { color: "bg-red-500", icon: AlertCircle, label: "Cancelled" }
};

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);
  const { toast } = useToast();

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/orders/track", orderNumber, email],
    enabled: false, // Only run when manually triggered
  });

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim() || !email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both order number and email address.",
        variant: "destructive",
      });
      return;
    }

    setSearchAttempted(true);
    refetch();
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return <Icon className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.color || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.label || status;
  };

  return (
    <>
      <SEOHead 
        title="Track Your Order - Geelong Garage Doors"
        description="Track your garage door order status. Enter your order number and email to get real-time updates on your purchase."
        keywords="track order, order status, garage door delivery, order tracking"
      />
      
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Track Your Order</h1>
            <p className="text-gray-600">
              Enter your order number and email address to track your garage door order
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Order Lookup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrackOrder} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Order Number
                    </label>
                    <Input
                      id="orderNumber"
                      type="text"
                      placeholder="e.g., ORD-123456"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Tracking..." : "Track Order"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Results */}
          {searchAttempted && (
            <>
              {isLoading && (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Searching for your order...</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {error && (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
                      <p className="text-gray-600 mb-4">
                        We couldn't find an order with that number and email combination.
                      </p>
                      <ul className="text-sm text-gray-500 text-left max-w-md mx-auto">
                        <li>• Check your order number is correct</li>
                        <li>• Verify the email address matches your order</li>
                        <li>• Order numbers are case-sensitive</li>
                        <li>• Contact us if you continue having issues</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {order && (
                <div className="space-y-6">
                  {/* Order Status */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Order #{order.orderNumber}</CardTitle>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
                          </span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Order Date</p>
                          <p className="font-medium">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="font-medium">${order.total.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Customer</p>
                          <p className="font-medium">
                            {order.customer.firstName} {order.customer.lastName}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.items.map((item, index) => (
                          <div key={item.id}>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                              </div>
                              <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            {index < order.items.length - 1 && <Separator className="mt-4" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shipping Address */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-700">
                        <p>{order.shippingAddress.street}</p>
                        <p>
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(statusConfig).map(([status, config], index) => {
                          const Icon = config.icon;
                          const isCompleted = ['pending', 'processing', 'shipped'].includes(status) && 
                                            ['processing', 'shipped', 'delivered'].includes(order.status);
                          const isCurrent = status === order.status;
                          
                          return (
                            <div key={status} className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCurrent ? config.color : isCompleted ? 'bg-green-500' : 'bg-gray-300'
                              } text-white`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className={`font-medium ${
                                isCurrent ? 'text-gray-900' : isCompleted ? 'text-green-600' : 'text-gray-400'
                              }`}>
                                {config.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* Help Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Contact Support</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    If you have questions about your order, our team is here to help.
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm">📞 (03) 5221 8999</p>
                    <p className="text-sm">✉️ info@geelonggaragedoors.com.au</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Order Information</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    You can find your order number in your confirmation email.
                  </p>
                  <p className="text-sm text-gray-600">
                    Orders typically process within 1-2 business days and shipping times vary by location.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}