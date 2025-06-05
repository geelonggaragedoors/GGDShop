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
    analytics.trackClick('admin_toggle');
    if (isAuthenticated) {
      window.location.href = "/admin/dashboard";
    } else {
      window.location.href = "/api/login";
    }
  };

  useEffect(() => {
    analytics.trackPageView();
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Geelong Garage Doors",
    "image": "https://geelonggaragedoors.com.au/logo.png",
    "description": "Professional garage door installation, repair and maintenance services in Geelong and surrounding areas. Quality products, expert installation, competitive prices.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Geelong",
      "addressRegion": "Victoria",
      "addressCountry": "AU"
    },
    "telephone": "+61-3-xxxx-xxxx",
    "url": "https://geelonggaragedoors.com.au",
    "openingHours": "Mo-Fr 08:00-17:00, Sa 09:00-15:00",
    "priceRange": "$$",
    "areaServed": ["Geelong", "Torquay", "Lara", "Drysdale", "Portarlington", "Ocean Grove"]
  };

  return (
    <>
      <SEOHead
        title="Geelong Garage Doors - Expert Installation & Repair Services"
        description="Professional garage door installation, repair and maintenance services in Geelong and surrounding areas. Quality products, expert installation, competitive prices. Free quotes available."
        keywords="garage doors Geelong, garage door installation, garage door repair, automatic garage doors, roller doors, sectional doors"
        ogTitle="Geelong Garage Doors - Expert Installation & Repair Services"
        ogDescription="Professional garage door services in Geelong. Quality installation, repair and maintenance with competitive pricing. Contact us for a free quote today."
        ogImage="https://geelonggaragedoors.com.au/hero-image.jpg"
        canonicalUrl="https://geelonggaragedoors.com.au/"
        structuredData={structuredData}
      />
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
    </>
  );
}
