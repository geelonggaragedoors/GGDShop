import { nanoid } from "nanoid";

interface PageViewData {
  sessionId: string;
  userId?: string;
  path: string;
  title?: string;
  referrer?: string;
  userAgent: string;
  device: string;
  browser: string;
}

interface EventData {
  sessionId: string;
  userId?: string;
  eventType: string;
  eventCategory?: string;
  eventLabel?: string;
  eventValue?: number;
  path: string;
  metadata?: any;
}

interface ConversionData {
  sessionId: string;
  step: string;
  stepOrder: number;
  path: string;
}

class ClientAnalytics {
  private sessionId: string;
  private sessionStartTime: number;
  private pageViews: number = 0;
  private events: number = 0;
  private lastPath: string = '';
  private pageStartTime: number = 0;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    this.initializeSession();
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('analytics_session_id');
    const sessionExpiry = localStorage.getItem('analytics_session_expiry');
    
    if (!sessionId || !sessionExpiry || Date.now() > parseInt(sessionExpiry)) {
      sessionId = nanoid();
      localStorage.setItem('analytics_session_id', sessionId);
      localStorage.setItem('analytics_session_expiry', (Date.now() + 30 * 60 * 1000).toString()); // 30 minutes
    }
    
    return sessionId;
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iP(hone|od|ad)|BlackBerry|IEMobile/.test(userAgent)) {
      return 'mobile';
    } else if (/Tablet|iPad/.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Other';
  }

  private async sendData(endpoint: string, data: any) {
    try {
      await fetch(`/api/analytics/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  private initializeSession() {
    const userId = this.getCurrentUserId();
    this.sendData('session', {
      id: this.sessionId,
      userId,
      landingPage: window.location.pathname,
      referrer: document.referrer,
      device: this.getDeviceType(),
      browser: this.getBrowser(),
      country: 'AU', // Default to Australia, could be enhanced with IP geolocation
    });
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from localStorage or context
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  }

  trackPageView(path?: string, title?: string) {
    const currentPath = path || window.location.pathname;
    const pageTitle = title || document.title;
    
    // Track view duration for previous page
    if (this.lastPath && this.pageStartTime) {
      const viewDuration = Math.round((Date.now() - this.pageStartTime) / 1000);
      this.sendData('page-view-duration', {
        sessionId: this.sessionId,
        path: this.lastPath,
        viewDuration,
      });
    }

    // Track new page view
    this.pageViews++;
    this.lastPath = currentPath;
    this.pageStartTime = Date.now();

    const data: PageViewData = {
      sessionId: this.sessionId,
      userId: this.getCurrentUserId(),
      path: currentPath,
      title: pageTitle,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      device: this.getDeviceType(),
      browser: this.getBrowser(),
    };

    this.sendData('page-view', data);
    this.updateSession();
  }

  trackEvent(eventType: string, eventCategory?: string, eventLabel?: string, eventValue?: number, metadata?: any) {
    this.events++;

    const data: EventData = {
      sessionId: this.sessionId,
      userId: this.getCurrentUserId(),
      eventType,
      eventCategory,
      eventLabel,
      eventValue,
      path: window.location.pathname,
      metadata,
    };

    this.sendData('event', data);
    this.updateSession();
  }

  trackConversion(step: string, stepOrder: number) {
    const data: ConversionData = {
      sessionId: this.sessionId,
      step,
      stepOrder,
      path: window.location.pathname,
    };

    this.sendData('conversion', data);
  }

  private updateSession() {
    const sessionDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
    
    this.sendData('session-update', {
      id: this.sessionId,
      duration: sessionDuration,
      pageViews: this.pageViews,
      events: this.events,
      exitPage: window.location.pathname,
    });
  }

  // Convenience methods for common events
  trackClick(element: string, category = 'button') {
    this.trackEvent('click', category, element);
  }

  trackFormSubmit(formName: string) {
    this.trackEvent('form_submit', 'form', formName);
  }

  trackAddToCart(productId: string, productName: string, price: number) {
    this.trackEvent('add_to_cart', 'ecommerce', productName, price, { productId });
    this.trackConversion('add_to_cart', 3);
  }

  trackPurchase(orderId: string, revenue: number) {
    this.trackEvent('purchase', 'ecommerce', orderId, revenue);
    this.trackConversion('purchase', 5);
    
    // Mark session as converted
    this.sendData('session-convert', {
      id: this.sessionId,
      revenue,
    });
  }

  trackProductView(productId: string, productName: string) {
    this.trackEvent('product_view', 'ecommerce', productName, undefined, { productId });
    this.trackConversion('product_view', 2);
  }

  trackCheckoutStart() {
    this.trackEvent('checkout_start', 'ecommerce');
    this.trackConversion('checkout', 4);
  }

  // Track when user leaves the page
  trackPageExit() {
    if (this.lastPath && this.pageStartTime) {
      const viewDuration = Math.round((Date.now() - this.pageStartTime) / 1000);
      navigator.sendBeacon('/api/analytics/page-view-duration', JSON.stringify({
        sessionId: this.sessionId,
        path: this.lastPath,
        viewDuration,
      }));
    }

    const sessionDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
    navigator.sendBeacon('/api/analytics/session-end', JSON.stringify({
      id: this.sessionId,
      endTime: new Date().toISOString(),
      duration: sessionDuration,
      exitPage: window.location.pathname,
    }));
  }
}

// Create global analytics instance
export const analytics = new ClientAnalytics();

// Track page exit events
window.addEventListener('beforeunload', () => {
  analytics.trackPageExit();
});

// Track visibility change (when user switches tabs)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    analytics.trackPageExit();
  }
});