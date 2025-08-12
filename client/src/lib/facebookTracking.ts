// Facebook Pixel tracking utilities for client-side events
// These work in coordination with server-side Conversions API for deduplication

declare global {
  interface Window {
    fbq?: any;
  }
}

// Generate unique event ID for deduplication between Pixel and Conversions API
function generateEventId(eventType: string, identifier?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${eventType}_${identifier || timestamp}_${random}`;
}

// Track page view (usually automatic with pixel)
export function trackPageView(customEventId?: string): string {
  if (typeof window === 'undefined' || !window.fbq) return '';
  
  const eventId = customEventId || generateEventId('pageview');
  
  window.fbq('track', 'PageView', {}, { eventID: eventId });
  
  return eventId;
}

// Track product view
export function trackViewContent(productData: {
  contentId: string;
  contentName: string;
  contentCategory?: string;
  value?: number;
  currency?: string;
}, customEventId?: string): string {
  if (typeof window === 'undefined' || !window.fbq) return '';
  
  const eventId = customEventId || generateEventId('viewcontent', productData.contentId);
  
  window.fbq('track', 'ViewContent', {
    content_ids: [productData.contentId],
    content_name: productData.contentName,
    content_category: productData.contentCategory || 'Garage Door Parts',
    content_type: 'product',
    value: productData.value,
    currency: productData.currency || 'AUD'
  }, { eventID: eventId });
  
  return eventId;
}

// Track add to cart
export function trackAddToCart(productData: {
  contentId: string;
  contentName: string;
  contentCategory?: string;
  value: number;
  currency?: string;
  quantity?: number;
}, customEventId?: string): string {
  if (typeof window === 'undefined' || !window.fbq) return '';
  
  const eventId = customEventId || generateEventId('addtocart', productData.contentId);
  
  window.fbq('track', 'AddToCart', {
    content_ids: [productData.contentId],
    content_name: productData.contentName,
    content_category: productData.contentCategory || 'Garage Door Parts',
    content_type: 'product',
    value: productData.value,
    currency: productData.currency || 'AUD'
  }, { eventID: eventId });
  
  return eventId;
}

// Track initiate checkout
export function trackInitiateCheckout(checkoutData: {
  value: number;
  currency?: string;
  contentIds: string[];
  numItems?: number;
}, customEventId?: string): string {
  if (typeof window === 'undefined' || !window.fbq) return '';
  
  const eventId = customEventId || generateEventId('initiatecheckout');
  
  window.fbq('track', 'InitiateCheckout', {
    value: checkoutData.value,
    currency: checkoutData.currency || 'AUD',
    content_ids: checkoutData.contentIds,
    content_category: 'Garage Door Parts',
    num_items: checkoutData.numItems
  }, { eventID: eventId });
  
  return eventId;
}

// Track add payment info
export function trackAddPaymentInfo(paymentData: {
  value: number;
  currency?: string;
}, customEventId?: string): string {
  if (typeof window === 'undefined' || !window.fbq) return '';
  
  const eventId = customEventId || generateEventId('addpaymentinfo');
  
  window.fbq('track', 'AddPaymentInfo', {
    value: paymentData.value,
    currency: paymentData.currency || 'AUD',
    content_category: 'Garage Door Parts'
  }, { eventID: eventId });
  
  return eventId;
}

// Track purchase
export function trackPurchase(purchaseData: {
  value: number;
  currency?: string;
  contentIds: string[];
  contents?: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  numItems?: number;
}, customEventId?: string): string {
  if (typeof window === 'undefined' || !window.fbq) return '';
  
  const eventId = customEventId || generateEventId('purchase');
  
  window.fbq('track', 'Purchase', {
    value: purchaseData.value,
    currency: purchaseData.currency || 'AUD',
    content_ids: purchaseData.contentIds,
    contents: purchaseData.contents,
    content_type: 'product',
    num_items: purchaseData.numItems
  }, { eventID: eventId });
  
  return eventId;
}

// Track lead generation
export function trackLead(leadData?: {
  value?: number;
  currency?: string;
  contentCategory?: string;
}, customEventId?: string): string {
  if (typeof window === 'undefined' || !window.fbq) return '';
  
  const eventId = customEventId || generateEventId('lead');
  
  window.fbq('track', 'Lead', {
    value: leadData?.value,
    currency: leadData?.currency || 'AUD',
    content_category: leadData?.contentCategory || 'Garage Door Parts'
  }, { eventID: eventId });
  
  return eventId;
}

// Track custom event
export function trackCustomEvent(eventName: string, parameters: any = {}, customEventId?: string): string {
  if (typeof window === 'undefined' || !window.fbq) return '';
  
  const eventId = customEventId || generateEventId(eventName.toLowerCase());
  
  window.fbq('trackCustom', eventName, parameters, { eventID: eventId });
  
  return eventId;
}

// Helper to send event ID to server for Conversions API coordination
export async function sendEventToServer(eventType: string, eventId: string, data: any = {}) {
  try {
    await fetch('/api/facebook/track-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        eventId,
        data
      }),
    });
  } catch (error) {
    console.error('Failed to send Facebook event to server:', error);
  }
}