import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Heart, ShoppingCart, Phone, Mail, User, Package, Menu, X, ChevronDown, LogOut, Settings, UserCircle, Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/hooks/useAuth";
import AdminSwitcher from "@/components/AdminSwitcher";
import SearchDropdown from "@/components/storefront/SearchDropdown";
import type { MenuItemWithCategory } from "@shared/schema";

export default function StorefrontHeader() {
  const { cartCount, cartTotal } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const { data: menuItems } = useQuery<MenuItemWithCategory[]>({
    queryKey: ["/api/menu-items"],
  });

  const handleSearch = (query: string) => {
    setLocation(`/products?search=${encodeURIComponent(query)}`);
    setShowMobileSearch(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Admin Switcher - Only visible to admin users */}
      <AdminSwitcher />
      
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <a href="tel:0352218999" className="flex items-center hover:text-primary transition-colors">
              <Phone className="w-4 h-4 mr-1" />
              (03) 5221 8999
            </a>
            <a href="mailto:info@geelonggaragedoors.com.au" className="flex items-center hover:text-primary transition-colors">
              <Mail className="w-4 h-4 mr-1" />
              info@geelonggaragedoors.com.au
            </a>
          </div>
          <div className="flex items-center space-x-4">
            {!isAuthenticated && (
              <div className="flex items-center space-x-3">
                <a href="/api/login" className="hover:text-primary transition-colors">Sign In</a>
                <span className="text-gray-300">|</span>
                <a href="/api/login" className="hover:text-primary transition-colors">Create Account</a>
              </div>
            )}

          </div>
        </div>
        
        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/">
              <img 
                src="/assets/logo-pdfs.png" 
                alt="Geelong Garage Doors" 
                className="h-8 sm:h-10 md:h-12 w-auto cursor-pointer hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>
          
          {/* Search bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <SearchDropdown onSearch={handleSearch} />
          </div>
          
          {/* Cart and actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile search */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="w-5 h-5" />
            </Button>
            
            {/* User account - Desktop */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative hidden sm:flex items-center space-x-2 px-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || user?.email} />
                      <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full text-xs bg-[#1e2871] text-white">
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
                    <Link href="/transactions" className="cursor-pointer">
                      <Receipt className="mr-2 h-4 w-4" />
                      <span>Transaction History</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/track-order" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Track Order</span>
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
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href="/api/login" className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Sign In</span>
                  </a>
                </Button>
                <span className="text-gray-300">|</span>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/signup" className="text-sm">Create Account</Link>
                </Button>
              </div>
            )}
            
            <Button variant="ghost" size="sm" className="relative hidden sm:flex">
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
            <Link href="/checkout" className="text-lg font-semibold text-primary hidden sm:block hover:text-primary/80 transition-colors cursor-pointer">
              ${cartTotal.toLocaleString()}
            </Link>
            
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
        
        {/* Mobile Search Dropdown */}
        {showMobileSearch && (
          <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3">
            <SearchDropdown 
              onSearch={handleSearch} 
              autoFocus={true}
              isMobile={true}
            />
          </div>
        )}
        
        {/* Desktop Navigation */}
        <nav className="hidden md:block py-3 border-t border-gray-100">
          <ul className="flex space-x-8 text-sm font-bold">
            <li><Link href="/" className="text-gray-700 hover:text-primary transition-colors">Home</Link></li>
            <li><Link href="/products" className="text-gray-700 hover:text-primary transition-colors">All Products</Link></li>
            
            {/* Custom Menu Items */}
            {menuItems?.filter((item) => !item.parentId && item.isVisible).map((item) => {
              const childItems = menuItems.filter((child) => child.parentId === item.id && child.isVisible);
              
              // Get the link URL based on menu item type
              const getMenuLink = (menuItem: MenuItemWithCategory) => {
                if (menuItem.type === 'category' && menuItem.category) {
                  return `/product-category/${menuItem.category.slug}`;
                } else if (menuItem.type === 'custom' && menuItem.customUrl) {
                  return menuItem.customUrl;
                }
                return '#';
              };
              
              return (
                <li 
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setHoveredCategory(item.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  {item.type === 'group' ? (
                    <button 
                      className="text-gray-700 hover:text-primary font-bold transition-colors flex items-center"
                    >
                      {item.label}
                      {childItems.length > 0 && (
                        <ChevronDown className="w-3 h-3 ml-1" />
                      )}
                    </button>
                  ) : (
                    <Link 
                      href={getMenuLink(item)} 
                      className="text-gray-700 hover:text-primary font-bold transition-colors flex items-center"
                    >
                      {item.label}
                    </Link>
                  )}
                  
                  {/* Dropdown Menu for Child Items */}
                  {childItems.length > 0 && hoveredCategory === item.id && (
                    <div className="absolute left-0 top-full pt-2 z-50">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-xl min-w-48 py-2">
                        <div className="py-2">
                          {childItems.map((childItem) => (
                            <Link
                              key={childItem.id}
                              href={getMenuLink(childItem)}
                              className="block px-4 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                            >
                              {childItem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
            
            <li><Link href="/contact" className="text-gray-700 hover:text-primary font-bold transition-colors">Contact</Link></li>
          </ul>
        </nav>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="py-4 space-y-4">
              {/* Mobile Search */}
              <div className="px-4 md:hidden">
                <SearchDropdown onSearch={handleSearch} isMobile={true} />
              </div>
              
              {/* Mobile Menu Items */}
              <div className="px-4">
                <ul className="space-y-4">
                  <li><Link href="/" className="block text-gray-700 hover:text-primary font-medium transition-colors py-2">Home</Link></li>
                  <li><Link href="/products" className="block text-gray-700 hover:text-primary font-medium transition-colors py-2">All Products</Link></li>
                  
                  {/* Shop Section */}
                  <li>
                    <div className="text-gray-900 font-semibold py-2 mb-2 border-b border-gray-100">Shop</div>
                    <ul className="space-y-2 ml-4">
                      {menuItems?.filter((item) => !item.parentId && item.isVisible).map((item) => {
                        const childItems = menuItems.filter((child) => child.parentId === item.id && child.isVisible);
                        
                        // Get the link URL based on menu item type
                        const getMenuLink = (menuItem: MenuItemWithCategory) => {
                          if (menuItem.type === 'category' && menuItem.category) {
                            return `/product-category/${menuItem.category.slug}`;
                          } else if (menuItem.type === 'custom' && menuItem.customUrl) {
                            return menuItem.customUrl;
                          }
                          return '#';
                        };
                        
                        return (
                          <li key={item.id}>
                            {item.type === 'group' ? (
                              <span className="block text-gray-600 font-medium py-1">
                                {item.label}
                              </span>
                            ) : (
                              <Link 
                                href={getMenuLink(item)}
                                className="block text-gray-600 hover:text-primary transition-colors py-1"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {item.label}
                              </Link>
                            )}
                            {childItems.length > 0 && (
                              <ul className="ml-4 mt-1 space-y-1">
                                {childItems.map((childItem) => (
                                  <li key={childItem.id}>
                                    <Link 
                                      href={getMenuLink(childItem)}
                                      className="block text-gray-500 hover:text-primary transition-colors py-1 text-sm"
                                      onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                      {childItem.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                  
                  <li><Link href="/contact" className="block text-gray-700 hover:text-primary font-medium transition-colors py-2">Contact</Link></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
    </>
  );
}
