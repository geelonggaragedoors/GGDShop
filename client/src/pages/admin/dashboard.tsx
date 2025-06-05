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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue?.toLocaleString() || '0'}`}
          icon={DollarSign}
          description="Total sales revenue"
        />
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          description="Orders this month"
        />
        <StatsCard
          title="Products"
          value={counts?.products || 0}
          icon={Package}
          description="Active products"
        />
        <StatsCard
          title="Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          description="Registered customers"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
              <Button variant="link" size="sm" className="text-primary">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats?.recentOrders?.slice(0, 5).map((order: any) => (
                <Link key={order.id} to={`/admin/orders/${order.id}`}>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg px-2 -mx-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{order.customerName || order.customerEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${order.total}</p>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )) || (
                <p className="text-center text-gray-500 py-8">No orders found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Top Products</CardTitle>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats?.topProducts?.slice(0, 5).map((product: any) => (
                <Link key={product.id} to={`/products/${product.slug || product.id}`}>
                  <div className="flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors rounded-lg px-2 py-2 -mx-2">
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
                </Link>
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
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Add Product */}
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center p-3 h-16 w-full"
              onClick={() => setIsAddProductOpen(true)}
            >
              <Plus className="w-4 h-4 text-primary mb-1" />
              <span className="text-xs font-medium">Add Product</span>
            </Button>

            {/* Bulk Import */}
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center p-3 h-16 w-full"
              onClick={() => setIsBulkImportOpen(true)}
            >
              <Upload className="w-4 h-4 text-primary mb-1" />
              <span className="text-xs font-medium">Bulk Import</span>
            </Button>

            {/* Export Data */}
            <Button variant="outline" className="flex flex-col items-center justify-center p-3 h-16 w-full" onClick={handleExportData}>
              <Download className="w-4 h-4 text-primary mb-1" />
              <span className="text-xs font-medium">Export Data</span>
            </Button>

            {/* Settings */}
            <Button variant="outline" className="flex flex-col items-center justify-center p-3 h-16 w-full" onClick={() => setLocation('/admin/settings')}>
              <Settings className="w-4 h-4 text-primary mb-1" />
              <span className="text-xs font-medium">Settings</span>
            </Button>
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
                        {categories?.map((category: any) => (
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