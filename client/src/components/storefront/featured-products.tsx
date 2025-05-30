import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { api } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";

export default function FeaturedProducts() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["/api/products", { featured: true, limit: 4 }],
    queryFn: () => api.products.getAll({ featured: true, limit: 4 }),
  });

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart.`,
    });
  };

  const handleWishlistToggle = (product: any) => {
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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">Featured Products</h3>
            <a href="#" className="text-primary font-semibold hover:underline">View All Products</a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm animate-pulse">
                <div className="bg-gray-200 h-48 rounded-t-xl"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const products = productsData?.products || [];

  // Fallback products if no featured products exist
  const fallbackProducts = [
    {
      id: "1",
      name: "Premium Steel Residential Door",
      shortDescription: "Insulated steel construction with window panels",
      price: "890",
      compareAtPrice: "950",
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300"],
      isFeatured: true,
      stockQuantity: 15
    },
    {
      id: "2",
      name: "Commercial Roller Door",
      shortDescription: "Heavy-duty commercial grade roller door system",
      price: "2450",
      images: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300"],
      isFeatured: true,
      stockQuantity: 8
    },
    {
      id: "3",
      name: "Smart Garage Door Opener",
      shortDescription: "WiFi enabled with smartphone app control",
      price: "325",
      images: ["https://pixabay.com/get/g3bc5d651923a89c2751f3482dac1960f41d12521da69907d08aea7fd179cfa8ebb92a1b99d3a29338d144c5e4700b46b4f82d6bff6e1b6ad3f62f090b4f4681a_1280.jpg"],
      isFeatured: true,
      stockQuantity: 28
    },
    {
      id: "4",
      name: "Professional Hardware Kit",
      shortDescription: "Complete installation hardware set with springs",
      price: "155",
      images: ["https://images.unsplash.com/photo-1504148455328-c376907d081c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300"],
      isFeatured: true,
      stockQuantity: 42
    }
  ];

  const displayProducts = products.length > 0 ? products : fallbackProducts;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900">Featured Products</h3>
          <a href="#" className="text-primary font-semibold hover:underline">View All Products</a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product, index) => (
            <Card key={product.id || index} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group product-card border-0">
              <div className="relative">
                <img 
                  src={product.images?.[0] || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300"}
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {(index === 0 || product.compareAtPrice) && (
                  <Badge className="absolute top-3 left-3 bg-accent hover:bg-accent text-accent-foreground">
                    {index === 0 ? "New" : "Sale"}
                  </Badge>
                )}
                {index === 2 && (
                  <Badge className="absolute top-3 left-3 bg-green-500 hover:bg-green-500 text-white">
                    Best Seller
                  </Badge>
                )}
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className={`absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-md ${isInWishlist(product.id) ? 'text-red-500' : ''}`}
                  onClick={() => handleWishlistToggle(product)}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                </Button>
              </div>
              
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.shortDescription || product.description || "Quality garage door product"}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-primary">
                      ${product.price}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-sm text-gray-500 line-through ml-2">
                        ${product.compareAtPrice}
                      </span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    className="text-sm"
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
