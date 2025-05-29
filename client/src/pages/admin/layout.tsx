import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./dashboard";
import Products from "./products";
import Categories from "./categories";
import Brands from "./brands";
import Orders from "./orders";
import Customers from "./customers";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Building,
  Users,
  Images,
  UserCheck,
  Settings,
  Store,
  Bell,
  Plus,
  LogOut,
} from "lucide-react";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "products", label: "Products", icon: Package, path: "/admin/products", badge: "245" },
  { id: "orders", label: "Orders", icon: ShoppingCart, path: "/admin/orders", badge: "12" },
  { id: "categories", label: "Categories", icon: Tags, path: "/admin/categories" },
  { id: "brands", label: "Brands", icon: Building, path: "/admin/brands" },
  { id: "customers", label: "Customers", icon: Users, path: "/admin/customers" },
  { id: "media", label: "Media Library", icon: Images, path: "/admin/media" },
  { id: "staff", label: "Staff & Roles", icon: UserCheck, path: "/admin/staff" },
  { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
];

export default function AdminLayout() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const currentPath = location.split("/").pop() || "dashboard";

  const getCurrentPageInfo = () => {
    switch (currentPath) {
      case "dashboard":
        return { title: "Dashboard", subtitle: "Overview of your store performance" };
      case "products":
        return { title: "Products", subtitle: "Manage your garage door inventory" };
      case "orders":
        return { title: "Orders", subtitle: "Track and manage customer orders" };
      case "categories":
        return { title: "Categories", subtitle: "Organize your product categories" };
      case "brands":
        return { title: "Brands", subtitle: "Manage product brands and manufacturers" };
      case "customers":
        return { title: "Customers", subtitle: "Customer relationship management" };
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
      case "products":
        return <Products />;
      case "orders":
        return <Orders />;
      case "categories":
        return <Categories />;
      case "brands":
        return <Brands />;
      case "customers":
        return <Customers />;
      case "media":
        return <div className="p-6"><div className="bg-white rounded-xl shadow-sm border p-6"><h2 className="text-xl font-semibold mb-4">Media Library</h2><p className="text-gray-600">Media management interface will be implemented here...</p></div></div>;
      case "staff":
        return <div className="p-6"><div className="bg-white rounded-xl shadow-sm border p-6"><h2 className="text-xl font-semibold mb-4">Staff & Roles Management</h2><p className="text-gray-600">Staff management interface will be implemented here...</p></div></div>;
      case "settings":
        return <div className="p-6"><div className="bg-white rounded-xl shadow-sm border p-6"><h2 className="text-xl font-semibold mb-4">Settings</h2><p className="text-gray-600">Settings interface will be implemented here...</p></div></div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-full shadow-lg border p-1">
        <div className="flex space-x-1">
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full px-6">
              <Store className="w-4 h-4 mr-2" />
              Storefront
            </Button>
          </Link>
          <Button variant="default" size="sm" className="rounded-full px-6">
            <Settings className="w-4 h-4 mr-2" />
            Admin Dashboard
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-white shadow-lg border-r z-40">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-primary">Admin Dashboard</h2>
          <p className="text-sm text-gray-600">Geelong Garage Doors</p>
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
                      {item.badge && (
                        <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                          isActive ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
                        }`}>
                          {item.badge}
                        </span>
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
              <Button variant="outline" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        {renderContent()}
      </main>
    </div>
  );
}
