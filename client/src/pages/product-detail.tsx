import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Heart, ShoppingCart, Truck, Shield, ArrowLeft, Plus, Minus } from "lucide-react";
import { api } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { getOptimizedImageUrl } from "@/lib/image-optimizer";
import StorefrontHeader from "@/components/storefront/header";
import StorefrontFooter from "@/components/storefront/footer";
import CustomerReviews from "@/components/storefront/customer-reviews";

export default function ProductDetail() {
  const { slug } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery({
    queryKey: [`/api/products/slug/${slug}`],
    enabled: !!slug,
  });

  const { data: similarProducts } = useQuery({
    queryKey: [`/api/products`, { categoryId: product?.categoryId, limit: 4 }],
    enabled: !!product?.categoryId,
  });

  const { data: reviewsData } = useQuery({
    queryKey: [`/api/reviews`, { productId: product?.id, isVisible: true }],
    enabled: !!product?.id,
  });

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart(product, quantity);
    toast({
      title: "Added to cart",
      description: `${quantity} ${product.name} added to your cart.`,
    });
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    
    toggleWishlist(product);
    toast({
      title: isInWishlist(product.id) ? "Removed from wishlist" : "Added to wishlist",
      description: isInWishlist(product.id) 
        ? `${product.name} removed from your wishlist.`
        : `${product.name} added to your wishlist.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const defaultImage = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800";
  const rawImage = images[selectedImage] || images[0] || defaultImage;
  const currentImage = getOptimizedImageUrl(rawImage, { width: 800, height: 800, quality: 90 });
  
  const incrementQuantity = () => setQuantity(prev => Math.min(prev + 1, product.stockQuantity));
  const decrementQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gray-50">
      <StorefrontHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary">Products</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Back Button */}
        <Link href="/products">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-white rounded border-2 overflow-hidden transition-colors ${
                      selectedImage === index ? 'border-primary' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={getOptimizedImageUrl(image, { width: 150, height: 150, quality: 85 })}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              {product.brand && (
                <p className="text-lg text-gray-600">by {product.brand.name}</p>
              )}
            </div>

            {/* Rating */}
            {reviewsData && reviewsData.total > 0 && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < 5 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">({reviewsData.total} review{reviewsData.total > 1 ? 's' : ''})</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-primary">${parseFloat(product.price).toFixed(2)}</span>
              {product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price) && (
                <span className="text-xl text-gray-500 line-through">
                  ${parseFloat(product.compareAtPrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              {product.stockQuantity > 0 ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700 font-medium">
                    {product.stockQuantity} in stock
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-700 font-medium">Out of stock</span>
                </>
              )}
            </div>

            {/* SKU */}
            {product.sku && (
              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
            )}

            {/* Short Description */}
            {product.description && (
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="rounded-r-none"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stockQuantity}
                    className="rounded-l-none"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  className="flex-1"
                  disabled={product.stockQuantity === 0}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleWishlistToggle}
                  className={isInWishlist(product.id) ? "text-red-500 border-red-500" : ""}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Truck className="w-4 h-4" />
                <span>Free shipping on orders over $100</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>2-year warranty included</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviewsData?.total || 0})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {product.description || "Detailed product description would go here. This high-quality garage door product offers exceptional durability and performance for residential and commercial applications."}
                    </p>
                    <h4 className="font-semibold mt-4 mb-2">Key Features:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Premium construction materials</li>
                      <li>Weather-resistant finish</li>
                      <li>Easy installation process</li>
                      <li>Compatible with most garage door systems</li>
                      <li>Backed by manufacturer warranty</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-3">Product Details</h4>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Weight:</dt>
                          <dd className="font-medium">{product.weight ? `${product.weight} kg` : 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">SKU:</dt>
                          <dd className="font-medium">{product.sku || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Category:</dt>
                          <dd className="font-medium">{product.category?.name || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Brand:</dt>
                          <dd className="font-medium">{product.brand?.name || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Dimensions</h4>
                      <p className="text-gray-600">Specific dimensions available upon request.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <CustomerReviews productId={product.id} showAll={true} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Similar Products */}
        {similarProducts?.products && similarProducts.products.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Similar Products</h3>
              <Link href="/products">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {similarProducts.products
                .filter((p: any) => p.id !== product.id)
                .slice(0, 4)
                .map((similarProduct: any) => (
                <Link key={similarProduct.id} href={`/product/${similarProduct.slug}`}>
                  <Card className="group cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-lg">
                      <img
                        src={similarProduct.images?.[0] || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"}
                        alt={similarProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {similarProduct.name}
                      </h4>
                      <p className="text-primary font-semibold">${parseFloat(similarProduct.price).toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <StorefrontFooter />
    </div>
  );
}