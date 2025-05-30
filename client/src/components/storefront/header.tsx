import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, ShoppingCart, Phone, Mail, User, Package, Menu, X, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";

export default function StorefrontHeader() {
  const [cartCount] = useState(2);
  const [wishlistCount] = useState(3);
  const [cartTotal] = useState(1250);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShopMegaMenuOpen, setIsShopMegaMenuOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: api.categories.getAll,
  });

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Phone className="w-4 h-4 mr-1" />
              (03) 5221 8999
            </span>
            <span className="flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              info@geelonggaragedoors.com.au
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="#" className="hover:text-primary transition-colors">Account</a>
            <a href="#" className="hover:text-primary transition-colors">Track Order</a>
          </div>
        </div>
        
        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Geelong Garage Doors</h1>
            <span className="ml-2 text-sm text-gray-500 hidden md:block">Professional Garage Door Solutions</span>
          </div>
          
          {/* Search bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Search products..." 
                className="w-full pl-10 pr-4"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          {/* Cart and actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile search */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Search className="w-5 h-5" />
            </Button>
            
            <Button variant="ghost" size="sm" className="relative hidden sm:flex">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-accent hover:bg-accent">
                  {wishlistCount}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs">
                  {cartCount}
                </Badge>
              )}
            </Button>
            <span className="text-lg font-semibold text-primary hidden sm:block">
              ${cartTotal.toLocaleString()}
            </span>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:block py-3 border-t border-gray-100">
          <ul className="flex space-x-8 text-sm font-medium">
            <li><Link href="/" className="text-gray-700 hover:text-primary transition-colors">Home</Link></li>
            
            {/* Shop Mega Menu */}
            <li className="relative group"
                onMouseEnter={() => setIsShopMegaMenuOpen(true)}
                onMouseLeave={() => setIsShopMegaMenuOpen(false)}>
              <button className="text-gray-700 hover:text-primary font-medium transition-colors flex items-center">
                Shop
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              
              {/* Invisible bridge to prevent menu from closing */}
              {isShopMegaMenuOpen && (
                <div className="absolute left-0 top-full w-screen max-w-6xl h-2 bg-transparent z-40"></div>
              )}
              
              {/* Mega Menu */}
              {isShopMegaMenuOpen && (
                <div className="absolute left-0 top-full pt-2 w-screen max-w-6xl z-50">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-xl">
                    <div className="grid grid-cols-4 gap-8 p-8">
                      {/* Categories Column */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                        <ul className="space-y-2">
                          {categories?.filter((category: any) => !category.parentId && category.isActive).map((category: any) => (
                            <li key={category.id}>
                              <Link 
                                href={`/products/${category.slug}`}
                                className="text-gray-600 hover:text-primary transition-colors text-sm"
                              >
                                {category.name}
                              </Link>
                            </li>
                          ))}
                          <li>
                            <Link 
                              href="/products"
                              className="text-primary font-medium hover:text-primary/80 transition-colors text-sm"
                            >
                              View All Products →
                            </Link>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Subcategories for each main category */}
                      {categories?.filter((category: any) => !category.parentId && category.isActive).slice(0, 3).map((category: any) => {
                        const subcategories = categories.filter((sub: any) => sub.parentId === category.id && sub.isActive);
                        if (subcategories.length === 0) return null;
                        
                        return (
                          <div key={category.id}>
                            <h3 className="font-semibold text-gray-900 mb-4">{category.name}</h3>
                            <ul className="space-y-2">
                              {subcategories.map((subcategory: any) => (
                                <li key={subcategory.id}>
                                  <Link 
                                    href={`/products/${subcategory.slug}`}
                                    className="text-gray-600 hover:text-primary transition-colors text-sm"
                                  >
                                    {subcategory.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </li>
            
            <li><a href="#" className="text-gray-700 hover:text-primary font-medium transition-colors">Installation</a></li>
            <li><a href="#" className="text-gray-700 hover:text-primary font-medium transition-colors">Repair Services</a></li>
            <li><a href="#" className="text-gray-700 hover:text-primary font-medium transition-colors">Contact</a></li>
          </ul>
        </nav>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="py-4 space-y-4">
              {/* Mobile Search */}
              <div className="px-4 md:hidden">
                <div className="relative">
                  <Input 
                    type="text" 
                    placeholder="Search products..." 
                    className="w-full pl-10 pr-4"
                  />
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
              
              {/* Mobile Menu Items */}
              <div className="px-4">
                <ul className="space-y-4">
                  <li><Link href="/" className="block text-gray-700 hover:text-primary font-medium transition-colors py-2">Home</Link></li>
                  
                  {/* Shop Section */}
                  <li>
                    <div className="text-gray-900 font-semibold py-2 mb-2 border-b border-gray-100">Shop</div>
                    <ul className="space-y-2 ml-4">
                      {categories?.filter((category: any) => !category.parentId && category.isActive).map((category: any) => {
                        const subcategories = categories.filter((sub: any) => sub.parentId === category.id && sub.isActive);
                        
                        return (
                          <li key={category.id}>
                            <Link 
                              href={`/products/${category.slug}`}
                              className="block text-gray-600 hover:text-primary transition-colors py-1"
                            >
                              {category.name}
                            </Link>
                            {subcategories.length > 0 && (
                              <ul className="ml-4 mt-1 space-y-1">
                                {subcategories.map((subcategory: any) => (
                                  <li key={subcategory.id}>
                                    <Link 
                                      href={`/products/${subcategory.slug}`}
                                      className="block text-gray-500 hover:text-primary transition-colors py-1 text-sm"
                                    >
                                      {subcategory.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                      <li>
                        <Link 
                          href="/products"
                          className="block text-primary font-medium hover:text-primary/80 transition-colors py-1"
                        >
                          View All Products
                        </Link>
                      </li>
                    </ul>
                  </li>
                  
                  {/* Services */}
                  <li><a href="#" className="block text-gray-700 hover:text-primary font-medium transition-colors py-2">Installation</a></li>
                  <li><a href="#" className="block text-gray-700 hover:text-primary font-medium transition-colors py-2">Repair Services</a></li>
                  <li><a href="#" className="block text-gray-700 hover:text-primary font-medium transition-colors py-2">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
