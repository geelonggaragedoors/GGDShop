import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Link } from "wouter";

const categoryImages = {
  "residential": "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
  "commercial": "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
  "parts": "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
};

export default function Categories() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: api.categories.getAll,
  });

  const getImageForCategory = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('residential')) return categoryImages.residential;
    if (name.includes('commercial')) return categoryImages.commercial;
    if (name.includes('parts') || name.includes('accessories')) return categoryImages.parts;
    return categoryImages.residential;
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">Shop by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl h-64 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const displayCategories = categories?.slice(0, 3) || [];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">Shop by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayCategories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="group cursor-pointer category-card">
                <Card className="relative overflow-hidden rounded-xl shadow-lg group-hover:shadow-xl border-0">
                  <div className="relative">
                    <img 
                      src={category.image || getImageForCategory(category.name)}
                      alt={category.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h4 className="text-xl font-semibold mb-1">{category.name}</h4>
                      <p className="text-gray-200">View Products</p>
                    </div>
                  </div>
                </Card>
              </div>
            </Link>
          ))}
          
          {/* Fallback categories if no data */}
          {(!categories || categories.length === 0) && (
            <>
              <div className="group cursor-pointer category-card">
                <Card className="relative overflow-hidden rounded-xl shadow-lg group-hover:shadow-xl border-0">
                  <div className="relative">
                    <img 
                      src={categoryImages.residential}
                      alt="Residential Doors"
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h4 className="text-xl font-semibold mb-1">Residential Doors</h4>
                      <p className="text-gray-200">Browse our collection</p>
                    </div>
                  </div>
                </Card>
              </div>
              
              <div className="group cursor-pointer category-card">
                <Card className="relative overflow-hidden rounded-xl shadow-lg group-hover:shadow-xl border-0">
                  <div className="relative">
                    <img 
                      src={categoryImages.commercial}
                      alt="Commercial Doors"
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h4 className="text-xl font-semibold mb-1">Commercial Doors</h4>
                      <p className="text-gray-200">Professional solutions</p>
                    </div>
                  </div>
                </Card>
              </div>
              
              <div className="group cursor-pointer category-card">
                <Card className="relative overflow-hidden rounded-xl shadow-lg group-hover:shadow-xl border-0">
                  <div className="relative">
                    <img 
                      src={categoryImages.parts}
                      alt="Parts & Accessories"
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h4 className="text-xl font-semibold mb-1">Parts & Accessories</h4>
                      <p className="text-gray-200">Quality components</p>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
