import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import StorefrontHeader from "@/components/storefront/header";
import Hero from "@/components/storefront/hero";
import Categories from "@/components/storefront/categories";
import FeaturedProducts from "@/components/storefront/featured-products";
import Services from "@/components/storefront/services";
import StorefrontFooter from "@/components/storefront/footer";
import { useAuth } from "@/hooks/useAuth";
import SEOHead from "@/components/SEOHead";
import { analytics } from "@/lib/analytics";

export default function Home() {
  const [showAdmin, setShowAdmin] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  const handleAdminToggle = () => {
    if (isAuthenticated) {
      window.location.href = "/admin/dashboard";
    } else {
      window.location.href = "/api/login";
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Tabs */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-full shadow-lg border p-1">
        <div className="flex space-x-1">
          <Button
            variant={!showAdmin ? "default" : "ghost"}
            size="sm"
            className="rounded-full px-6"
            onClick={() => setShowAdmin(false)}
          >
            <i className="fas fa-store mr-2"></i>
            Storefront
          </Button>
          <Button
            variant={showAdmin ? "default" : "ghost"}
            size="sm"
            className="rounded-full px-6"
            onClick={handleAdminToggle}
            disabled={isLoading}
          >
            <i className="fas fa-cog mr-2"></i>
            Admin Dashboard
          </Button>
        </div>
      </div>

      {/* Storefront Content */}
      <div className="storefront-view">
        <StorefrontHeader />
        <Hero />
        <Categories />
        <FeaturedProducts />
        <Services />
        <StorefrontFooter />
      </div>
    </div>
  );
}
