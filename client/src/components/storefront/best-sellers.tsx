import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart } from "lucide-react";
import { Product } from "@shared/schema";
import { Link } from "wouter";

export default function BestSellers() {
  const { data: productsData, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['/api/products', { featured: true, active: true, limit: 6 }],
    retry: false,
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Best Selling Garage Doors</h2>
            <p className="text-lg text-gray-600">Discover our most popular garage door solutions</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const products = productsData?.products || [];

  if (products.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Best Selling Garage Doors</h2>
            <p className="text-lg text-gray-600 mb-8">Our featured products will be available soon</p>
            <Link href="/products" className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block">
              View All Products
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(numPrice);
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Best Selling Garage Doors</h2>
          <p className="text-lg text-gray-600">Discover our most popular garage door solutions trusted by Geelong homeowners</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <div className="relative overflow-hidden rounded-t-lg">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <ShoppingCart className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 text-white">Best Seller</Badge>
                </div>
                
                {!product.alwaysInStock && product.stockQuantity && product.stockQuantity < 5 && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="outline" className="bg-white text-orange-600 border-orange-600">
                      Low Stock
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center ml-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">4.8</span>
                  </div>
                </div>

                {product.shortDescription && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.shortDescription}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPrice(product.price)}
                  </div>
                  <Link href={`/product/${product.slug}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    View Details
                  </Link>
                </div>

                {product.stockQuantity !== undefined && (
                  <div className="mt-3">
                    {product.alwaysInStock ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Stock
                      </span>
                    ) : product.stockQuantity > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Stock ({product.stockQuantity} available)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/products" className="bg-gray-100 text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors inline-block font-medium">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}