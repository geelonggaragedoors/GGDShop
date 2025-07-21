import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Printer,
  ExternalLink,
  Package,
  Truck,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Clock,
  User,
  Phone,
  Building,
  DollarSign,
  Box,
  Ship,
  Eye,
  Edit3,
  Copy,
  Send
} from "lucide-react";

interface OrderDetailsProps {
  orderId: string;
  onClose?: () => void;
}

export default function OrderDetails({ orderId, onClose }: OrderDetailsProps) {
  // Initialize all hooks first (must be before any conditional returns)
  const [staffNotes, setStaffNotes] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch detailed order data with product information
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: [`/api/admin/orders/${orderId}`],
    enabled: !!orderId,
  });

  // All mutations must be declared before conditional returns
  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order updated successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update order",
        variant: "destructive" 
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (type: 'receipt' | 'status_update') => {
      const response = await fetch(`/api/admin/orders/${orderId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!response.ok) throw new Error("Failed to send email");
      return response.json();
    },
    onSuccess: (data, type) => {
      toast({ 
        title: `${type === 'receipt' ? 'Receipt' : 'Status update'} sent`,
        description: `Email sent to ${order?.customerEmail || 'customer'}` 
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to send email",
        variant: "destructive" 
      });
    },
  });

  const printOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/orders/${orderId}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printedBy: "Current User" }),
      });
      if (!response.ok) throw new Error("Failed to mark as printed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order marked as printed" });
      window.print();
    },
  });

  // Update staffNotes when order data is loaded
  React.useEffect(() => {
    if (order?.staffNotes) {
      setStaffNotes(order.staffNotes);
    }
  }, [order?.staffNotes]);

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Order not found</p>
          <Button onClick={onClose} className="mt-4">
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const handleStatusUpdate = (field: string, value: string) => {
    const oldStatus = order[field];
    updateOrderMutation.mutate({ [field]: value });
    
    // Send email notification for status changes
    if (field === 'status' || field === 'shippingStatus') {
      sendEmailMutation.mutate('status_update');
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const updatedNotes = staffNotes ? `${staffNotes}\n\n[${format(new Date(), 'dd/MM/yyyy HH:mm')}] ${newNote}` : `[${format(new Date(), 'dd/MM/yyyy HH:mm')}] ${newNote}`;
    updateOrderMutation.mutate({ staffNotes: updatedNotes });
    setStaffNotes(updatedNotes);
    setNewNote("");
    setIsAddingNote(false);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ 
        title: `${type} copied`,
        description: `${type} copied to clipboard` 
      });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to copy to clipboard",
        variant: "destructive" 
      });
    }
  };

  const copyEmail = () => copyToClipboard(order.customerEmail, "Email");
  
  const copyAddress = () => {
    if (order.shippingAddress) {
      const addressText = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}\n${order.shippingAddress.address1}${order.shippingAddress.address2 ? '\n' + order.shippingAddress.address2 : ''}\n${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postcode}\n${order.shippingAddress.country || 'AU'}`;
      copyToClipboard(addressText, "Address");
    }
  };
  
  const copyPhone = () => {
    if (order.shippingAddress?.phone) {
      copyToClipboard(order.shippingAddress.phone, "Phone number");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
      not_shipped: "bg-gray-100 text-gray-800",
      preparing: "bg-yellow-100 text-yellow-800",
      in_transit: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  if (!order) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-gray-600">Placed on {format(new Date(order.createdAt), 'dd MMMM yyyy \'at\' HH:mm')}</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const firstProduct = order.items?.[0]?.product;
              if (firstProduct?.slug) {
                window.open(`/product/${firstProduct.slug}`, '_blank');
              } else {
                window.open('/', '_blank');
              }
            }}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Product
          </Button>
          
          <Button
            onClick={() => sendEmailMutation.mutate('receipt')}
            disabled={sendEmailMutation.isPending}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Send Receipt
          </Button>
          
          <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Customer Receipt</DialogTitle>
              </DialogHeader>
              <div className="receipt-content bg-white p-8">
                {/* Receipt content will be rendered here */}
                <CustomerReceipt order={order} />
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            onClick={() => printOrderMutation.mutate()}
            disabled={printOrderMutation.isPending}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Info & Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Order Status</label>
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleStatusUpdate('status', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Payment Status</label>
                  <Select
                    value={order.paymentStatus}
                    onValueChange={(value) => handleStatusUpdate('paymentStatus', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Shipping Status</label>
                  <Select
                    value={order.shippingStatus || 'not_shipped'}
                    onValueChange={(value) => handleStatusUpdate('shippingStatus', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_shipped">Not Shipped</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                <Badge className={getStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
                <Badge className={getStatusColor(order.shippingStatus || 'not_shipped')}>
                  {order.shippingStatus || 'not_shipped'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {item.product?.images?.[0] && (
                        <img
                          src={item.product.images[0]}
                          alt={item.product?.name || 'Product'}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-medium">{item.product?.name || 'Product'}</h4>
                        <p className="text-sm text-gray-600">SKU: {item.product?.sku}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(parseFloat(item.price))}</p>
                      <p className="text-sm text-gray-600">Total: {formatCurrency(parseFloat(item.total))}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(parseFloat(order.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{formatCurrency(parseFloat(order.shippingCost || '0'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (GST):</span>
                  <span>{formatCurrency(parseFloat(order.taxAmount || '0'))}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(parseFloat(order.total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Staff Notes
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddingNote(true)}
                  className="flex items-center gap-1"
                >
                  <Edit3 className="w-4 h-4" />
                  Add Note
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {staffNotes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{staffNotes}</pre>
                </div>
              )}
              
              {isAddingNote && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a staff note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddNote}>
                      <Send className="w-4 h-4 mr-1" />
                      Add Note
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingNote(false);
                        setNewNote("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              {order.notes && (
                <div>
                  <h5 className="font-medium mb-2">Customer Notes:</h5>
                  <p className="text-gray-600 bg-blue-50 p-3 rounded">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer & Payment Info */}
        <div className="space-y-6">
          
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{order.customerEmail}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyEmail}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              
              {order.shippingAddress && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">Shipping Address</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyAddress}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    <p>{order.shippingAddress.address1}</p>
                    {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postcode}</p>
                    <p>{order.shippingAddress.country || 'Australia'}</p>
                  </div>
                  
                  {order.shippingAddress.phone && (
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{order.shippingAddress.phone}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyPhone}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* PayPal Information */}
          {(order.paypalOrderId || order.paypalPaymentId) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  PayPal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.paypalOrderId && (
                  <div>
                    <span className="text-sm font-medium">Order ID:</span>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded">{order.paypalOrderId}</p>
                  </div>
                )}
                {order.paypalPaymentId && (
                  <div>
                    <span className="text-sm font-medium">Payment ID:</span>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded">{order.paypalPaymentId}</p>
                  </div>
                )}
                {order.paypalTransactionId && (
                  <div>
                    <span className="text-sm font-medium">Transaction ID:</span>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded">{order.paypalTransactionId}</p>
                  </div>
                )}
                {order.paypalPayerInfo && (
                  <div>
                    <span className="text-sm font-medium">Payer Info:</span>
                    <div className="text-sm bg-gray-50 p-2 rounded">
                      <pre>{JSON.stringify(order.paypalPayerInfo, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Australia Post Information */}
          {(order.auspostService || order.auspostBoxSize) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Australia Post Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.auspostService && (
                  <div>
                    <span className="text-sm font-medium">Service:</span>
                    <p className="text-sm">{order.auspostService}</p>
                  </div>
                )}
                {order.auspostBoxSize && (
                  <div>
                    <span className="text-sm font-medium">Box Size:</span>
                    <p className="text-sm">{order.auspostBoxSize}</p>
                  </div>
                )}
                {order.auspostBoxCost && (
                  <div>
                    <span className="text-sm font-medium">Box Cost:</span>
                    <p className="text-sm">{formatCurrency(parseFloat(order.auspostBoxCost))}</p>
                  </div>
                )}
                {order.auspostPostageCost && (
                  <div>
                    <span className="text-sm font-medium">Postage Cost:</span>
                    <p className="text-sm">{formatCurrency(parseFloat(order.auspostPostageCost))}</p>
                  </div>
                )}
                {order.auspostTrackingNumber && (
                  <div>
                    <span className="text-sm font-medium">Tracking Number:</span>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded">{order.auspostTrackingNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Order placed: {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              {order.printedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Printed: {format(new Date(order.printedAt), 'dd/MM/yyyy HH:mm')}</span>
                  {order.printedBy && <span className="text-gray-500">by {order.printedBy}</span>}
                </div>
              )}
              {order.status === 'shipped' && order.auspostTrackingNumber && order.shippedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="flex flex-col">
                    <span>Shipped: {format(new Date(order.shippedAt), 'dd/MM/yyyy HH:mm')}</span>
                    <span className="text-gray-500 text-xs">
                      Tracking: {order.auspostTrackingNumber} | 
                      <a 
                        href={`https://auspost.com.au/mypost/track/details/${order.auspostTrackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 ml-1"
                      >
                        Track package
                      </a>
                    </span>
                  </div>
                </div>
              )}
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Last updated: {format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Customer Receipt Component
function CustomerReceipt({ order }: { order: any }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  return (
    <div className="receipt-content space-y-6">
      {/* Header with Logo */}
      <div className="text-center border-b pb-6">
        <div className="flex justify-center mb-2">
          <img 
            src="/logo.png"
            alt="Geelong Garage Doors" 
            className="h-16 w-auto"
            onError={(e) => {
              const fallback = document.createElement('div');
              fallback.className = 'w-24 h-24 mx-auto mb-4 bg-primary rounded-lg flex items-center justify-center';
              fallback.innerHTML = '<div class="w-12 h-12 text-white flex items-center justify-center text-xl font-bold">GGD</div>';
              e.currentTarget.parentNode?.replaceChild(fallback, e.currentTarget);
            }}
          />
        </div>
        <p className="text-sm text-gray-500">ABN: 52 626 829 710</p>
      </div>

      {/* Order Information */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold text-lg mb-3">Order Details</h2>
          <p><span className="font-medium">Order Number:</span> #{order.orderNumber}</p>
          <p><span className="font-medium">Order Date:</span> {format(new Date(order.createdAt), 'dd MMMM yyyy')}</p>
          <p><span className="font-medium">Payment Status:</span> {order.paymentStatus}</p>
          <p><span className="font-medium">Order Status:</span> {order.status}</p>
        </div>
        
        <div>
          <h2 className="font-bold text-lg mb-3">Customer Information</h2>
          <p><span className="font-medium">Email:</span> {order.customerEmail}</p>
          {order.shippingAddress && (
            <div className="mt-2">
              <p className="font-medium">Shipping Address:</p>
              <div className="text-sm">
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postcode}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h2 className="font-bold text-lg mb-3">Items Ordered</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium">Item</th>
                <th className="text-center p-3 font-medium">Qty</th>
                <th className="text-right p-3 font-medium">Price</th>
                <th className="text-right p-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any, index: number) => (
                <tr key={index} className="border-t">
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{item.product?.name || 'Product'}</p>
                      <p className="text-sm text-gray-600">SKU: {item.product?.sku}</p>
                    </div>
                  </td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-right">{formatCurrency(parseFloat(item.price))}</td>
                  <td className="p-3 text-right">{formatCurrency(parseFloat(item.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Summary */}
      <div className="border-t pt-4">
        <div className="max-w-md ml-auto space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(parseFloat(order.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>{formatCurrency(parseFloat(order.shippingCost || '0'))}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (GST):</span>
            <span>{formatCurrency(parseFloat(order.taxAmount || '0'))}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(parseFloat(order.total))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 border-t pt-4">
        <p>Thank you for your business!</p>
        <p>For support, contact us at info@geelonggaragedoors.com</p>
        <p>Visit us at www.geelonggaragedoors.com</p>
      </div>
    </div>
  );
}