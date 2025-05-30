import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
    const productData = {
      ...data,
      images: selectedImages.map(img => img.url),
    };
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          name="sku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price ($)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="stockQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stock Quantity</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FormField
                          control={form.control}
                          name="brandId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Brand</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.1" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Product Images Section - Reorganized for better space usage */}
                      <div className="space-y-3">
                        <FormLabel>Product Images</FormLabel>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Left Column: Upload & Selected Images */}
                          <div className="space-y-3">
                            {/* Drag & Drop Upload Zone - Compact */}
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
                                Drag & drop or browse
                              </p>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-upload"
                              />
                              <label htmlFor="file-upload">
                                <Button type="button" variant="outline" size="sm" asChild>
                                  <span className="text-xs">Browse Files</span>
                                </Button>
                              </label>
                            </div>

                            {/* Selected Images Display - Compact */}
                            {selectedImages.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-gray-600">Selected ({selectedImages.length})</p>
                                <div className="grid grid-cols-4 gap-1">
                                  {selectedImages.map((image) => (
                                    <div key={image.id} className="relative group">
                                      <img 
                                        src={image.url} 
                                        alt={image.alt || image.originalName}
                                        className="w-full h-16 object-cover rounded border"
                                      />
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-0 right-0 h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
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

                          {/* Right Column: Media Library Browser - Compact */}
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium">Media Library</p>
                              {showFolderInput ? (
                                <div className="flex space-x-1">
                                  <Input
                                    placeholder="Folder name"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    className="h-6 text-xs w-20"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={createFolder}
                                    disabled={!newFolderName.trim()}
                                  >
                                    Add
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2"
                                  onClick={() => setShowFolderInput(true)}
                                >
                                  <FolderPlus className="h-3 w-3" />
                                </Button>
                              )}
                            </div>

                            <div className="max-h-32 overflow-auto">
                              {/* Folders - Compact Grid */}
                              {mediaData?.folders && mediaData.folders.length > 0 && (
                                <div className="grid grid-cols-3 gap-1 mb-2">
                                  {mediaData.folders.map((folder: any) => (
                                    <button
                                      key={folder.id}
                                      type="button"
                                      className="p-1 border rounded text-xs hover:bg-gray-50 flex flex-col items-center"
                                      onClick={() => setCurrentFolder(folder.id)}
                                    >
                                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                                        📁
                                      </div>
                                      <span className="truncate w-full text-xs">{folder.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Back button for subfolders */}
                              {currentFolder !== "root" && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="mb-2 h-6 text-xs"
                                  onClick={() => setCurrentFolder("root")}
                                >
                                  ← Back
                                </Button>
                              )}

                              {/* Images - Compact Grid */}
                              <div className="grid grid-cols-3 gap-1">
                                {mediaData?.files?.filter((file: any) => file.mimeType.startsWith('image/')).map((image: any) => (
                                  <button
                                    key={image.id}
                                    type="button"
                                    className={`relative border rounded overflow-hidden hover:border-blue-500 ${
                                      selectedImages.find(img => img.id === image.id) ? 'border-blue-500 ring-1 ring-blue-200' : ''
                                    }`}
                                    onClick={() => selectImage(image)}
                                  >
                                    <img 
                                      src={image.url} 
                                      alt={image.alt || image.originalName}
                                      className="w-full h-12 object-cover"
                                    />
                                  </button>
                                ))}
                              </div>

                              {(!mediaData?.files || mediaData.files.length === 0) && (
                                <div className="text-center py-4 text-gray-500 text-xs">
                                  No images in this folder
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <FormField
                          control={form.control}
                          name="featured"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel>Featured Product</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="active"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel>Active</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                        <div className="flex space-x-2 pt-4">
                          <Button type="submit" disabled={createProductMutation.isPending}>
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
