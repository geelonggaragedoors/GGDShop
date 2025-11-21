// Schema.org JSON-LD structured data generator for SEO
// Generates rich snippets for Google search results

import { getFirstImage } from './imageUtils';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  price: string;
  images?: string[] | null;
  sku?: string | null;
  brand?: {
    id: string;
    name: string;
  } | null;
  category?: {
    id: string;
    name: string;
  } | null;
  stockQuantity?: number | null;
  isActive?: boolean | null;
  slug: string;
}

interface Review {
  id: string;
  rating: number;
  reviewerName: string;
  reviewText: string;
  createdAt: string;
}

interface Breadcrumb {
  name: string;
  url: string;
}

// Product Schema with Offer
export function generateProductSchema(
  product: Product,
  reviews?: Review[],
  baseUrl: string = window.location.origin
) {
  const productUrl = `${baseUrl}/product/${product.slug}`;
  const imageUrl = getFirstImage(product.images, 'product');

  // Calculate aggregate rating if reviews exist
  let aggregateRating;
  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": avgRating.toFixed(1),
      "reviewCount": reviews.length,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "description": product.shortDescription || product.description || product.name,
    "image": imageUrl,
    "url": productUrl,
    "sku": product.sku || product.id,
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "AUD",
      "price": product.price,
      "availability": product.stockQuantity && product.stockQuantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Geelong Garage Doors"
      }
    }
  } as any;

  // Add brand if available
  if (product.brand) {
    schema.brand = {
      "@type": "Brand",
      "name": product.brand.name
    };
  }

  // Add category if available
  if (product.category) {
    schema.category = product.category.name;
  }

  // Add aggregate rating if available
  if (aggregateRating) {
    schema.aggregateRating = aggregateRating;
  }

  // Add individual reviews if available
  if (reviews && reviews.length > 0) {
    schema.review = reviews.map(review => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating.toString(),
        "bestRating": "5",
        "worstRating": "1"
      },
      "author": {
        "@type": "Person",
        "name": review.reviewerName
      },
      "reviewBody": review.reviewText,
      "datePublished": review.createdAt
    }));
  }

  return schema;
}

// BreadcrumbList Schema
export function generateBreadcrumbSchema(
  breadcrumbs: Breadcrumb[],
  baseUrl: string = window.location.origin
) {
  return {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `${baseUrl}${crumb.url}`
    }))
  };
}

// Organization Schema (for homepage and footer)
export function generateOrganizationSchema(baseUrl: string = window.location.origin) {
  return {
    "@context": "https://schema.org/",
    "@type": "LocalBusiness",
    "name": "Geelong Garage Doors",
    "description": "Professional garage door solutions across Geelong and surrounding areas for over 15 years.",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "image": `${baseUrl}/logo.png`,
    "telephone": "+61352218999",
    "email": "info@geelonggaragedoors.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "",
      "addressLocality": "Geelong",
      "addressRegion": "VIC",
      "postalCode": "3220",
      "addressCountry": "AU"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "-38.1499",
      "longitude": "144.3617"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "17:00"
      }
    ],
    "priceRange": "$$",
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "-38.1499",
        "longitude": "144.3617"
      },
      "geoRadius": "50000"
    },
    "sameAs": [
      "https://www.facebook.com/geelonggaragedoors",
      "https://www.instagram.com/geelonggaragedoors"
    ]
  };
}

// ItemList Schema (for product listings and category pages)
export function generateItemListSchema(
  products: Product[],
  listName: string,
  baseUrl: string = window.location.origin
) {
  return {
    "@context": "https://schema.org/",
    "@type": "ItemList",
    "name": listName,
    "numberOfItems": products.length,
    "itemListElement": products.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${baseUrl}/product/${product.slug}`,
      "name": product.name,
      "image": getFirstImage(product.images, 'product')
    }))
  };
}

// WebSite Schema (for homepage search functionality)
export function generateWebSiteSchema(baseUrl: string = window.location.origin) {
  return {
    "@context": "https://schema.org/",
    "@type": "WebSite",
    "name": "Geelong Garage Doors",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/products?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}
