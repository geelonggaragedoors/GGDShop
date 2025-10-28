import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Grid, List, Star, ShoppingCart, Heart } from "lucide-react";
import { api } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { getOptimizedImageUrl, generateSrcSet, generateSizes } from "@/lib/image-optimizer";
import { ImageSkeleton } from "@/components/ui/image-skeleton";
import StorefrontHeader from "@/components/storefront/header";
import StorefrontFooter from "@/components/storefront/footer";
import { SEOHead } from "@/components/SEOHead";
import { analytics } from "@/lib/analytics";
import { generateItemListSchema, generateBreadcrumbSchema } from "@/lib/schema-generator";

export default function Products() {
  // Handle both /product-category/:categorySlug and /products routes
  const [categoryMatch, categoryParams] = useRoute("/product-category/:categorySlug");
  const [productsMatch] = useRoute("/products");
  const params = categoryMatch ? categoryParams : null;
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();

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
    const defaultImage = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
    let imageUrl = defaultImage;
    
    // Safe check for product images
    if (product && product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      if (firstImage && typeof firstImage === 'string' && firstImage.trim() !== '') {
        imageUrl = firstImage;
      }
    }
    
    return getOptimizedImageUrl(imageUrl, { width: 400, height: 300, quality: 85 });
  };

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart.`,
    });
  };

  const handleWishlistToggle = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    toast({
      title: isInWishlist(product.id) ? "Removed from wishlist" : "Added to wishlist",
      description: isInWishlist(product.id) 
        ? `${product.name} removed from your wishlist.`
        : `${product.name} added to your wishlist.`,
    });
  };

  // Determine page title and breadcrumbs based on route
  const currentCategory = params?.categorySlug 
    ? categories?.find((cat: any) => cat.slug === params.categorySlug) 
    : null;
  const pageTitle = currentCategory?.name || "All Products";

  // Generate schema.org structured data
  const itemListSchema = products.length > 0 
    ? generateItemListSchema(products as any, pageTitle, window.location.origin)
    : null;

  const breadcrumbSchema = generateBreadcrumbSchema(
    currentCategory 
      ? [
          { name: 'Home', url: '/' },
          { name: 'Products', url: '/products' },
          { name: currentCategory.name, url: `/product-category/${currentCategory.slug}` }
        ]
      : [
          { name: 'Home', url: '/' },
          { name: 'Products', url: '/products' }
        ],
    window.location.origin
  );

  const combinedSchema = itemListSchema 
    ? [itemListSchema, breadcrumbSchema]
    : [breadcrumbSchema];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={`${pageTitle} | Geelong Garage Doors`}
        description={`Shop ${pageTitle.toLowerCase()} at Geelong Garage Doors. Quality garage door parts and accessories with fast shipping across Australia.`}
        keywords={`${pageTitle}, garage door parts, garage door accessories, ${currentCategory?.name || 'garage doors'}`}
        canonicalUrl={currentCategory 
          ? `${window.location.origin}/product-category/${currentCategory.slug}`
          : `${window.location.origin}/products`
        }
        structuredData={combinedSchema}
      />
      <StorefrontHeader />
      
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm text-gray-600">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">
              {params?.categorySlug ? 
                categories?.find((cat: any) => cat.slug === params.categorySlug)?.name || "Products" 
                : "All Products"
              }
            </span>
          </nav>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            {params?.categorySlug ? 
              categories?.find((cat: any) => cat.slug === params.categorySlug)?.name || "Products" 
              : "All Products"
            }
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
            Discover our premium range of garage doors, parts, and accessories designed for durability and style
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <div className={`md:w-64 lg:w-72 xl:w-80 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Filter Products</h3>
              
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-primary focus:ring-primary"
                  />
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {filteredCategories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Brands */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {activeBrands.map((brand: any) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {(selectedCategory || selectedBrand || search) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedBrand("");
                    setSearch("");
                  }}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
                </span>
                {(selectedCategory || selectedBrand || search) && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 w-fit">
                    Filtered
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-40 border-gray-300">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="price">Price: Low to High</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex border border-gray-300 rounded-md w-fit">
                  <Button
                    size="sm"
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                    <span className="ml-1 hidden sm:inline">Grid</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "list" ? "default" : "ghost"}
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                    <span className="ml-1 hidden sm:inline">List</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Products */}
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
              <div className={viewMode === "grid" ? 
                "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" : 
                "space-y-4 sm:space-y-6"
              }>
                {products.map((product: any) => (
                  <div key={product.id} className="group">
                    {viewMode === "grid" ? (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {product.featured && (
                            <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                              <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs sm:text-sm">
                                Featured
                              </Badge>
                            </div>
                          )}
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className={`bg-white/90 backdrop-blur-sm h-8 w-8 p-0 ${isInWishlist(product.id) ? 'text-red-500 border-red-500' : ''}`}
                              onClick={(e) => handleWishlistToggle(product, e)}
                            >
                              <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 sm:p-4 lg:p-6">
                          <div className="mb-3">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg mb-1 line-clamp-2 leading-tight">
                              {product.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                              {product.shortDescription || product.description}
                            </p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                            <div>
                              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                                {formatPrice(parseFloat(product.price))}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-500 ml-1">inc. GST</span>
                            </div>
                            {product.alwaysInStock ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                In Stock
                              </span>
                            ) : product.stockQuantity > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                In Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Out of Stock
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <Link href={`/product/${product.slug}`}>
                              <Button 
                                variant="outline" 
                                className="w-full font-medium py-2 sm:py-3 text-sm"
                              >
                                View Details
                              </Button>
                            </Link>
                            <Button 
                              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 sm:py-3 text-sm"
                              disabled={!product.alwaysInStock && product.stockQuantity === 0}
                              onClick={(e) => handleAddToCart(product, e)}
                            >
                              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              {(!product.alwaysInStock && product.stockQuantity === 0) ? 'Out of Stock' : 'Add to Cart'}
                            </Button>
                          </div>
                        </div>
                        </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
                        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6">
                          <div className="w-full sm:w-24 lg:w-32 h-48 sm:h-24 lg:h-32 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={getProductImage(product)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                              <h3 className="font-semibold text-gray-900 text-lg sm:text-xl">
                                {product.name}
                              </h3>
                              {product.featured && (
                                <Badge className="bg-orange-500 hover:bg-orange-600 text-white w-fit">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm sm:text-base line-clamp-2 sm:line-clamp-3">
                              {product.shortDescription || product.description}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <div>
                                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {formatPrice(parseFloat(product.price))}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-1">inc. GST</span>
                                </div>
                                {product.alwaysInStock ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    In Stock
                                  </span>
                                ) : product.stockQuantity > 0 ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    In Stock
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Out of Stock
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Link href={`/product/${product.slug}`}>
                                  <Button 
                                    variant="outline" 
                                    className="font-medium px-4 sm:px-6 w-full sm:w-auto"
                                  >
                                    View Details
                                  </Button>
                                </Link>
                                <Button 
                                  className="bg-primary hover:bg-primary/90 text-white font-medium px-4 sm:px-6 w-full sm:w-auto"
                                  disabled={!product.alwaysInStock && product.stockQuantity === 0}
                                  onClick={(e) => handleAddToCart(product, e)}
                                >
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  {(!product.alwaysInStock && product.stockQuantity === 0) ? 'Out of Stock' : 'Add to Cart'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    className="px-4"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
                    const pageNum = page < 3 ? i : page - 3 + i;
                    if (pageNum >= totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 ${pageNum === page ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === totalPages - 1}
                    onClick={() => setPage(page + 1)}
                    className="px-4"
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