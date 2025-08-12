import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface AnalyticsSettings {
  googleAnalyticsId: string;
  facebookPixelId: string;
  googleTagManagerId: string;
  enableGoogleAnalytics: boolean;
  enableFacebookPixel: boolean;
  enableGoogleTagManager: boolean;
  enableConversionTracking: boolean;
  enableEcommerceTracking: boolean;
}

// Declare global types for analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq?: (...args: any[]) => void;
  }
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: () => fetch('/api/admin/settings').then(res => res.json()),
  });

  const analyticsSettings: AnalyticsSettings | undefined = settings?.analytics;

  useEffect(() => {
    if (!analyticsSettings || scriptsLoaded) return;

    // Google Analytics Setup
    if (analyticsSettings.enableGoogleAnalytics && analyticsSettings.googleAnalyticsId) {
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsSettings.googleAnalyticsId}`;
      document.head.appendChild(gaScript);

      const gaConfigScript = document.createElement('script');
      gaConfigScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${analyticsSettings.googleAnalyticsId}', {
          page_title: document.title,
          page_location: window.location.href
        });
      `;
      document.head.appendChild(gaConfigScript);

      window.gtag = function(...args) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(args);
      };
    }

    // Facebook Pixel Setup
    if (analyticsSettings.enableFacebookPixel && analyticsSettings.facebookPixelId) {
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
        fbq('init', '${analyticsSettings.facebookPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);

      // Add noscript fallback
      const fbNoScript = document.createElement('noscript');
      fbNoScript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${analyticsSettings.facebookPixelId}&ev=PageView&noscript=1" />`;
      document.head.appendChild(fbNoScript);
    }

    // Google Tag Manager Setup
    if (analyticsSettings.enableGoogleTagManager && analyticsSettings.googleTagManagerId) {
      const gtmScript = document.createElement('script');
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${analyticsSettings.googleTagManagerId}');
      `;
      document.head.appendChild(gtmScript);

      // Add noscript fallback to body
      const gtmNoScript = document.createElement('noscript');
      gtmNoScript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${analyticsSettings.googleTagManagerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.appendChild(gtmNoScript);
    }

    setScriptsLoaded(true);
  }, [analyticsSettings, scriptsLoaded]);

  return <>{children}</>;
}

// Hook for tracking events
export function useAnalytics() {
  const { data: settings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: () => fetch('/api/admin/settings').then(res => res.json()),
  });

  const analyticsSettings: AnalyticsSettings | undefined = settings?.analytics;

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (!analyticsSettings) return;

    // Google Analytics event tracking
    if (analyticsSettings.enableGoogleAnalytics && window.gtag) {
      window.gtag('event', eventName, parameters);
    }

    // Facebook Pixel event tracking
    if (analyticsSettings.enableFacebookPixel && window.fbq) {
      window.fbq('track', eventName, parameters);
    }
  };

  const trackPurchase = (purchaseData: {
    value: number;
    currency: string;
    items?: any[];
    transaction_id?: string;
  }) => {
    if (!analyticsSettings?.enableEcommerceTracking) return;

    // Google Analytics purchase tracking
    if (analyticsSettings.enableGoogleAnalytics && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: purchaseData.transaction_id,
        value: purchaseData.value,
        currency: purchaseData.currency,
        items: purchaseData.items,
      });
    }

    // Facebook Pixel purchase tracking
    if (analyticsSettings.enableFacebookPixel && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: purchaseData.value,
        currency: purchaseData.currency,
      });
    }
  };

  const trackAddToCart = (itemData: {
    value: number;
    currency: string;
    items?: any[];
  }) => {
    if (!analyticsSettings?.enableEcommerceTracking) return;

    // Google Analytics add to cart tracking
    if (analyticsSettings.enableGoogleAnalytics && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        value: itemData.value,
        currency: itemData.currency,
        items: itemData.items,
      });
    }

    // Facebook Pixel add to cart tracking
    if (analyticsSettings.enableFacebookPixel && window.fbq) {
      window.fbq('track', 'AddToCart', {
        value: itemData.value,
        currency: itemData.currency,
      });
    }
  };

  const trackConversion = (conversionData: {
    event_name: string;
    value?: number;
    currency?: string;
  }) => {
    if (!analyticsSettings?.enableConversionTracking) return;

    // Google Analytics conversion tracking
    if (analyticsSettings.enableGoogleAnalytics && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: analyticsSettings.googleAnalyticsId,
        event_name: conversionData.event_name,
        value: conversionData.value,
        currency: conversionData.currency,
      });
    }

    // Facebook Pixel conversion tracking
    if (analyticsSettings.enableFacebookPixel && window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: conversionData.event_name,
        value: conversionData.value,
        currency: conversionData.currency,
      });
    }
  };

  return {
    trackEvent,
    trackPurchase,
    trackAddToCart,
    trackConversion,
    isEnabled: !!analyticsSettings,
  };
}