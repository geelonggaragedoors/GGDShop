import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import DataTable from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema } from "@shared/schema";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = insertCategorySchema.extend({
  slug: z.string().min(1, "Slug is required"),
  parentId: z.string().optional().nullable().or(z.literal("none")),
});

export default function Categories() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const { toast } = useToast();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/admin/categories"],
    queryFn: api.admin.categories.getAll,
  });

  const createMutation = useMutation({
    mutationFn: api.admin.categories.create,
    onSuccess: () => {
      // Invalidate all category-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey.some(key => typeof key === 'string' && key.includes('categories'))
      });
      setIsCreateOpen(false);
      form.reset();
      toast({ title: "Category created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.admin.categories.update(id, data),
    onSuccess: () => {
      // Invalidate all category-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey.some(key => typeof key === 'string' && key.includes('categories'))
      });
      setEditingCategory(null);
      form.reset();
      toast({ title: "Category updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.admin.categories.delete,
    onSuccess: () => {
      // Invalidate all category-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey.some(key => typeof key === 'string' && key.includes('categories'))
      });
      toast({ title: "Category deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
      parentId: "none",
      sortOrder: 0,
      isActive: true,
    },
  });

  const onSubmit = (data: any) => {
    console.log('Form data before processing:', data);
    
    // Convert "none" to null for parentId
    const submissionData = {
      ...data,
      parentId: data.parentId === "none" ? null : data.parentId || null
    };
    
    console.log('Submission data after processing:', submissionData);
    
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: submissionData });
    } else {
      createMutation.mutate(submissionData);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    form.setValue('name', name);
    if (!editingCategory) {
      form.setValue('slug', generateSlug(name));
    }
  };

  const openEditDialog = (category: any) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      parentId: category.parentId || "none",
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive,
    });
  };

  const closeDialog = () => {
    setIsCreateOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }: any) => {
        const category = row.original;
        const parentCategory = categories?.find((c: any) => c.id === category.parentId);
        return (
          <div>
            <p className="font-medium text-gray-900">
              {category.parentId ? `├─ ${category.name}` : category.name}
            </p>
            <p className="text-sm text-gray-500">
              /{category.slug}
              {parentCategory && (
                <span className="ml-2 text-blue-600">
                  (under {parentCategory.name})
                </span>
              )}
            </p>
          </div>
        );
      },
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: ({ row }: any) => (
        <p className="text-gray-600 max-w-xs truncate">
          {row.original.description || "—"}
        </p>
      ),
    },
    {
      header: "Image",
      accessorKey: "image",
      cell: ({ row }: any) => (
        <div className="flex items-center">
          {row.original.image ? (
            <img 
              src={row.original.image} 
              alt={row.original.name}
              className="w-12 h-12 object-cover rounded border"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Products",
      accessorKey: "productCount",
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <Badge variant="outline" className="text-sm">
            {row.original.productCount || 0}
          </Badge>
        </div>
      ),
    },
    {
      header: "Sort Order",
      accessorKey: "sortOrder",
      cell: ({ row }: any) => (
        <span className="text-gray-600">{row.original.sortOrder || 0}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }: any) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" onClick={() => openEditDialog(row.original)}>
            <Edit className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                <AlertDialogDescription>
                  {row.original.productCount > 0 ? (
                    <div className="space-y-2">
                      <p>This category contains <strong>{row.original.productCount} product(s)</strong>.</p>
                      <p className="text-amber-600">You must remove or move all products from this category before it can be deleted.</p>
                    </div>
                  ) : (
                    <p>Are you sure you want to delete the category <strong>"{row.original.name}"</strong>? This action cannot be undone.</p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                {row.original.productCount === 0 && (
                  <AlertDialogAction 
                    onClick={() => deleteMutation.mutate(row.original.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Categories Management</h2>
              <p className="text-gray-600">Organize your product categories</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
            
            <Dialog open={isCreateOpen || !!editingCategory} onOpenChange={(open) => {
              if (!open) closeDialog();
            }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Edit Category" : "Create New Category"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              onChange={(e) => handleNameChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select parent category (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None (Main Category)</SelectItem>
                              {categories?.filter((c: any) => !c.parentId && (!editingCategory || c.id !== editingCategory.id)).map((category: any) => (
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
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="https://example.com/image.jpg"
                              type="url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sort Order</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Active</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex space-x-2 pt-4">
                      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {editingCategory ? "Update" : "Create"}
                      </Button>
                      <Button type="button" variant="outline" onClick={closeDialog}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={filteredCategories}
          loading={isLoading}
        />
      </Card>
    </div>
  );
}