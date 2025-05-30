import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import DataTable from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Upload, Plus, Search, Edit, Trash2, Image, FolderPlus, X } from "lucide-react";

export default function Products() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentFolder, setCurrentFolder] = useState("root");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", { search, categoryId: selectedCategory, brandId: selectedBrand, limit: pageSize, offset: page * pageSize }],
    queryFn: () => api.admin.products.getAll({
      search: search || undefined,
      categoryId: selectedCategory === "all" ? undefined : selectedCategory || undefined,
      brandId: selectedBrand === "all" ? undefined : selectedBrand || undefined,
      limit: pageSize,
      offset: page * pageSize,
    }),
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
    queryFn: () => apiRequest(`/api/admin/media?folder=${currentFolder}`),
  });

  const createProductMutation = useMutation({
    mutationFn: api.admin.products.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      setIsAddProductOpen(false);
      form.reset();
      setSelectedImages([]);
      toast({ title: "Product created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `${Date.now()}-${file.name}`,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
          folder: currentFolder,
          alt: "",
        }),
      });
      return response.json();
    },
    onSuccess: (newFile) => {
      refetchMedia();
      setSelectedImages(prev => [...prev, newFile]);
      toast({ title: "File uploaded successfully" });
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
    console.log('onSubmit called with data:', data);
    console.log('Form errors:', form.formState.errors);
    console.log('Form is valid:', form.formState.isValid);
    console.log('Selected images:', selectedImages);
    
    // Generate slug from product name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const productData = {
      ...data,
      slug,
      images: selectedImages.map(img => img.url),
      // Map form field names to database field names
      isFeatured: data.featured,
      isActive: data.active,
    };
    
    // Remove the old field names
    delete productData.featured;
    delete productData.active;
    
    console.log('Final product data to submit:', productData);
    console.log('About to call mutation...');
    createProductMutation.mutate(productData);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        uploadFileMutation.mutate(file);
      }
    });
  }, [uploadFileMutation]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        uploadFileMutation.mutate(file);
      }
    });
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

  const columns = [
    {
      header: "",
      accessorKey: "select",
      cell: () => <Checkbox />,
    },
    {
      header: "Product",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-3">
          <img 
            src={row.original.images?.[0] || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=60&h=60&fit=crop&crop=center"}
            alt={row.original.name}
            className="w-12 h-12 object-cover rounded-lg"
          />
          <div>
            <p className="font-medium text-gray-900">{row.original.name}</p>
            <p className="text-sm text-gray-600">SKU: {row.original.sku}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "categoryId",
      cell: ({ row }: any) => {
        const category = categories?.find(c => c.id === row.original.categoryId);
        return <span className="text-gray-600">{category?.name || "—"}</span>;
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
        return (
          <span className={isLowStock ? "text-red-600 font-medium" : ""}>
            {stock}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }: any) => {
        const isActive = row.original.isActive;
        const stock = row.original.stockQuantity;
        const isLowStock = stock <= row.original.lowStockThreshold;
        
        return (
          <Badge 
            variant={
              !isActive ? "secondary" : 
              isLowStock ? "destructive" : 
              "default"
            }
          >
            {!isActive ? "Inactive" : isLowStock ? "Low Stock" : "Active"}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" className="p-1">
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="p-1 text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
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
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
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
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-9 text-sm">
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

                        {/* Weight and Toggles Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
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
                                    className="h-9"
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
                          <FormField
                            control={form.control}
                            name="featured"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="text-sm">Featured</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="text-sm">Active</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>

                      {/* Product Images Section - Simplified */}
                      <div className="space-y-3">
                        <FormLabel className="text-sm">Product Images</FormLabel>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Folder Selection */}
                          <div>
                            <FormLabel className="text-xs text-gray-600">Select Folder</FormLabel>
                            <Select value={currentFolder} onValueChange={setCurrentFolder}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Choose folder" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="root">Root Folder</SelectItem>
                                {mediaData?.folders?.map((folder: any) => (
                                  <SelectItem key={folder.id} value={folder.id}>
                                    📁 {folder.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Selected Images Count */}
                          <div className="flex items-end">
                            <p className="text-xs text-gray-600">
                              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                            </p>
                          </div>
                        </div>

                        {/* Drag & Drop Upload Zone */}
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                            isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                          <p className="text-xs text-gray-600 mb-2">
                            Drag & drop images here to upload to <strong>{currentFolder === 'root' ? 'Root Folder' : mediaData?.folders?.find((f: any) => f.id === currentFolder)?.name || 'Selected Folder'}</strong>
                          </p>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload-product"
                          />
                          <label htmlFor="file-upload-product">
                            <Button type="button" variant="outline" size="sm" asChild>
                              <span className="text-xs">Browse Files</span>
                            </Button>
                          </label>
                        </div>

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

                        {/* Existing Images in Selected Folder */}
                        {mediaData?.files?.filter((file: any) => file.mimeType.startsWith('image/')).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-700">Available in {currentFolder === 'root' ? 'Root Folder' : mediaData?.folders?.find((f: any) => f.id === currentFolder)?.name}:</p>
                            <div className="grid grid-cols-8 gap-1 max-h-20 overflow-auto">
                              {mediaData.files.filter((file: any) => file.mimeType.startsWith('image/')).map((image: any) => (
                                <button
                                  key={image.id}
                                  type="button"
                                  className={`relative border rounded overflow-hidden hover:border-blue-500 ${
                                    selectedImages.find(img => img.id === image.id) ? 'border-blue-500 ring-1 ring-blue-200' : ''
                                  }`}
                                  onClick={() => selectImage(image)}
                                  title={image.originalName}
                                >
                                  <img 
                                    src={image.url} 
                                    alt={image.alt || image.originalName}
                                    className="w-full h-10 object-cover"
                                  />
                                </button>
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
                {categories?.map((category) => (
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
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
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
      </Card>
    </div>
  );
}
