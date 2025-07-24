import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import DataTable from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Upload, Plus, Search, Edit, Trash2, Image, FolderPlus, X } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { ProductImport } from "@/components/admin/ProductImport";
import ProductCatalogExport from "@/components/admin/ProductCatalogExport";

export default function Products() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [showNoWeight, setShowNoWeight] = useState(false);
  const [showWithWeight, setShowWithWeight] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);

  const [currentFolder, setCurrentFolder] = useState("root");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [useCustomShipping, setUseCustomShipping] = useState(false);
  const [customShippingPrice, setCustomShippingPrice] = useState(0);
  const [suggestedBox, setSuggestedBox] = useState<{id: string, name: string, cost: number, note?: string} | null>(null);
  const [shippingType, setShippingType] = useState<'satchel' | 'box' | ''>('');
  const { toast } = useToast();

  // Function to suggest Australia Post box based on dimensions
  const suggestAustraliaPostBox = (length: number, width: number, height: number, weight: number, currentShippingType?: string) => {
    const typeToUse = currentShippingType || shippingType;
    if (!length || !width || !height || !weight || !typeToUse) {
      setSuggestedBox(null);
      return;
    }

    // Satchel options (up to 5kg) - only if satchel type is selected
    if (typeToUse === 'satchel' && weight <= 5) {
      if (length <= 35.5 && width <= 22.5 && height <= 2) {
        setSuggestedBox({
          id: 'satchel-small',
          name: 'Small Satchel',
          cost: 11.30,
          note: 'Flat rate up to 5kg'
        });
        return;
      }
      if (length <= 39 && width <= 27 && height <= 2) {
        setSuggestedBox({
          id: 'satchel-medium',
          name: 'Medium Satchel',
          cost: 15.30,
          note: 'Flat rate up to 5kg'
        });
        return;
      }
      if (length <= 40.5 && width <= 31.5 && height <= 2) {
        setSuggestedBox({
          id: 'satchel-large',
          name: 'Large Satchel',
          cost: 19.35,
          note: 'Flat rate up to 5kg'
        });
        return;
      }
      if (length <= 51 && width <= 44 && height <= 2) {
        setSuggestedBox({
          id: 'satchel-extra-large',
          name: 'Extra Large Satchel',
          cost: 23.35,
          note: 'Flat rate up to 5kg'
        });
        return;
      }
    }

    // Box options (weight-based pricing) - only if box type is selected
    if (typeToUse === 'box' && length <= 20 && width <= 15 && height <= 10) {
      const estimatedCost = Math.max(8.95, weight * 3.50); // Base rate + weight (already in kg)
      setSuggestedBox({
        id: 'box-small',
        name: 'Small Box',
        cost: estimatedCost,
        note: 'Weight-based pricing'
      });
      return;
    }
    if (typeToUse === 'box' && length <= 30 && width <= 25 && height <= 15) {
      const estimatedCost = Math.max(12.95, weight * 4.50); // Weight already in kg
      setSuggestedBox({
        id: 'box-medium',
        name: 'Medium Box',
        cost: estimatedCost,
        note: 'Weight-based pricing'
      });
      return;
    }
    if (typeToUse === 'box' && length <= 40 && width <= 30 && height <= 20) {
      const estimatedCost = Math.max(16.95, weight * 5.50); // Weight already in kg
      setSuggestedBox({
        id: 'box-large',
        name: 'Large Box',
        cost: estimatedCost,
        note: 'Weight-based pricing'
      });
      return;
    }

    // If no standard size fits, suggest custom shipping or alternative
    if (typeToUse === 'satchel' && weight > 5) {
      setSuggestedBox({
        id: 'suggest-box',
        name: 'Consider Box Shipping Instead',
        cost: 0,
        note: 'Item too heavy for satchel (over 5kg)'
      });
    } else {
      setSuggestedBox({
        id: 'custom',
        name: 'Custom Shipping Required',
        cost: 0,
        note: 'Oversized - requires freight quote'
      });
    }
  };

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/admin/products", { search, categoryId: selectedCategory, brandId: selectedBrand, noWeight: showNoWeight, hasWeight: showWithWeight, limit: pageSize, offset: page * pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory && selectedCategory !== 'all') params.append('categoryId', selectedCategory);
      if (selectedBrand && selectedBrand !== 'all') params.append('brandId', selectedBrand);
      if (showNoWeight) params.append('noWeight', 'true');
      if (showWithWeight) params.append('hasWeight', 'true');
      params.append('limit', pageSize.toString());
      params.append('offset', (page * pageSize).toString());
      
      const response = await fetch(`/api/admin/products?${params}`);
      return response.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: api.categories.getAll,
  });

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
    queryFn: api.brands.getAll,
  });

  const { data: mediaData, refetch: refetchMedia } = useQuery({
    queryKey: ["/api/admin/media", currentFolder],
    queryFn: () => fetch(`/api/admin/media?folder=${currentFolder}`).then(res => res.json()),
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating product with data:", data);
      try {
        const response = await api.admin.products.create(data);
        console.log("Product creation response:", response);
        return response;
      } catch (error) {
        console.error("Product creation failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/counts"] });
      setIsAddProductOpen(false);
      form.reset();
      setSelectedImages([]);
      toast({ title: "Product created successfully" });
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast({ title: "FAILED TO CREATE PRODUCT", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.admin.products.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/counts"] });
      // Close dialog and reset all state
      closeEditDialog();
      toast({ title: "Product updated successfully" });
    },
    onError: (error: any) => {
      console.error("Update product error:", error);
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; parent: string }) => {
      const response = await fetch("/api/admin/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      refetchMedia();
      setShowFolderInput(false);
      setNewFolderName("");
      toast({ title: "Folder created successfully" });
    },
  });



  const bulkImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const products = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const product: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index];
          if (header === 'price' || header === 'stockQuantity' || header === 'weight' || 
              header === 'height' || header === 'width' || header === 'length') {
            product[header] = value ? parseFloat(value) : 0;
          } else if (header === 'featured' || header === 'active') {
            product[header] = value === 'true';
          } else {
            product[header] = value || '';
          }
        });
        
        // Generate slug from name
        if (product.name) {
          product.slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        
        return product;
      });

      return apiRequest('POST', '/api/admin/products/bulk', { products });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      setIsBulkImportOpen(false);
      toast({ title: "Products imported successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      return apiRequest('POST', '/api/admin/products/bulk-delete', { productIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      setSelectedProducts([]);
      toast({ title: "Products deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'published' | 'draft' }) => {
      return apiRequest('PATCH', `/api/admin/products/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({ title: "Product status updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleFreePostageMutation = useMutation({
    mutationFn: async ({ id, freePostage }: { id: string; freePostage: boolean }) => {
      return apiRequest('PATCH', `/api/admin/products/${id}/free-postage`, { freePostage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({ title: "Free postage updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSingleProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest('DELETE', `/api/admin/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      categoryId: "",
      brandId: "",
      sku: "",
      stockQuantity: 0,
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      boxSize: "",
      customShippingPrice: 0,
      shippingNote: "",
      isFeatured: false,
      isActive: true,
      alwaysInStock: true,
      freePostage: false,
    },
  });

  const onSubmit = (data: any) => {
    console.log('=== FORM SUBMISSION START ===');
    console.log('Form data:', data);
    console.log('Form errors:', form.formState.errors);
    console.log('Form is valid:', form.formState.isValid);
    console.log('Selected images:', selectedImages);
    console.log('Editing product:', editingProduct?.id);
    
    // Check for validation errors
    if (!form.formState.isValid) {
      console.error('Form validation failed:', form.formState.errors);
      return;
    }
    
    // Auto-generate slug from product name when the form submits
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const productData = {
      ...data,
      slug,
      images: selectedImages.map(img => img.url),
    };
    
    console.log('Final product data to submit:', productData);
    
    if (editingProduct) {
      console.log('Calling UPDATE mutation for product ID:', editingProduct.id);
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      console.log('Calling CREATE mutation');
      createProductMutation.mutate(productData);
    }
    console.log('=== FORM SUBMISSION END ===');
  };



  const createFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate({
        name: newFolderName.trim(),
        parent: currentFolder,
      });
    }
  };

  const selectImage = (image: any) => {
    if (!selectedImages.find(img => img.id === image.id)) {
      setSelectedImages(prev => [...prev, image]);
    }
  };

  const removeSelectedImage = (imageId: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setIsEditProductOpen(true);
    setSuggestedBox(null); // Reset suggestion state
    setShippingType(''); // Reset shipping type selection
    setUseCustomShipping(Boolean(product.customShippingPrice));
    setCustomShippingPrice(product.customShippingPrice || 0);
    
    // Pre-populate form with existing product data
    form.reset({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      categoryId: product.categoryId || "",
      brandId: product.brandId || "",
      sku: product.sku || "",
      stockQuantity: product.stockQuantity || 0,
      weight: typeof product.weight === 'string' ? parseFloat(product.weight) : (product.weight || 0),
      length: typeof product.length === 'string' ? parseFloat(product.length) : (product.length || 0),
      width: typeof product.width === 'string' ? parseFloat(product.width) : (product.width || 0),
      height: typeof product.height === 'string' ? parseFloat(product.height) : (product.height || 0),
      boxSize: product.boxSize || "",
      customShippingPrice: typeof product.customShippingPrice === 'string' ? parseFloat(product.customShippingPrice) : (product.customShippingPrice || 0),
      shippingNote: product.shippingNote || "",
      isFeatured: Boolean(product.isFeatured),
      isActive: Boolean(product.isActive),
      alwaysInStock: Boolean(product.alwaysInStock),
      freePostage: Boolean(product.freePostage),
    });
    
    // Pre-populate selected images if they exist
    if (product.images && product.images.length > 0) {
      const imageObjects = product.images.map((url: string, index: number) => ({
        id: `existing-${index}`,
        url: url,
        filename: `Image ${index + 1}`,
      }));
      setSelectedImages(imageObjects);
    } else {
      setSelectedImages([]);
    }
  };

  const closeEditDialog = () => {
    setIsEditProductOpen(false);
    setEditingProduct(null);
    form.reset();
    setSelectedImages([]);
    setSuggestedBox(null); // Reset suggestion state
    setShippingType(''); // Reset shipping type
    setUseCustomShipping(false);
    setCustomShippingPrice(0);
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(productsData?.products?.map((p: any) => p.id) || []);
    } else {
      setSelectedProducts([]);
    }
  };

  const columns = [
    {
      header: (
        <Checkbox
          checked={selectedProducts.length === productsData?.products?.length && productsData?.products?.length > 0}
          onCheckedChange={handleSelectAll}
        />
      ),
      accessorKey: "select",
      cell: ({ row }: any) => (
        <Checkbox
          checked={selectedProducts.includes(row.original.id)}
          onCheckedChange={(checked) => handleSelectProduct(row.original.id, Boolean(checked))}
        />
      ),
    },
    {
      header: "Product",
      accessorKey: "name",
      cell: ({ row }: any) => {
        const product = row.original;
        const firstImage = Array.isArray(product.images) && product.images.length > 0 
          ? product.images[0] 
          : "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=60&h=60&fit=crop&crop=center";
        
        return (
          <div className="flex items-center space-x-3">
            <img 
              src={firstImage}
              alt={product.name}
              className="w-12 h-12 object-cover rounded-lg"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                e.currentTarget.src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=60&h=60&fit=crop&crop=center";
              }}
            />
            <div>
              <p className="font-medium text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Category",
      accessorKey: "categoryId",
      cell: ({ row }: any) => {
        const category = categories?.find((c: any) => c.id === row.original.categoryId);
        return <span className="text-gray-600">{category?.name || "—"}</span>;
      },
    },
    {
      header: "Brand",
      accessorKey: "brandId",
      cell: ({ row }: any) => {
        const brand = brands?.find((b: any) => b.id === row.original.brandId);
        return <span className="text-gray-600">{brand?.name || "—"}</span>;
      },
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: ({ row }: any) => (
        <span className="font-semibold">${row.original.price}</span>
      ),
    },
    {
      header: "Stock",
      accessorKey: "stockQuantity",
      cell: ({ row }: any) => {
        const stock = row.original.stockQuantity;
        const isLowStock = stock <= row.original.lowStockThreshold;
        const alwaysInStock = row.original.alwaysInStock;
        
        if (alwaysInStock) {
          return (
            <div className="flex items-center space-x-1">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Always In Stock
              </Badge>
            </div>
          );
        }
        
        return (
          <span className={isLowStock ? "text-red-600 font-medium" : ""}>
            {stock}
          </span>
        );
      },
    },
    {
      header: "Publication",
      accessorKey: "status",
      cell: ({ row }: any) => {
        const status = row.original.status || 'draft';
        return (
          <Badge variant={status === 'published' ? 'default' : 'secondary'}>
            {status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }: any) => {
        const isActive = row.original.isActive;
        const stock = row.original.stockQuantity;
        const alwaysInStock = row.original.alwaysInStock;
        const isLowStock = stock <= row.original.lowStockThreshold;
        
        return (
          <Badge 
            variant={
              !isActive ? "secondary" : 
              (alwaysInStock || !isLowStock) ? "default" : 
              "destructive"
            }
          >
            {!isActive ? "Inactive" : (alwaysInStock || !isLowStock) ? "Active" : "Low Stock"}
          </Badge>
        );
      },
    },
    {
      header: "Shipping",
      accessorKey: "freePostage",
      cell: ({ row }: any) => {
        const freePostage = row.original.freePostage;
        return (
          <Badge variant={freePostage ? "default" : "outline"}>
            {freePostage ? "Free" : "Calculated"}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: any) => {
        const product = row.original;
        const isPublished = product.status === 'published';
        
        return (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-1"
              onClick={() => openEditDialog(product)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className={`p-1 ${isPublished ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}`}
              onClick={() => togglePublishMutation.mutate({ 
                id: product.id, 
                status: isPublished ? 'draft' : 'published' 
              })}
              disabled={togglePublishMutation.isPending}
            >
              {isPublished ? '📝' : '🚀'}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className={`p-1 ${product.freePostage ? 'text-blue-600 hover:text-blue-700' : 'text-gray-600 hover:text-gray-700'}`}
              onClick={() => toggleFreePostageMutation.mutate({ 
                id: product.id, 
                freePostage: !product.freePostage 
              })}
              disabled={toggleFreePostageMutation.isPending}
              title={product.freePostage ? 'Remove free postage' : 'Add free postage'}
            >
              {product.freePostage ? '🚚' : '💰'}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-1 text-red-600 hover:text-red-700"
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
                  deleteSingleProductMutation.mutate(product.id);
                }
              }}
              disabled={deleteSingleProductMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const totalPages = productsData ? Math.ceil(productsData.total / pageSize) : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Products Management</h2>
              <p className="text-gray-600">Manage your garage door inventory</p>
            </div>
            <div className="flex space-x-3">
              <ProductCatalogExport />
              <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Import Products from WooCommerce</DialogTitle>
                  </DialogHeader>
                  <ProductImport />
                </DialogContent>
              </Dialog>
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* 3-Column Layout for Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Product Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Sectional Garage Door" className="h-9" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">SKU</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="GGD-SEC-001" className="h-9" />
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
                                <FormLabel className="text-sm">Price (Inc. GST)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="1599.00" 
                                    className="h-9"
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500">
                                  GST inclusive price (e.g. $1599.00 inc. GST)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Description - Full Width */}
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={2} placeholder="High-quality sectional garage door with insulation and remote control access..." className="text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* 3-Column Layout for Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <FormField
                            control={form.control}
                            name="stockQuantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Stock Quantity</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="25" 
                                    className="h-9"
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500">
                                  Current inventory count
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => {
                              const renderCategoryOptions = () => {
                                const parentCategories = categories?.filter((c: any) => !c.parentId) || [];
                                const options: JSX.Element[] = [];
                                
                                parentCategories.forEach((category: any) => {
                                  options.push(
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  );
                                  
                                  const subcategories = categories?.filter((sub: any) => sub.parentId === category.id) || [];
                                  subcategories.forEach((subcategory: any) => {
                                    options.push(
                                      <SelectItem key={subcategory.id} value={subcategory.id}>
                                        &nbsp;&nbsp;├─ {subcategory.name}
                                      </SelectItem>
                                    );
                                  });
                                });
                                
                                return options;
                              };
                              
                              return (
                                <FormItem>
                                  <FormLabel className="text-sm">Category</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {renderCategoryOptions()}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription className="text-xs text-gray-500">
                                    Choose main category or subcategory
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                          <FormField
                            control={form.control}
                            name="brandId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Brand</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-9 text-sm">
                                      <SelectValue placeholder="Select brand" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {brands?.map((brand: any) => (
                                      <SelectItem key={brand.id} value={brand.id}>
                                        {brand.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Weight */}
                        <FormField
                          control={form.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Weight (kg)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  placeholder="85.5" 
                                  className="max-w-[200px]"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500">
                                For shipping calculations (e.g. 85.5 kg)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Stock Management & Product Status */}
                        <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                          <h4 className="text-sm font-semibold text-gray-900">Stock Management & Product Status</h4>
                          
                          {/* Stock Quantity */}
                          <FormField
                            control={form.control}
                            name="stockQuantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stock Quantity</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    placeholder="e.g., 25"
                                    className="max-w-[200px]"
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Product Status Toggles */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField
                              control={form.control}
                              name="alwaysInStock"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm font-medium">
                                      Always in Stock
                                    </FormLabel>
                                    <FormDescription className="text-xs">
                                      Shows "In Stock" regardless of quantity
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="isFeatured"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm font-medium">Featured</FormLabel>
                                    <FormDescription className="text-xs">
                                      Show on homepage
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm font-medium">Active</FormLabel>
                                    <FormDescription className="text-xs">
                                      Visible to customers
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="freePostage"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm font-medium">Free Postage</FormLabel>
                                    <FormDescription className="text-xs">
                                      Override shipping costs
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                      {/* Product Images Section */}
                      <div className="space-y-3">
                        <FormLabel className="text-sm">Product Images</FormLabel>
                        
                        <div className="text-xs text-gray-600 mb-2">
                          {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                        </div>

                        {/* Local File Upload Zone */}
                        <FileUpload
                          multiple
                          onUpload={(files) => {
                            const newImages = files.map(file => ({
                              id: file.filename,
                              url: file.url,
                              originalName: file.originalName,
                              alt: file.originalName,
                              filename: file.filename,
                              size: file.size
                            }));
                            setSelectedImages(prev => [...prev, ...newImages]);
                            toast({
                              title: "Upload successful",
                              description: `${files.length} image(s) uploaded successfully`,
                            });
                          }}
                          onRemove={(url) => {
                            setSelectedImages(prev => prev.filter(img => img.url !== url));
                          }}
                          currentFiles={selectedImages.map(img => ({
                            url: img.url,
                            filename: img.filename || img.originalName,
                            originalName: img.originalName || img.filename,
                            size: img.size || 0,
                            mimeType: 'image/*'
                          }))}
                        />

                        {/* Selected Images Preview */}
                        {selectedImages.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-700">Selected Images:</p>
                            <div className="grid grid-cols-6 gap-2">
                              {selectedImages.map((image) => (
                                <div key={image.id} className="relative group">
                                  <img 
                                    src={image.url} 
                                    alt={image.alt || image.originalName}
                                    className="w-full h-12 object-cover rounded border"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                    onClick={() => removeSelectedImage(image.id)}
                                  >
                                    <X className="h-2 w-2" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}


                      </div>
                      
                        <div className="flex space-x-2 pt-4">
                          <Button 
                            type="submit" 
                            disabled={createProductMutation.isPending}
                            onClick={(e) => {
                              console.log('Create Product button clicked!');
                              console.log('Form state:', form.formState);
                              console.log('Form errors:', form.formState.errors);
                              console.log('Form is valid:', form.formState.isValid);
                              console.log('Form values:', form.getValues());
                              
                              // Manually trigger validation to see what's wrong
                              form.trigger().then((isValid) => {
                                console.log('Manual validation result:', isValid);
                                console.log('Validation errors after trigger:', form.formState.errors);
                              });
                            }}
                          >
                            Create Product
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsAddProductOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Edit Product Dialog */}
              <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* 3-Column Layout for Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Sectional Garage Door" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SKU</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., SGD-001" />
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
                                <FormLabel>Price (GST Inc.)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    step="0.01"
                                    placeholder="e.g., 1550.00"
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Category and Brand Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => {
                              const renderCategoryOptions = () => {
                                const parentCategories = categories?.filter((c: any) => !c.parentId) || [];
                                const options: JSX.Element[] = [];
                                
                                parentCategories.forEach((category: any) => {
                                  options.push(
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  );
                                  
                                  const subcategories = categories?.filter((sub: any) => sub.parentId === category.id) || [];
                                  subcategories.forEach((subcategory: any) => {
                                    options.push(
                                      <SelectItem key={subcategory.id} value={subcategory.id}>
                                        &nbsp;&nbsp;├─ {subcategory.name}
                                      </SelectItem>
                                    );
                                  });
                                });
                                
                                return options;
                              };
                              
                              return (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {renderCategoryOptions()}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription className="text-xs text-gray-500">
                                    Choose main category or subcategory
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                          <FormField
                            control={form.control}
                            name="brandId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Brand</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select brand" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {brands?.map((brand: any) => (
                                      <SelectItem key={brand.id} value={brand.id}>
                                        {brand.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Description */}
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="e.g., High-quality sectional garage door with insulated panels, perfect for residential use..."
                                  className="min-h-[80px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Stock Management & Product Status */}
                        <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                          <h4 className="text-sm font-semibold text-gray-900">Stock Management & Product Status</h4>
                          
                          {/* Stock Quantity */}
                          <FormField
                            control={form.control}
                            name="stockQuantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stock Quantity</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    placeholder="e.g., 25"
                                    className="max-w-[200px]"
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Product Status Toggles */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField
                              control={form.control}
                              name="alwaysInStock"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm font-medium">
                                      Always in Stock
                                    </FormLabel>
                                    <FormDescription className="text-xs">
                                      Shows "In Stock" regardless of quantity
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="isFeatured"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm font-medium">Featured</FormLabel>
                                    <FormDescription className="text-xs">
                                      Show on homepage
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm font-medium">Active</FormLabel>
                                    <FormDescription className="text-xs">
                                      Visible to customers
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="freePostage"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm font-medium">Free Postage</FormLabel>
                                    <FormDescription className="text-xs">
                                      Override shipping costs
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Shipping and Measurements Section */}
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Shipping & Measurements</h4>
                          
                          {/* Shipping Type Selection */}
                          <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">📦 Select Shipping Type First</label>
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                type="button"
                                variant={shippingType === 'satchel' ? 'default' : 'outline'}
                                className={`h-auto p-4 ${shippingType === 'satchel' ? 'bg-blue-600 text-white' : 'border-gray-300'}`}
                                onClick={() => {
                                  setShippingType('satchel');
                                  setSuggestedBox(null);
                                  // Re-trigger suggestion if measurements exist
                                  const length = form.getValues('length') || 0;
                                  const width = form.getValues('width') || 0;
                                  const height = form.getValues('height') || 0;
                                  const weight = (form.getValues('weight') || 0) / 1000; // Convert grams to kg
                                  if (length && width && height && weight) {
                                    suggestAustraliaPostBox(length, width, height, weight, 'satchel');
                                  }
                                }}
                              >
                                <div className="text-center">
                                  <div className="text-lg font-semibold">📮 Satchel</div>
                                  <div className="text-xs mt-1">Flat items up to 5kg</div>
                                  <div className="text-xs text-gray-500">Fixed pricing</div>
                                </div>
                              </Button>
                              <Button
                                type="button"
                                variant={shippingType === 'box' ? 'default' : 'outline'}
                                className={`h-auto p-4 ${shippingType === 'box' ? 'bg-blue-600 text-white' : 'border-gray-300'}`}
                                onClick={() => {
                                  setShippingType('box');
                                  setSuggestedBox(null);
                                  // Re-trigger suggestion if measurements exist
                                  const length = form.getValues('length') || 0;
                                  const width = form.getValues('width') || 0;
                                  const height = form.getValues('height') || 0;
                                  const weight = (form.getValues('weight') || 0) / 1000; // Convert grams to kg
                                  if (length && width && height && weight) {
                                    suggestAustraliaPostBox(length, width, height, weight, 'box');
                                  }
                                }}
                              >
                                <div className="text-center">
                                  <div className="text-lg font-semibold">📦 Box</div>
                                  <div className="text-xs mt-1">Bulky items, any weight</div>
                                  <div className="text-xs text-gray-500">Weight-based pricing</div>
                                </div>
                              </Button>
                            </div>
                          </div>
                          
                          {/* Product Dimensions */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                            <FormField
                              control={form.control}
                              name="length"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Length (cm)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      step="0.1"
                                      placeholder="e.g., 30.5"
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        field.onChange(value);
                                        // Trigger suggestion when dimensions change
                                        const width = form.getValues('width') || 0;
                                        const height = form.getValues('height') || 0;
                                        const weight = (form.getValues('weight') || 0) / 1000; // Convert grams to kg
                                        suggestAustraliaPostBox(value, width, height, weight);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="width"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Width (cm)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      step="0.1"
                                      placeholder="e.g., 25.0"
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        field.onChange(value);
                                        // Trigger suggestion when dimensions change
                                        const length = form.getValues('length') || 0;
                                        const height = form.getValues('height') || 0;
                                        const weight = (form.getValues('weight') || 0) / 1000; // Convert grams to kg
                                        suggestAustraliaPostBox(length, value, height, weight);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="height"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Height (cm)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      step="0.1"
                                      placeholder="e.g., 15.0"
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        field.onChange(value);
                                        // Trigger suggestion when dimensions change
                                        const length = form.getValues('length') || 0;
                                        const width = form.getValues('width') || 0;
                                        const weight = (form.getValues('weight') || 0) / 1000; // Convert grams to kg
                                        suggestAustraliaPostBox(length, width, value, weight);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="weight"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Weight (grams)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      step="1"
                                      placeholder="e.g., 5000"
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        field.onChange(value);
                                        // Trigger suggestion when weight changes
                                        const length = form.getValues('length') || 0;
                                        const width = form.getValues('width') || 0;
                                        const height = form.getValues('height') || 0;
                                        suggestAustraliaPostBox(length, width, height, value / 1000); // Convert grams to kg
                                      }}
                                    />
                                  </FormControl>
                                  <FormDescription className="text-xs">Product weight for shipping calculations</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Suggested Box Display */}
                          {suggestedBox && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                              <h5 className="text-sm font-medium text-green-800 mb-2">🚛 Australia Post Suggestion</h5>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-green-900">{suggestedBox.name}</p>
                                  <p className="text-xs text-green-700">{suggestedBox.note}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-900">
                                    ${suggestedBox.cost.toFixed(2)}
                                  </p>
                                  {suggestedBox.id !== 'custom' && suggestedBox.id !== 'suggest-box' && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="text-green-700 border-green-300 hover:bg-green-100 mt-1"
                                      onClick={() => {
                                        form.setValue('boxSize', suggestedBox.id);
                                        // Only enable custom shipping for oversized items
                                        if (suggestedBox.id === 'custom') {
                                          setUseCustomShipping(true);
                                          form.setValue('customShippingPrice', 0);
                                          setCustomShippingPrice(0);
                                        } else {
                                          // Standard Australia Post option - disable custom shipping
                                          setUseCustomShipping(false);
                                          form.setValue('customShippingPrice', 0);
                                          setCustomShippingPrice(0);
                                        }
                                        toast({
                                          title: "Box size selected",
                                          description: `${suggestedBox.name} selected with $${suggestedBox.cost.toFixed(2)} shipping cost`
                                        });
                                      }}
                                    >
                                      Select This Box
                                    </Button>
                                  )}
                                  {suggestedBox.id === 'suggest-box' && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="text-blue-700 border-blue-300 hover:bg-blue-100 mt-1"
                                      onClick={() => {
                                        setShippingType('box');
                                        setSuggestedBox(null);
                                        toast({
                                          title: "Switched to box shipping",
                                          description: "Now select box measurements for this heavier item"
                                        });
                                      }}
                                    >
                                      Switch to Box
                                    </Button>
                                  )}
                                  {suggestedBox.id === 'custom' && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="text-orange-700 border-orange-300 hover:bg-orange-100 mt-1"
                                      onClick={() => {
                                        setUseCustomShipping(true);
                                        form.setValue('boxSize', '');
                                        toast({
                                          title: "Custom shipping enabled",
                                          description: "Please set custom shipping price below"
                                        });
                                      }}
                                    >
                                      Use Custom Shipping
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}



                          {/* Custom Shipping Option */}
                          <div className="border border-orange-200 bg-orange-50 rounded-md p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Checkbox 
                                checked={useCustomShipping}
                                onCheckedChange={(checked) => setUseCustomShipping(Boolean(checked))}
                              />
                              <label className="text-sm font-medium text-orange-800">
                                Use Custom Shipping Price (for oversized items)
                              </label>
                            </div>
                            {useCustomShipping && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <FormLabel>Custom Shipping Price (AUD)</FormLabel>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="e.g., 45.00"
                                    value={customShippingPrice || ''}
                                    onChange={(e) => {
                                      const price = parseFloat(e.target.value) || 0;
                                      setCustomShippingPrice(price);
                                      form.setValue('customShippingPrice', price);
                                    }}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Fixed shipping cost for this product
                                  </p>
                                </div>
                                <div>
                                  <FormLabel>Shipping Note</FormLabel>
                                  <Input 
                                    placeholder="e.g., Call for freight quote"
                                    onChange={(e) => form.setValue('shippingNote', e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Display note about special shipping requirements
                                  </p>
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-orange-700 mt-2">
                              <strong>Note:</strong> If no suitable Australia Post option exists, customers will see "Call (03) 5221 8999 for shipping quote" message.
                            </p>
                          </div>
                        </div>



                      {/* Product Images Section - Simplified */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel>Product Images</FormLabel>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowFolderInput(!showFolderInput)}
                            >
                              <FolderPlus className="w-4 h-4 mr-1" />
                              New Folder
                            </Button>
                          </div>
                        </div>

                        {showFolderInput && (
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Folder name"
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                            />
                            <Button
                              type="button"
                              onClick={() => createFolderMutation.mutate({ name: newFolderName, parent: currentFolder })}
                              disabled={!newFolderName.trim()}
                            >
                              Create
                            </Button>
                          </div>
                        )}



                        {/* Local File Upload Zone */}
                        <FileUpload
                          multiple
                          onUpload={(files) => {
                            const newImages = files.map(file => ({
                              id: file.filename,
                              url: file.url,
                              originalName: file.originalName,
                              alt: file.originalName,
                              filename: file.filename,
                              size: file.size
                            }));
                            setSelectedImages(prev => [...prev, ...newImages]);
                            toast({
                              title: "Upload successful",
                              description: `${files.length} image(s) uploaded successfully`,
                            });
                          }}
                          onRemove={(url) => {
                            setSelectedImages(prev => prev.filter(img => img.url !== url));
                          }}
                          currentFiles={selectedImages.map(img => ({
                            url: img.url,
                            filename: img.filename || img.originalName,
                            originalName: img.originalName || img.filename,
                            size: img.size || 0,
                            mimeType: 'image/*'
                          }))}
                        />

                        {/* Selected Images Display */}
                        {selectedImages.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Selected Images ({selectedImages.length})</p>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                              {selectedImages.map((image) => (
                                <div key={image.id} className="relative group">
                                  <img
                                    src={image.url}
                                    alt={image.filename}
                                    className="w-full h-16 object-cover rounded border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeSelectedImage(image.id)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Media Library */}
                        {mediaData && (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Media Library - {currentFolder === "root" ? "Root" : currentFolder}
                            </p>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                              {mediaData.files?.map((file: any) => (
                                <button
                                  key={file.id}
                                  type="button"
                                  onClick={() => selectImage(file)}
                                  className="relative group hover:ring-2 hover:ring-blue-500 rounded transition-all"
                                >
                                  <img
                                    src={file.url}
                                    alt={file.filename}
                                    className="w-full h-16 object-cover rounded border"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                                    <span className="text-white text-xs opacity-0 group-hover:opacity-100">Select</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                        <div className="flex space-x-2 pt-4">
                          <Button 
                            type="submit" 
                            disabled={updateProductMutation.isPending}
                            onClick={() => {
                              console.log('Update button clicked');
                              console.log('Form errors:', form.formState.errors);
                              console.log('Form is valid:', form.formState.isValid);
                              console.log('Form dirty fields:', form.formState.dirtyFields);
                            }}
                          >
                            {updateProductMutation.isPending ? "Updating..." : "Update Product"}
                          </Button>
                          <Button type="button" variant="outline" onClick={closeEditDialog}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands?.map((brand: any) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noWeight"
                  checked={showNoWeight}
                  onCheckedChange={(checked) => {
                    setShowNoWeight(Boolean(checked));
                    if (checked) setShowWithWeight(false); // Ensure mutually exclusive
                  }}
                />
                <label
                  htmlFor="noWeight"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  No Weight
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasWeight"
                  checked={showWithWeight}
                  onCheckedChange={(checked) => {
                    setShowWithWeight(Boolean(checked));
                    if (checked) setShowNoWeight(false); // Ensure mutually exclusive
                  }}
                />
                <label
                  htmlFor="hasWeight"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Has Weight
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProducts([])}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete ${selectedProducts.length} selected products?`)) {
                      bulkDeleteMutation.mutate(selectedProducts);
                    }
                  }}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Upload className="w-4 h-4 mr-2" />
              Download CSV Template
            </Button>
            
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  bulkImportMutation.mutate(file);
                }
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

      {/* Products Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Products</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkImportOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
              <Button 
                size="sm"
                onClick={() => setIsAddProductOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={productsData?.products || []}
            loading={productsLoading}
            pagination={{
              pageIndex: page,
              pageSize,
              totalPages,
              totalItems: productsData?.total || 0,
              onPageChange: setPage,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
