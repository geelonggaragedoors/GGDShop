import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  structuredData?: any;
}

export default function SEOHead({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  canonicalUrl,
  noIndex = false,
  structuredData,
}: SEOHeadProps) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Clear existing meta tags
    const existingMetas = document.querySelectorAll('meta[data-seo="true"]');
    existingMetas.forEach(meta => meta.remove());

    const existingLinks = document.querySelectorAll('link[data-seo="true"]');
    existingLinks.forEach(link => link.remove());

    const existingScripts = document.querySelectorAll('script[data-seo="true"]');
    existingScripts.forEach(script => script.remove());

    // Create meta tags
    const metaTags = [
      { name: "description", content: description },
      { property: "og:title", content: ogTitle || title },
      { property: "og:description", content: ogDescription || description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonicalUrl || window.location.href },
      { property: "og:site_name", content: "Geelong Garage Doors" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: ogTitle || title },
      { name: "twitter:description", content: ogDescription || description },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ];

    if (keywords) {
      metaTags.push({ name: "keywords", content: keywords });
    }

    if (ogImage) {
      metaTags.push(
        { property: "og:image", content: ogImage },
        { name: "twitter:image", content: ogImage }
      );
    }

    if (noIndex) {
      metaTags.push({ name: "robots", content: "noindex, nofollow" });
    } else {
      metaTags.push({ name: "robots", content: "index, follow" });
    }

    // Add meta tags to head
    metaTags.forEach(tag => {
      const meta = document.createElement("meta");
      if ('name' in tag) {
        meta.name = tag.name;
      } else if ('property' in tag) {
        meta.setAttribute('property', tag.property);
      }
      meta.content = tag.content;
      meta.setAttribute('data-seo', 'true');
      document.head.appendChild(meta);
    });

    // Add canonical link
    if (canonicalUrl) {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = canonicalUrl;
      link.setAttribute('data-seo', 'true');
      document.head.appendChild(link);
    }

    // Add structured data
    if (structuredData) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredData);
      script.setAttribute('data-seo', 'true');
      document.head.appendChild(script);
    }

    // Track SEO metrics
    const seoData = {
      path: window.location.pathname,
      title,
      description,
      keywords,
      ogTitle: ogTitle || title,
      ogDescription: ogDescription || description,
      canonicalUrl: canonicalUrl || window.location.href,
      pageSpeed: performance.now(),
      mobileUsability: window.innerWidth < 768,
    };

    fetch('/api/analytics/seo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seoData),
    }).catch(error => console.error('SEO tracking error:', error));

  }, [title, description, keywords, ogTitle, ogDescription, ogImage, canonicalUrl, noIndex, structuredData]);

  return null;
}