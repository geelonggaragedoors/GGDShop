import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trackViewContent as fbTrackViewContent, trackAddToCart as fbTrackAddToCart, trackInitiateCheckout, trackPurchase as fbTrackPurchase, sendEventToServer } from '../lib/facebookTracking';

interface AnalyticsSettings {
  googleAnalyticsEnabled: boolean;
  googleAnalyticsId: string;
  facebookPixelEnabled: boolean;
  facebookPixelId: string;
  googleTagManagerEnabled: boolean;
  googleTagManagerId: string;
  ecommerceTrackingEnabled: boolean;
  conversionTrackingEnabled: boolean;
}

interface AnalyticsContextType {
  settings: AnalyticsSettings | null;
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackPurchase: (transactionId: string, value: number, currency?: string, items?: any[]) => void;
  trackAddToCart: (itemId: string, itemName: string, value: number, quantity?: number) => void;
  trackConversion: (conversionName: string, value?: number) => void;
  trackViewContent: (productData: {contentId: string, contentName: string, contentCategory?: string, value?: number, currency?: string}) => void;
  trackCheckoutInitiated: (checkoutData: {value: number, currency?: string, contentIds: string[], numItems?: number}) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: any;
    dataLayer?: any[];
  }
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AnalyticsSettings | null>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState({
    ga: false,
    fb: false,
    gtm: false,
  });

  // Fetch all site settings from database
  const { data: allSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    enabled: true,
  });

  useEffect(() => {
    if (allSettings && (allSettings as any).analytics) {
      // Convert site settings to analytics settings
      const analyticsData = (allSettings as any).analytics as any;
      const analyticsSettings: AnalyticsSettings = {
        googleAnalyticsEnabled: analyticsData.enableGoogleAnalytics === true || analyticsData.enableGoogleAnalytics === 'true',
        googleAnalyticsId: analyticsData.googleAnalyticsId || '',
        facebookPixelEnabled: analyticsData.enableFacebookPixel === true || analyticsData.enableFacebookPixel === 'true',
        facebookPixelId: analyticsData.facebookPixelId || '',
        googleTagManagerEnabled: analyticsData.enableGoogleTagManager === true || analyticsData.enableGoogleTagManager === 'true',
        googleTagManagerId: analyticsData.googleTagManagerId || '',
        ecommerceTrackingEnabled: analyticsData.enableEcommerceTracking !== false && analyticsData.enableEcommerceTracking !== 'false',
        conversionTrackingEnabled: analyticsData.enableConversionTracking !== false && analyticsData.enableConversionTracking !== 'false',
      };
      setSettings(analyticsSettings);
    }
  }, [allSettings]);

  // Load Google Analytics
  useEffect(() => {
    if (settings?.googleAnalyticsEnabled && settings.googleAnalyticsId && !scriptsLoaded.ga) {
      console.log('Loading Google Analytics with ID:', settings.googleAnalyticsId);
      
      // Remove any existing Google Analytics scripts first
      const existingScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
      existingScripts.forEach(script => script.remove());
      
      // Initialize dataLayer exactly as Google recommends
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer?.push(args);
      }
      window.gtag = gtag;
      
      // Initialize with current date
      gtag('js', new Date());
      
      // Configure Google Analytics
      gtag('config', settings.googleAnalyticsId);
      
      // Create the script tag exactly as Google provides it
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`;
      
      // Add to head before any other scripts
      const firstScript = document.head.querySelector('script');
      if (firstScript) {
        document.head.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
      
      script.onload = () => {
        console.log('Google Analytics script loaded successfully');
        // Trigger a page view immediately after loading
        gtag('config', settings.googleAnalyticsId, {
          page_title: document.title,
          page_location: window.location.href,
        });
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Analytics script');
      };

      setScriptsLoaded(prev => ({ ...prev, ga: true }));
    }
  }, [settings?.googleAnalyticsEnabled, settings?.googleAnalyticsId, scriptsLoaded.ga]);

  // Load Facebook Pixel - now handled in HTML head for better performance
  useEffect(() => {
    if (settings?.facebookPixelEnabled && settings.facebookPixelId && !scriptsLoaded.fb) {
      console.log('Facebook Pixel already loaded in HTML head with ID:', settings.facebookPixelId);
      setScriptsLoaded(prev => ({ ...prev, fb: true }));
    }
  }, [settings?.facebookPixelEnabled, settings?.facebookPixelId, scriptsLoaded.fb]);

  // Load Google Tag Manager
  useEffect(() => {
    if (settings?.googleTagManagerEnabled && settings.googleTagManagerId && !scriptsLoaded.gtm) {
      console.log('Loading Google Tag Manager with ID:', settings.googleTagManagerId);
      
      // Create GTM script
      const gtmScript = document.createElement('script');
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${settings.googleTagManagerId}');
      `;
      document.head.appendChild(gtmScript);

      // Create noscript fallback
      const noscript = document.createElement('noscript');
      noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${settings.googleTagManagerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.appendChild(noscript);

      setScriptsLoaded(prev => ({ ...prev, gtm: true }));
    }
  }, [settings?.googleTagManagerEnabled, settings?.googleTagManagerId, scriptsLoaded.gtm]);

  // Tracking functions
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (!settings) return;

    // Google Analytics
    if (settings.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', eventName, parameters);
    }

    // Facebook Pixel
    if (settings.facebookPixelEnabled && window.fbq) {
      window.fbq('track', eventName, parameters);
    }

    console.log('Event tracked:', eventName, parameters);
  };

  const trackPurchase = (transactionId: string, value: number, currency: string = 'AUD', items?: any[]) => {
    if (!settings?.ecommerceTrackingEnabled) return;

    const purchaseData = {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items,
    };

    // Google Analytics Enhanced Ecommerce
    if (settings.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', 'purchase', purchaseData);
    }

    // Facebook Pixel + Conversions API dual tracking
    if (settings.facebookPixelEnabled && window.fbq) {
      const eventId = fbTrackPurchase({
        value: value,
        currency: currency,
        contentIds: items?.map(item => item.item_id) || [],
        contents: items?.map(item => ({
          id: item.item_id,
          quantity: item.quantity || 1,
          item_price: item.price || value,
        })),
        numItems: items?.length,
      });

      // Note: Purchase events are handled server-side in the order creation endpoint
      // This ensures proper deduplication with the server-side Conversions API
    }

    console.log('Purchase tracked:', purchaseData);
  };

  const trackAddToCart = (itemId: string, itemName: string, value: number, quantity: number = 1) => {
    if (!settings?.ecommerceTrackingEnabled) return;

    const cartData = {
      currency: 'AUD',
      value: value,
      items: [{
        item_id: itemId,
        item_name: itemName,
        quantity: quantity,
        price: value,
      }],
    };

    // Google Analytics
    if (settings.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', 'add_to_cart', cartData);
    }

    // Facebook Pixel + Conversions API dual tracking
    if (settings.facebookPixelEnabled && window.fbq) {
      const eventId = fbTrackAddToCart({
        contentId: itemId,
        contentName: itemName,
        value: value,
        quantity: quantity,
        currency: 'AUD',
      });

      // Send to server for Conversions API
      sendEventToServer('AddToCart', eventId, {
        contentId: itemId,
        contentName: itemName,
        value: value,
        quantity: quantity,
        pageUrl: window.location.href,
      });
    }

    console.log('Add to cart tracked:', cartData);
  };

  const trackConversion = (conversionName: string, value?: number) => {
    if (!settings?.conversionTrackingEnabled) return;

    const conversionData = {
      event_category: 'conversion',
      event_label: conversionName,
      value: value,
    };

    // Google Analytics
    if (settings.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', 'conversion', conversionData);
    }

    // Facebook Pixel
    if (settings.facebookPixelEnabled && window.fbq) {
      window.fbq('track', 'Lead', {
        value: value,
        currency: 'AUD',
      });
    }

    console.log('Conversion tracked:', conversionData);
  };

  const trackViewContent = (productData: {contentId: string, contentName: string, contentCategory?: string, value?: number, currency?: string}) => {
    if (!settings?.ecommerceTrackingEnabled) return;

    // Facebook Pixel + Conversions API dual tracking
    if (settings.facebookPixelEnabled && window.fbq) {
      const eventId = fbTrackViewContent(productData);

      // Send to server for Conversions API
      sendEventToServer('ViewContent', eventId, {
        contentId: productData.contentId,
        contentName: productData.contentName,
        contentCategory: productData.contentCategory,
        value: productData.value,
        pageUrl: window.location.href,
      });
    }

    // Google Analytics
    if (settings.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', 'view_item', {
        currency: productData.currency || 'AUD',
        value: productData.value,
        items: [{
          item_id: productData.contentId,
          item_name: productData.contentName,
          item_category: productData.contentCategory || 'Garage Door Parts',
          price: productData.value,
        }],
      });
    }

    console.log('View content tracked:', productData);
  };

  const trackCheckoutInitiated = (checkoutData: {value: number, currency?: string, contentIds: string[], numItems?: number}) => {
    if (!settings?.ecommerceTrackingEnabled) return;

    // Facebook Pixel + Conversions API dual tracking
    if (settings.facebookPixelEnabled && window.fbq) {
      const eventId = trackInitiateCheckout(checkoutData);

      // Send to server for Conversions API
      sendEventToServer('InitiateCheckout', eventId, {
        value: checkoutData.value,
        currency: checkoutData.currency || 'AUD',
        items: checkoutData.contentIds,
        pageUrl: window.location.href,
      });
    }

    // Google Analytics
    if (settings.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: checkoutData.currency || 'AUD',
        value: checkoutData.value,
        items: checkoutData.contentIds.map((id, index) => ({
          item_id: id,
          item_name: `Product ${id}`,
          item_category: 'Garage Door Parts',
          quantity: 1,
        })),
      });
    }

    console.log('Checkout initiated tracked:', checkoutData);
  };

  const contextValue: AnalyticsContextType = {
    settings,
    trackEvent,
    trackPurchase,
    trackAddToCart,
    trackConversion,
    trackViewContent,
    trackCheckoutInitiated,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}