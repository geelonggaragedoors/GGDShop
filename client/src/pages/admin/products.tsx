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
import { UploadButton } from "@/lib/uploadthing";

export default function Products() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentFolder, setCurrentFolder] = useState("root");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/admin/products", { search, categoryId: selectedCategory, brandId: selectedBrand, limit: pageSize, offset: page * pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory && selectedCategory !== 'all') params.append('categoryId', selectedCategory);
      if (selectedBrand && selectedBrand !== 'all') params.append('brandId', selectedBrand);
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

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.admin.products.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      setIsEditProductOpen(false);
      setEditingProduct(null);
      form.reset();
      setSelectedImages([]);
      toast({ title: "Product updated successfully" });
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
      // Convert file to base64 for storage
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `${Date.now()}-${file.name}`,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: base64, // Store base64 instead of blob URL
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
      isFeatured: false,
      isActive: true,
    },
  });

  const onSubmit = (data: any) => {
    console.log('onSubmit called with data:', data);
    console.log('Form errors:', form.formState.errors);
    console.log('Form is valid:', form.formState.isValid);
    console.log('Selected images:', selectedImages);
    console.log('Editing product:', editingProduct);
    
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
    console.log('About to call mutation...');
    
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createProductMutation.mutate(productData);
    }
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

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setIsEditProductOpen(true);
    
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
      isFeatured: product.isFeatured || false,
      isActive: product.isActive !== false,
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
          <Button 
            size="sm" 
            variant="ghost" 
            className="p-1"
            onClick={() => openEditDialog(row.original)}
          >
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
                            name="isFeatured"
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
                            name="isActive"
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

                      {/* Product Images Section */}
                      <div className="space-y-3">
                        <FormLabel className="text-sm">Product Images</FormLabel>
                        
                        <div className="text-xs text-gray-600 mb-2">
                          {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                        </div>

                        {/* UploadThing Upload Zone */}
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                          <p className="text-xs text-gray-600 mb-3">
                            Upload product images
                          </p>
                          <UploadButton
                            endpoint="imageUploader"
                            onClientUploadComplete={(res) => {
                              if (res && res.length > 0) {
                                const newImages = res.map(file => ({
                                  id: file.key || Math.random().toString(),
                                  url: file.url,
                                  originalName: file.name,
                                  alt: file.name
                                }));
                                setSelectedImages(prev => [...prev, ...newImages]);
                                toast({
                                  title: "Upload successful",
                                  description: `${res.length} image(s) uploaded successfully`,
                                });
                              }
                            }}
                            onUploadError={(error: Error) => {
                              console.error("Upload error:", error);
                              toast({
                                title: "Upload failed",
                                description: error.message,
                                variant: "destructive",
                              });
                            }}
                            appearance={{
                              button: "ut-ready:bg-blue-500 ut-ready:bg-opacity-100 ut-uploading:cursor-not-allowed ut-uploading:bg-blue-500/50 bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-600",
                              container: "flex flex-col items-center",
                              allowedContent: "text-xs text-gray-500 mt-1"
                            }}
                          />
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

                        {/* Stock, Weight and Toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
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
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                                    placeholder="e.g., 25000"
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">Product weight in grams for shipping</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Australia Post Shipping Box Selection */}
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Australia Post Standard Box Selection</h4>
                          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                            <div className="text-sm text-green-800">
                              <p className="font-medium mb-2">Australia Post Box Selection:</p>
                              <p className="text-xs mb-2">Select a standard box size. Box price and shipping costs will be calculated automatically including 10% GST.</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                <div><strong>Bx1:</strong> $3.50 - 22×16×7.7cm</div>
                                <div><strong>Bx2:</strong> $4.25 - 31×22.5×10.2cm</div>
                                <div><strong>Bx3:</strong> $5.75 - 40×20×18cm</div>
                                <div><strong>Bx4:</strong> $6.25 - 43×30.5×14cm</div>
                                <div><strong>Bx5:</strong> $8.50 - 40.5×30×25.5cm</div>
                                <div><strong>Bx6:</strong> $2.75 - 22×14.5×3.5cm</div>
                              </div>
                              <p className="text-xs mt-2 font-medium">
                                If product is too large for standard boxes, customers will be asked to call (03) 5221 8999 for custom shipping quote.
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="weight"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Product Weight (grams)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      step="1"
                                      placeholder="e.g., 5000"
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormDescription className="text-xs">Weight of the product in grams</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div>
                              <FormLabel>Australia Post Box Size</FormLabel>
                              <Select onValueChange={(value) => {
                                form.setValue('boxSize', value);
                                // Auto-fill dimensions based on selected box
                                const boxDimensions: Record<string, { length: number; width: number; height: number }> = {
                                  'Bx1': { length: 22, width: 16, height: 7.7 },
                                  'Bx2': { length: 31, width: 22.5, height: 10.2 },
                                  'Bx3': { length: 40, width: 20, height: 18 },
                                  'Bx4': { length: 43, width: 30.5, height: 14 },
                                  'Bx5': { length: 40.5, width: 30, height: 25.5 },
                                  'Bx6': { length: 22, width: 14.5, height: 3.5 },
                                  'Bx7': { length: 14.5, width: 12.7, height: 1 },
                                  'Bx8': { length: 36.3, width: 21.2, height: 6.5 },
                                };
                                if (boxDimensions[value]) {
                                  form.setValue('length', boxDimensions[value].length);
                                  form.setValue('width', boxDimensions[value].width);
                                  form.setValue('height', boxDimensions[value].height);
                                }
                              }} value={form.getValues('boxSize') || ''}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select standard box size" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Bx1">Bx1 - $3.50 - 22×16×7.7cm (Small)</SelectItem>
                                  <SelectItem value="Bx2">Bx2 - $4.25 - 31×22.5×10.2cm (Medium)</SelectItem>
                                  <SelectItem value="Bx3">Bx3 - $5.75 - 40×20×18cm (Long)</SelectItem>
                                  <SelectItem value="Bx4">Bx4 - $6.25 - 43×30.5×14cm (Wide)</SelectItem>
                                  <SelectItem value="Bx5">Bx5 - $8.50 - 40.5×30×25.5cm (Large)</SelectItem>
                                  <SelectItem value="Bx6">Bx6 - $2.75 - 22×14.5×3.5cm (Flat)</SelectItem>
                                  <SelectItem value="Bx7">Bx7 - $1.95 - 14.5×12.7×1cm (Very Flat)</SelectItem>
                                  <SelectItem value="Bx8">Bx8 - $4.95 - 36.3×21.2×6.5cm (ToughPak)</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-1">
                                Box price will be added to shipping cost automatically
                              </p>
                            </div>
                          </div>
                          
                          {/* Hidden dimension fields that get auto-populated */}
                          <div className="hidden">
                            <FormField control={form.control} name="length" render={({ field }) => <Input {...field} />} />
                            <FormField control={form.control} name="width" render={({ field }) => <Input {...field} />} />
                            <FormField control={form.control} name="height" render={({ field }) => <Input {...field} />} />
                          </div>
                        </div>

                        {/* Product Status Toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="isFeatured"
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
                            name="isActive"
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



                        {/* UploadThing Upload Zone */}
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                          <p className="text-xs text-gray-600 mb-3">
                            Upload additional product images
                          </p>
                          <UploadButton
                            endpoint="imageUploader"
                            onClientUploadComplete={(res) => {
                              if (res && res.length > 0) {
                                const newImages = res.map(file => ({
                                  id: file.key || Math.random().toString(),
                                  url: file.url,
                                  originalName: file.name,
                                  alt: file.name,
                                  filename: file.name
                                }));
                                setSelectedImages(prev => [...prev, ...newImages]);
                                toast({
                                  title: "Upload successful",
                                  description: `${res.length} image(s) uploaded successfully`,
                                });
                              }
                            }}
                            onUploadError={(error: Error) => {
                              console.error("Upload error:", error);
                              toast({
                                title: "Upload failed",
                                description: error.message,
                                variant: "destructive",
                              });
                            }}
                            appearance={{
                              button: "ut-ready:bg-blue-500 ut-ready:bg-opacity-100 ut-uploading:cursor-not-allowed ut-uploading:bg-blue-500/50 bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-600",
                              container: "flex flex-col items-center",
                              allowedContent: "text-xs text-gray-500 mt-1"
                            }}
                          />
                        </div>

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
