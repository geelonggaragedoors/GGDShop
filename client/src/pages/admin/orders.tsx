import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import DataTable from "@/components/ui/data-table";
import OrderDetails from "@/components/OrderDetails";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Eye, Edit, Package, Truck, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const { toast } = useToast();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["/api/admin/orders", { status: statusFilter, limit: pageSize, offset: page * pageSize }],
    queryFn: () => api.admin.orders.getAll({
      status: statusFilter === "all" ? undefined : statusFilter || undefined,
      limit: pageSize,
      offset: page * pageSize,
    }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      api.admin.orders.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "Order status updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Add tracking number mutation
  const trackingSchema = z.object({
    trackingNumber: z.string().length(12, "Tracking number must be exactly 12 digits").regex(/^\d+$/, "Tracking number must contain only digits")
  });

  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<string | null>(null);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const trackingForm = useForm<z.infer<typeof trackingSchema>>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      trackingNumber: ""
    }
  });

  const addTrackingMutation = useMutation({
    mutationFn: async ({ orderId, trackingNumber }: { orderId: string; trackingNumber: string }) => {
      const response = await fetch(`/api/admin/orders/${orderId}/add-tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ 
        title: "Success", 
        description: `Order ${data.orderNumber} has been shipped with tracking ${trackingForm.getValues().trackingNumber}` 
      });
      setIsTrackingDialogOpen(false);
      trackingForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/counts"] });
      toast({ title: "Order deleted successfully" });
      setOrderToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'shipped': return 'outline';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(Number(amount));
  };

  const filteredOrders = ordersData?.orders?.filter((order: any) =>
    order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    order.customerEmail.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const columns = [
    {
      header: "Order",
      accessorKey: "orderNumber",
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium text-gray-900">#{row.original.orderNumber}</p>
          <p className="text-sm text-gray-500">
            {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
          </p>
        </div>
      ),
    },
    {
      header: "Customer",
      accessorKey: "customerEmail",
      cell: ({ row }: any) => {
        const shippingAddr = row.original.shippingAddress;
        return (
          <div>
            <p className="font-medium text-gray-900">
              {shippingAddr?.firstName} {shippingAddr?.lastName}
            </p>
            <p className="text-sm text-gray-600">{row.original.customerEmail}</p>
            {shippingAddr?.phone && (
              <p className="text-sm text-gray-500">{shippingAddr.phone}</p>
            )}
          </div>
        );
      },
    },
    {
      header: "Shipping Address",
      accessorKey: "shippingAddress",
      cell: ({ row }: any) => {
        const addr = row.original.shippingAddress;
        return (
          <div>
            <p className="text-sm text-gray-900">{addr?.address}</p>
            <p className="text-sm text-gray-600">
              {addr?.city}, {addr?.state} {addr?.postcode}
            </p>
          </div>
        );
      },
    },
    {
      header: "Total",
      accessorKey: "total",
      cell: ({ row }: any) => (
        <div>
          <p className="font-semibold text-gray-900">
            {formatCurrency(row.original.total)}
          </p>
          <p className="text-sm text-gray-500">
            Shipping: {formatCurrency(row.original.shippingCost || 0)}
          </p>
          <p className="text-sm text-gray-500">
            Payment: {row.original.billingAddress?.paymentMethod || 'Card'} - {row.original.paymentStatus}
          </p>
        </div>
      ),
    },
    {
      header: "Payment",
      accessorKey: "paymentStatus",
      cell: ({ row }: any) => (
        <Badge variant={row.original.paymentStatus === 'paid' ? 'default' : 'secondary'}>
          {row.original.paymentStatus}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => (
        <Select
          value={row.original.status}
          onValueChange={(status) => 
            updateStatusMutation.mutate({ id: row.original.id, status })
          }
        >
          <SelectTrigger className="w-32">
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
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => {
              setSelectedOrderId(row.original.id);
              setIsOrderDetailsOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {(row.original.status === 'paid' || row.original.status === 'pending' || row.original.status === 'processing') && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedOrderForTracking(row.original.id);
                setIsTrackingDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600"
              title="Ship this order"
            >
              <Truck className="w-4 h-4" />
            </Button>
          )}
          {row.original.status === 'shipped' && (
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 px-2 py-1">
              <Truck className="w-3 h-3 mr-1" />
              Shipped
            </Badge>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete this order permanently"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to permanently delete order #{row.original.orderNumber}? 
                  This action cannot be undone and will remove all order data including items and customer information.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteOrderMutation.mutate(row.original.id)}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleteOrderMutation.isPending}
                >
                  {deleteOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Order'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  const totalPages = ordersData ? Math.ceil(ordersData.total / pageSize) : 0;

  // Show order details if one is selected
  if (isOrderDetailsOpen && selectedOrderId) {
    return (
      <OrderDetails 
        orderId={selectedOrderId} 
        onClose={() => {
          setIsOrderDetailsOpen(false);
          setSelectedOrderId(null);
        }}
      />
    );
  }

  return (
    <div className="p-6">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Orders Management</h2>
              <p className="text-gray-600">Track and manage customer orders</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Package className="w-4 h-4 mr-2" />
                Export Orders
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search orders by order number or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={filteredOrders}
          loading={isLoading}
          pagination={{
            pageIndex: page,
            pageSize,
            totalPages,
            totalItems: ordersData?.total || 0,
            onPageChange: setPage,
          }}
        />
      </Card>

      {/* Australia Post Tracking Dialog */}
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Ship Order with Australia Post
            </DialogTitle>
          </DialogHeader>

          
          <Form {...trackingForm}>
            <form onSubmit={trackingForm.handleSubmit((data) => {
              if (selectedOrderForTracking) {
                addTrackingMutation.mutate({
                  orderId: selectedOrderForTracking,
                  trackingNumber: data.trackingNumber
                });
              }
            })} className="space-y-4">
              <FormField
                control={trackingForm.control}
                name="trackingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Australia Post Tracking Number
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter 12-digit number (e.g. 997172053728)" 
                        {...field}
                        maxLength={12}
                        className="font-mono text-center text-lg tracking-wider"
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-xs text-gray-500 mt-1">
                      This will automatically update the order status to "shipped" and send a tracking email to the customer.
                    </div>
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsTrackingDialogOpen(false);
                    trackingForm.reset();
                  }}
                  disabled={addTrackingMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addTrackingMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {addTrackingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Shipping...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4 mr-2" />
                      Ship Order
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}