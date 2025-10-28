import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Edit, GripVertical, Eye, EyeOff, ChevronRight, Link as LinkIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface MenuItem {
  id: string;
  label: string;
  type: "category" | "custom" | "group";
  categoryId: string | null;
  customUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function MenuManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  
  const [formData, setFormData] = useState({
    label: "",
    type: "category" as "category" | "custom" | "group",
    categoryId: "",
    customUrl: "",
    parentId: "",
    sortOrder: 0,
    isVisible: true,
  });

  // Fetch menu items
  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/admin/menu-items"],
  });

  // Fetch categories for the dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Create menu item mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = {
        label: data.label,
        type: data.type,
        sortOrder: data.sortOrder,
        isVisible: data.isVisible,
      };

      if (data.type === "category" && data.categoryId) {
        payload.categoryId = data.categoryId;
      } else if (data.type === "custom" && data.customUrl) {
        payload.customUrl = data.customUrl;
      }

      if (data.parentId) {
        payload.parentId = data.parentId;
      }

      return apiRequest("POST", "/api/admin/menu-items", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      toast({
        title: "Success",
        description: "Menu item created successfully",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create menu item",
        variant: "destructive",
      });
    },
  });

  // Update menu item mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const payload: any = {
        label: data.label,
        type: data.type,
        sortOrder: data.sortOrder,
        isVisible: data.isVisible,
      };

      if (data.type === "category" && data.categoryId) {
        payload.categoryId = data.categoryId;
        payload.customUrl = null;
      } else if (data.type === "custom" && data.customUrl) {
        payload.customUrl = data.customUrl;
        payload.categoryId = null;
      } else if (data.type === "group") {
        payload.categoryId = null;
        payload.customUrl = null;
      }

      if (data.parentId) {
        payload.parentId = data.parentId;
      } else {
        payload.parentId = null;
      }

      return apiRequest("PUT", `/api/admin/menu-items/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update menu item",
        variant: "destructive",
      });
    },
  });

  // Delete menu item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/menu-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete menu item",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      label: "",
      type: "category",
      categoryId: "",
      customUrl: "",
      parentId: "",
      sortOrder: 0,
      isVisible: true,
    });
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      type: item.type,
      categoryId: item.categoryId || "",
      customUrl: item.customUrl || "",
      parentId: item.parentId || "",
      sortOrder: item.sortOrder,
      isVisible: item.isVisible,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label) {
      toast({
        title: "Error",
        description: "Label is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "category" && !formData.categoryId) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "custom" && !formData.customUrl) {
      toast({
        title: "Error",
        description: "Custom URL is required",
        variant: "destructive",
      });
      return;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (item: MenuItem) => {
    setDeletingItem(item);
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteMutation.mutate(deletingItem.id);
    }
  };

  // Group menu items by parent
  const topLevelItems = menuItems.filter(item => !item.parentId);
  const getChildItems = (parentId: string) => {
    return menuItems.filter(item => item.parentId === parentId);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Unknown Category";
  };

  const MenuItemRow = ({ item, level = 0 }: { item: MenuItem; level?: number }) => {
    const children = getChildItems(item.id);
    const hasChildren = children.length > 0;

    return (
      <>
        <div
          className="flex items-center gap-2 p-3 hover:bg-gray-50 border-b"
          style={{ paddingLeft: `${level * 2 + 1}rem` }}
        >
          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
          
          {hasChildren && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.label}</span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {item.type}
              </span>
              {item.type === "category" && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" />
                  {getCategoryName(item.categoryId)}
                </span>
              )}
              {item.type === "custom" && (
                <span className="text-xs text-gray-500">{item.customUrl}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {item.isVisible ? (
              <Eye className="w-4 h-4 text-green-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(item)}
              data-testid={`button-edit-menu-${item.id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(item)}
              data-testid={`button-delete-menu-${item.id}`}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
        
        {children.map(child => (
          <MenuItemRow key={child.id} item={child} level={level + 1} />
        ))}
      </>
    );
  };

  if (menuLoading) {
    return <div className="p-6">Loading menu items...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Menu Manager</h1>
          <p className="text-gray-500 mt-1">
            Customize your navigation menu without changing category URLs
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-menu-item">
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </DialogTitle>
              <DialogDescription>
                Create a custom navigation menu item
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Doors, Motors & Openers"
                  data-testid="input-menu-label"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="select-menu-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">Category Link</SelectItem>
                    <SelectItem value="group">Group (Dropdown Header)</SelectItem>
                    <SelectItem value="custom">Custom URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "category" && (
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.type === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customUrl">Custom URL *</Label>
                  <Input
                    id="customUrl"
                    value={formData.customUrl}
                    onChange={(e) => setFormData({ ...formData, customUrl: e.target.value })}
                    placeholder="/special-page"
                    data-testid="input-custom-url"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="parent">Parent Menu Item (Optional)</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger data-testid="select-parent">
                    <SelectValue placeholder="Top level (no parent)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Top level (no parent)</SelectItem>
                    {topLevelItems
                      .filter(item => !editingItem || item.id !== editingItem.id)
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  data-testid="input-sort-order"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isVisible"
                  checked={formData.isVisible}
                  onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                  data-testid="switch-visible"
                />
                <Label htmlFor="isVisible">Visible in menu</Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-menu-item"
                >
                  {editingItem ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>
            Drag to reorder. All your category URLs stay the same for SEO.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {menuItems.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No menu items yet. Click "Add Menu Item" to get started.
            </div>
          ) : (
            <div className="divide-y">
              {topLevelItems.map(item => (
                <MenuItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the menu item "{deletingItem?.label}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
