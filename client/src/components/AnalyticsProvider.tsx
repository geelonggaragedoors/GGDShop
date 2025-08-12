import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

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
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
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
    if (allSettings && allSettings.analytics) {
      // Convert site settings to analytics settings
      const analyticsData = allSettings.analytics as any;
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
      
      // Initialize dataLayer first
      window.dataLayer = window.dataLayer || [];
      
      // Create gtag function
      const gtag = (...args: any[]) => {
        window.dataLayer?.push(args);
      };
      window.gtag = gtag;
      
      // Initialize gtag with current date
      gtag('js', new Date());
      
      // Configure Google Analytics
      gtag('config', settings.googleAnalyticsId, {
        page_title: document.title,
        page_location: window.location.href,
      });
      
      // Create and load the gtag script
      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`;
      gtagScript.onload = () => {
        console.log('Google Analytics script loaded successfully');
      };
      gtagScript.onerror = () => {
        console.error('Failed to load Google Analytics script');
      };
      document.head.appendChild(gtagScript);

      setScriptsLoaded(prev => ({ ...prev, ga: true }));
    }
  }, [settings?.googleAnalyticsEnabled, settings?.googleAnalyticsId, scriptsLoaded.ga]);

  // Load Facebook Pixel
  useEffect(() => {
    if (settings?.facebookPixelEnabled && settings.facebookPixelId && !scriptsLoaded.fb) {
      console.log('Loading Facebook Pixel with ID:', settings.facebookPixelId);
      
      // Create Facebook Pixel script
      const fbScript = document.createElement('script');
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${settings.facebookPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);

      // Create noscript fallback
      const noscript = document.createElement('noscript');
      noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${settings.facebookPixelId}&ev=PageView&noscript=1" />`;
      document.head.appendChild(noscript);

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

    // Facebook Pixel Purchase Event
    if (settings.facebookPixelEnabled && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: value,
        currency: currency,
        content_ids: items?.map(item => item.item_id),
        content_type: 'product',
      });
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

    // Facebook Pixel
    if (settings.facebookPixelEnabled && window.fbq) {
      window.fbq('track', 'AddToCart', {
        value: value,
        currency: 'AUD',
        content_ids: [itemId],
        content_name: itemName,
        content_type: 'product',
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

  const contextValue: AnalyticsContextType = {
    settings,
    trackEvent,
    trackPurchase,
    trackAddToCart,
    trackConversion,
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