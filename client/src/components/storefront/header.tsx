import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, ShoppingCart, Phone, Mail, User, Package } from "lucide-react";

export default function StorefrontHeader() {
  const [cartCount] = useState(2);
  const [wishlistCount] = useState(3);
  const [cartTotal] = useState(1250);

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
            <h1 className="text-2xl font-bold text-primary">Geelong Garage Doors</h1>
            <span className="ml-2 text-sm text-gray-500">Professional Garage Door Solutions</span>
          </div>
          
          {/* Search bar */}
          <div className="flex-1 max-w-xl mx-8">
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
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="relative">
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
            <span className="text-lg font-semibold text-primary">
              ${cartTotal.toLocaleString()}
            </span>
          </div>
        </div>
        
        {/* Navigation menu */}
        <nav className="py-3 border-t border-gray-100">
          <ul className="flex space-x-8">
            <li><a href="#" className="text-gray-700 hover:text-primary font-medium transition-colors">Home</a></li>
            <li className="relative group">
              <a href="#" className="text-gray-700 hover:text-primary font-medium flex items-center transition-colors">
                Residential Doors 
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </li>
            <li className="relative group">
              <a href="#" className="text-gray-700 hover:text-primary font-medium flex items-center transition-colors">
                Commercial Doors
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </li>
            <li><a href="#" className="text-gray-700 hover:text-primary font-medium transition-colors">Parts & Accessories</a></li>
            <li><a href="#" className="text-gray-700 hover:text-primary font-medium transition-colors">Installation</a></li>
            <li><a href="#" className="text-gray-700 hover:text-primary font-medium transition-colors">Repair Services</a></li>
            <li><a href="#" className="text-gray-700 hover:text-primary font-medium transition-colors">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
