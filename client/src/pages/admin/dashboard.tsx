import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Plus,
  Upload,
  Download,
  Settings,
  Receipt,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    queryFn: api.admin.dashboard.getStats,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue?.toLocaleString() || '0'}`}
          trend="+12.5% from last month"
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders?.toString() || '0'}
          trend="+8.2% from last month"
          icon={ShoppingCart}
          iconColor="text-primary"
          iconBg="bg-blue-100"
        />
        <StatsCard
          title="Active Products"
          value={stats?.activeProducts?.toString() || '0'}
          trend="3 out of stock"
          icon={Package}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatsCard
          title="Total Customers"
          value={stats?.totalCustomers?.toString() || '0'}
          trend="+15.3% from last month"
          icon={Users}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
              <Button variant="link" size="sm" className="text-primary">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats?.recentOrders?.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.customerEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.total}</p>
                    <Badge 
                      variant={
                        order.status === 'completed' ? 'default' : 
                        order.status === 'processing' ? 'secondary' : 
                        'outline'
                      }
                      className="text-xs"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              )) || (
                <p className="text-center text-gray-500 py-8">No orders found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Top Products</CardTitle>
              <Button variant="link" size="sm" className="text-primary">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats?.topProducts?.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={product.images?.[0] || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop&crop=center"} 
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${product.revenue?.toLocaleString()}</p>
                  </div>
                </div>
              )) || (
                <p className="text-center text-gray-500 py-8">No products found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="flex items-center p-4 h-auto justify-start">
              <Plus className="w-5 h-5 text-primary mr-3" />
              <span className="font-medium">Add Product</span>
            </Button>
            <Button variant="outline" className="flex items-center p-4 h-auto justify-start">
              <Upload className="w-5 h-5 text-primary mr-3" />
              <span className="font-medium">Bulk Import</span>
            </Button>
            <Button variant="outline" className="flex items-center p-4 h-auto justify-start">
              <Download className="w-5 h-5 text-primary mr-3" />
              <span className="font-medium">Export Data</span>
            </Button>
            <Button variant="outline" className="flex items-center p-4 h-auto justify-start">
              <Settings className="w-5 h-5 text-primary mr-3" />
              <span className="font-medium">Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
