import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Grid, List, Star, ShoppingCart } from "lucide-react";
import { api } from "@/lib/api";
import StorefrontHeader from "@/components/storefront/header";
import StorefrontFooter from "@/components/storefront/footer";

export default function Products() {
  const [match, params] = useRoute("/products/:categorySlug?");
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: api.categories.getAll,
  });

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
    queryFn: api.brands.getAll,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", { search, categoryId: selectedCategory, brandId: selectedBrand, limit: pageSize, offset: page * pageSize }],
    queryFn: () => api.products.getAll({
      search: search || undefined,
      categoryId: selectedCategory === "all" ? undefined : selectedCategory || undefined,
      brandId: selectedBrand === "all" ? undefined : selectedBrand || undefined,
      limit: pageSize,
      offset: page * pageSize,
    }),
  });

  // Set category from URL parameter
  useEffect(() => {
    if (params?.categorySlug && categories) {
      const category = categories.find((cat: any) => cat.slug === params.categorySlug);
      if (category) {
        setSelectedCategory(category.id);
      }
    }
  }, [params?.categorySlug, categories]);

  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;
  const totalPages = Math.ceil(totalProducts / pageSize);

  const filteredCategories = categories?.filter((cat: any) => !cat.parentId) || [];
  const activeBrands = brands?.filter((brand: any) => brand.isActive) || [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(price);
  };

  const getProductImage = (product: any) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StorefrontHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {params?.categorySlug ? 
              categories?.find((cat: any) => cat.slug === params.categorySlug)?.name || "Products" 
              : "All Products"
            }
          </h1>
          <p className="text-gray-600">
            Discover our range of quality garage doors and accessories
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Search</h3>
                <div className="relative">
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {filteredCategories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Brands</h3>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Brands</SelectItem>
                    {activeBrands.map((brand: any) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {totalProducts} products found
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex border rounded-md">
                  <Button
                    size="sm"
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "list" ? "default" : "ghost"}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products */}
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {products.map((product: any) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                    {viewMode === "grid" ? (
                      <>
                        <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.shortDescription || product.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">
                              {formatPrice(parseFloat(product.price))}
                            </span>
                            <Button size="sm">
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Add to Cart
                            </Button>
                          </div>
                          {product.isFeatured && (
                            <Badge className="mt-2">Featured</Badge>
                          )}
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="p-4">
                        <div className="flex space-x-4">
                          <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={getProductImage(product)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {product.shortDescription || product.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(parseFloat(product.price))}
                              </span>
                              <Button size="sm">
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNum = page < 3 ? i : page - 2 + i;
                    if (pageNum >= totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    disabled={page === totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <StorefrontFooter />
    </div>
  );
}