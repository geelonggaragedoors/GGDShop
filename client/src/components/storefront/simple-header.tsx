import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Heart, ShoppingCart, Phone, Mail, User, Package, LogOut, Settings, UserCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/hooks/useAuth";
import logoPath from "@assets/logo-pdfs.png";

export default function SimpleHeader() {
  const { cartCount, cartTotal } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between py-2 text-sm text-gray-600 border-b border-gray-100">
          <div className="flex items-center space-x-6">
            <span className="flex items-center">
              <Phone className="w-4 h-4 mr-1" />
              (03) 5222 1234
            </span>
            <span className="flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              info@geelonggaragedoors.com.au
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || user?.email} />
                      <AvatarFallback>
                        {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">My Account</p>
                      {user?.firstName && (
                        <p className="text-sm">{user.firstName} {user.lastName}</p>
                      )}
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Wishlist</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <a href="/api/login" className="hover:text-primary transition-colors">Sign In</a>
                <span className="text-gray-300">|</span>
                <a href="/api/login" className="hover:text-primary transition-colors">Create Account</a>
              </div>
            )}
            <a href="#" className="hover:text-primary transition-colors">Track Order</a>
          </div>
        </div>
        
        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/">
              <img 
                src={logoPath} 
                alt="Geelong Garage Doors" 
                className="h-8 sm:h-10 md:h-12 w-auto"
              />
            </Link>
          </div>
          
          {/* Search bar */}
          <div className="flex flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input 
                type="text" 
                placeholder="Search products..." 
                className="w-full pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </form>
          </div>
          
          {/* Cart and actions */}
          <div className="flex items-center space-x-4">
            {/* User account */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative flex items-center space-x-2 px-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || user?.email} />
                      <AvatarFallback className="text-xs">
                        {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">My Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">My Account</p>
                      {user?.firstName && (
                        <p className="text-sm">{user.firstName} {user.lastName}</p>
                      )}
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Wishlist</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href="/api/login" className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Sign In</span>
                  </a>
                </Button>
                <span className="text-gray-300">|</span>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/api/login" className="text-sm">Create Account</a>
                </Button>
              </div>
            )}
            
            <Button variant="ghost" size="sm" className="relative">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <Badge className="inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent text-primary-foreground absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-accent hover:bg-accent ml-[0px] mr-[0px] pl-[5px] pr-[5px] font-semibold">
                  {wishlistCount}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="sm" className="relative" asChild>
              <Link href="/checkout">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 absolute -top-1 -right-1 w-5 h-5 p-0 text-xs pl-[5px] pr-[5px]">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Link href="/checkout" className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer">
              ${cartTotal.toLocaleString()}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}