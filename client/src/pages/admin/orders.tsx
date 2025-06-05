import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DataTable from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Search, Eye, Edit, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
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

  const filteredOrders = ordersData?.orders?.filter(order =>
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
      cell: ({ row }: any) => (
        <div>
          <p className="text-sm text-gray-900">{row.original.shippingAddress}</p>
          <p className="text-sm text-gray-600">
            {row.original.shippingCity}, {row.original.shippingState} {row.original.shippingPostcode}
          </p>
        </div>
      ),
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
            Payment: {row.original.paymentMethod} - {row.original.paymentStatus}
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
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedOrder(row.original)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Order Details - #{selectedOrder?.orderNumber}</DialogTitle>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Customer Information</h4>
                      <p>{selectedOrder.customerEmail}</p>
                      {selectedOrder.shippingAddress && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Shipping Address:</p>
                          <p>{selectedOrder.shippingAddress.address1}</p>
                          {selectedOrder.shippingAddress.address2 && (
                            <p>{selectedOrder.shippingAddress.address2}</p>
                          )}
                          <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postcode}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Order Summary</h4>
                      <p>Subtotal: {formatCurrency(selectedOrder.subtotal)}</p>
                      <p>Shipping: {formatCurrency(selectedOrder.shippingCost || 0)}</p>
                      <p>Tax: {formatCurrency(selectedOrder.taxAmount || 0)}</p>
                      <p className="font-semibold">Total: {formatCurrency(selectedOrder.total)}</p>
                    </div>
                  </div>
                  {selectedOrder.notes && (
                    <div>
                      <h4 className="font-semibold mb-2">Notes</h4>
                      <p className="text-gray-600">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      ),
    },
  ];

  const totalPages = ordersData ? Math.ceil(ordersData.total / pageSize) : 0;

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
    </div>
  );
}