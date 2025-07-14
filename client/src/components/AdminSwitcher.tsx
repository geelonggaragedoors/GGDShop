import { Button } from "@/components/ui/button";
import { Store, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function AdminSwitcher() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  const isAdminRoute = location.startsWith('/admin');
  
  return (
    <div className="fixed top-[30px] left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-full shadow-lg border p-1">
      <div className="flex space-x-1">
        <Link href="/">
          <Button 
            variant={!isAdminRoute ? "default" : "ghost"} 
            size="sm" 
            className="rounded-full px-6"
          >
            <Store className="w-4 h-4 mr-2" />
            Storefront
          </Button>
        </Link>
        <Link href="/admin">
          <Button 
            variant={isAdminRoute ? "default" : "ghost"} 
            size="sm" 
            className="rounded-full px-6"
          >
            <Settings className="w-4 h-4 mr-2" />
            Admin Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}