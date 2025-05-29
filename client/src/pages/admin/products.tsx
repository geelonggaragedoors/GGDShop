import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import DataTable from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { Upload, Plus, Search, Edit, Trash2 } from "lucide-react";

export default function Products() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);

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
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
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
