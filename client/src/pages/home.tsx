import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import StorefrontHeader from "@/components/storefront/header";
import Hero from "@/components/storefront/hero";
import Categories from "@/components/storefront/categories";
import FeaturedProducts from "@/components/storefront/featured-products";
import BestSellers from "@/components/storefront/best-sellers";
import CustomerReviews from "@/components/storefront/customer-reviews";
import WhyChooseUs from "@/components/storefront/why-choose-us";
import StorefrontFooter from "@/components/storefront/footer";
import { useAuth } from "@/hooks/useAuth";
import { SEOHead } from "@/components/SEOHead";
import { analytics } from "@/lib/analytics";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/schema-generator";

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

  // Generate comprehensive schema.org structured data
  const organizationSchema = generateOrganizationSchema(window.location.origin);
  const websiteSchema = generateWebSiteSchema(window.location.origin);
  const structuredData = [organizationSchema, websiteSchema];

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
        {/* Storefront Content */}
        <div className="storefront-view">
          <StorefrontHeader />
          <Hero />
          <Categories />
          <FeaturedProducts />
          <BestSellers />
          <WhyChooseUs />
          <CustomerReviews />
          <StorefrontFooter />
        </div>
      </div>
    </>
  );
}
