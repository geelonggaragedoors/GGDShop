import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsCard from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { getFirstImage, handleImageError } from "@/lib/imageUtils";
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
  ImageIcon,
} from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/dashboard"],
  });

  const { data: counts } = useQuery({
    queryKey: ["/api/admin/counts"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
  });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => api.admin.products.create(data),
    onSuccess: () => {
      setIsAddProductOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/counts"] });
      toast({ title: "Product created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      brandId: "",
      sku: "",
      stockQuantity: 0,
      weight: 0,
      featured: false,
      active: true,
    },
  });

  const onSubmit = (data: any) => {
    createProductMutation.mutate(data);
  };

  const handleExportData = async () => {
    try {
      const products = await api.admin.products.getAll({});
      const orders = await api.admin.orders.getAll({});
      const customers = await api.admin.customers.getAll();
      
      const exportData = {
        products: products.products,
        orders: orders.orders,
        customers,
        exportedAt: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geelong-garage-doors-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Data exported successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
    }
  };

  const handleBulkImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const products = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const product: any = {};
          
          headers.forEach((header, index) => {
            const value = values[index];
            if (value !== undefined && value !== '') {
              if (header === 'price' || header === 'stockQuantity' || header === 'weight' || 
                  header === 'height' || header === 'width' || header === 'length') {
                product[header] = parseFloat(value) || 0;
              } else if (header === 'featured' || header === 'active') {
                product[header] = value.toLowerCase() === 'true';
              } else {
                product[header] = value;
              }
            }
          });
          
          if (product.name && product.sku && product.price && product.categoryId) {
            products.push(product);
          }
        }
        
        if (products.length > 0) {
          // Call bulk import API
          fetch('/api/admin/products/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products }),
          }).then(res => res.json()).then(result => {
            if (result.success) {
              toast({ 
                title: "Bulk import completed", 
                description: `${result.created} products imported, ${result.errors} errors` 
              });
              queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
              setIsBulkImportOpen(false);
            } else {
              toast({ title: "Error", description: "Failed to import products", variant: "destructive" });
            }
          });
        } else {
          toast({ title: "Error", description: "No valid products found in CSV", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to parse CSV file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 px-6 pt-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`$${(stats as any)?.totalRevenue?.toLocaleString() || '0'}`}
          icon={DollarSign}
          description="Total sales revenue"
          iconColor="text-white"
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <StatsCard
          title="Total Orders"
          value={(stats as any)?.totalOrders || 0}
          icon={ShoppingCart}
          description="Orders this month"
          iconColor="text-white"
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatsCard
          title="Products"
          value={(counts as any)?.products || 0}
          icon={Package}
          description="Active products"
          iconColor="text-white"
          iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatsCard
          title="Customers"
          value={(stats as any)?.totalCustomers || 0}
          icon={Users}
          description="Registered customers"
          iconColor="text-white"
          iconBg="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setLocation('/admin/orders')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {(stats as any)?.recentOrders?.slice(0, 5).map((order: any) => (
                <div 
                  key={order.id} 
                  className="p-4 hover:bg-blue-50/50 cursor-pointer transition-all duration-200 group"
                  onClick={() => setLocation(`/admin/orders`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Receipt className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{order.customerName || order.customerEmail}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">${order.total}</p>
                      <Badge 
                        variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'outline'}
                        className="capitalize"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="p-8 text-center">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No orders found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-semibold">Top Products</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setLocation('/admin/products')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {(stats as any)?.topProducts?.slice(0, 5).map((product: any) => (
                <div 
                  key={product.id} 
                  className="p-4 hover:bg-purple-50/50 cursor-pointer transition-all duration-200 group"
                  onClick={() => setLocation(`/products/${product.slug || product.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 group-hover:scale-110 transition-transform">
                        <img 
                          src={getFirstImage(product.images, 'product')} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e, 'product')}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-1">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.sales} sales</p>
                        <p className="text-xs text-gray-500">Revenue: ${product.revenue?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No products found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Add Product */}
            <div 
              className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              onClick={() => setIsAddProductOpen(true)}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800 group-hover:text-emerald-900">Add Product</p>
                  <p className="text-xs text-emerald-600">Create new product</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
            </div>

            {/* Bulk Import */}
            <div 
              className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              onClick={() => setIsBulkImportOpen(true)}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-800 group-hover:text-blue-900">Bulk Import</p>
                  <p className="text-xs text-blue-600">Upload CSV file</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
            </div>

            {/* Export Data */}
            <div 
              className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              onClick={handleExportData}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-purple-800 group-hover:text-purple-900">Export Data</p>
                  <p className="text-xs text-purple-600">Download JSON</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
            </div>

            {/* Settings */}
            <div 
              className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              onClick={() => setLocation('/admin/settings')}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-orange-800 group-hover:text-orange-900">Settings</p>
                  <p className="text-xs text-orange-600">Configure system</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-200/30 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(categories as any)?.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex space-x-2 pt-4">
                <Button type="submit" disabled={createProductMutation.isPending}>
                  Add Product
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddProductOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Import Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Upload a CSV file with product data to import multiple products at once.</p>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                // Create CSV template
                const csvContent = `name,sku,price,categoryId,stockQuantity,description,weight,height,width,length,images,featured,active,seoTitle,seoDescription
"Premium Garage Door A1","GD-A1-001",899.99,"category-id-here",10,"High-quality steel garage door with insulation",50,2000,2400,50,"https://example.com/image1.jpg",true,true,"Premium Garage Door A1 - Best Quality","High-quality steel garage door with superior insulation and durability"
"Standard Garage Door B2","GD-B2-002",599.99,"category-id-here",25,"Standard aluminum garage door",35,2000,2400,40,"https://example.com/image2.jpg",false,true,"Standard Garage Door B2 - Affordable Option","Reliable aluminum garage door perfect for residential use"`;
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'product_import_template.csv';
                link.click();
                window.URL.revokeObjectURL(url);
              }}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV Template
            </Button>
            
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBulkImport(file);
              }}
            />
            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsBulkImportOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}