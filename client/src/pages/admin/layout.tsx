import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";
import Dashboard from "./dashboard";
import Analytics from "./analytics";
import Products from "./products";
import Categories from "./categories";
import Brands from "./brands";
import Orders from "./orders";
import Customers from "./customers";
import Media from "./media";
import Staff from "./staff";
import Reviews from "./reviews";
import Enquiries from "./enquiries";
import SettingsPage from "./settings";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Building,
  Users,
  Images,
  UserCheck,
  Star,
  MessageSquare,
  Settings as SettingsIcon,
  Store,
  Bell,
  Plus,
  LogOut,
  BarChart3,
} from "lucide-react";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { id: "products", label: "Products", icon: Package, path: "/admin/products" },
  { id: "orders", label: "Orders", icon: ShoppingCart, path: "/admin/orders" },
  { id: "enquiries", label: "Quote Requests", icon: MessageSquare, path: "/admin/enquiries" },
  { id: "categories", label: "Categories", icon: Tags, path: "/admin/categories" },
  { id: "brands", label: "Brands", icon: Building, path: "/admin/brands" },
  { id: "customers", label: "Customers", icon: Users, path: "/admin/customers" },
  { id: "reviews", label: "Reviews", icon: Star, path: "/admin/reviews" },
  { id: "media", label: "Media Library", icon: Images, path: "/admin/media" },
  { id: "staff", label: "Staff & Roles", icon: UserCheck, path: "/admin/staff" },
  { id: "settings", label: "Settings", icon: SettingsIcon, path: "/admin/settings" },
];

export default function AdminLayout() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Fetch counts for sidebar badges
  const { data: counts } = useQuery<{ products: number; orders: number }>({
    queryKey: ["/api/admin/counts"],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Handle /admin root path by defaulting to dashboard
  const pathSegments = location.split("/");
  const currentPath = pathSegments.length > 2 ? pathSegments.pop() : "dashboard";

  const getCurrentPageInfo = () => {
    switch (currentPath) {
      case "dashboard":
        return { title: "Dashboard", subtitle: "Overview of your store performance" };
      case "products":
        return { title: "Products", subtitle: "Manage your garage door inventory" };
      case "orders":
        return { title: "Orders", subtitle: "Track and manage customer orders" };
      case "enquiries":
        return { title: "Quote Requests", subtitle: "Manage customer enquiries and quote requests" };
      case "categories":
        return { title: "Categories", subtitle: "Organize your product categories" };
      case "brands":
        return { title: "Brands", subtitle: "Manage product brands and manufacturers" };
      case "customers":
        return { title: "Customers", subtitle: "Customer relationship management" };
      case "reviews":
        return { title: "Customer Reviews", subtitle: "Manage customer feedback and testimonials" };
      case "media":
        return { title: "Media Library", subtitle: "Manage images and files" };
      case "staff":
        return { title: "Staff & Roles", subtitle: "Manage team members and permissions" };
      case "settings":
        return { title: "Settings", subtitle: "Configure store settings and preferences" };
      default:
        return { title: "Dashboard", subtitle: "Overview of your store performance" };
    }
  };

  const pageInfo = getCurrentPageInfo();

  const renderContent = () => {
    switch (currentPath) {
      case "analytics":
        return <Analytics />;
      case "products":
        return <Products />;
      case "orders":
        return <Orders />;
      case "enquiries":
        return <Enquiries />;
      case "categories":
        return <Categories />;
      case "brands":
        return <Brands />;
      case "customers":
        return <Customers />;
      case "reviews":
        return <Reviews />;
      case "media":
        return <Media />;
      case "staff":
        return <Staff />;
      case "settings":
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="fixed top-[30px] left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-full shadow-lg border p-1">
        <div className="flex space-x-1">
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full px-6">
              <Store className="w-4 h-4 mr-2" />
              Storefront
            </Button>
          </Link>
          <Button variant="default" size="sm" className="rounded-full px-6">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Admin Dashboard
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-white shadow-lg border-r z-40">
        <div className="p-6 border-b">
          <div className="flex justify-center">
            <img 
              src="/logo.png"
              alt="Geelong Garage Doors" 
              className="h-10 w-auto"
            />
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.id;
              
              return (
                <li key={item.id}>
                  <Link href={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start admin-nav-transition ${
                        isActive ? "bg-primary text-primary-foreground" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.label}
                      {(item.id === "products" && counts?.products && counts.products > 0) && (
                        <Badge className="ml-auto bg-orange-500 text-white hover:bg-orange-600">
                          {counts.products}
                        </Badge>
                      )}
                      {(item.id === "orders" && counts?.orders && counts.orders > 0) && (
                        <Badge className="ml-auto bg-orange-500 text-white hover:bg-orange-600">
                          {counts.orders}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {user?.firstName?.[0] || user?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.email || "User"}
              </p>
              <p className="text-xs text-gray-500">{user?.role || "Administrator"}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => window.location.href = "/api/logout"}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
              <p className="text-gray-600">{pageInfo.subtitle}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Content */}
        {renderContent()}
      </main>
    </div>
  );
}
