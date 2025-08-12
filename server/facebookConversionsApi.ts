import crypto from 'crypto';

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  customerId?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
}

interface CustomData {
  currency?: string;
  value?: number;
  orderId?: string;
  contentIds?: string[];
  contents?: Array<{
    id: string;
    quantity: number;
    itemPrice: number;
    title?: string;
    category?: string;
  }>;
  contentCategory?: string;
  contentName?: string;
  contentType?: string;
  numItems?: number;
}

interface FacebookEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  action_source: string;
  event_source_url?: string;
  user_data: any;
  custom_data?: any;
}

class FacebookConversionsAPI {
  private pixelId: string;
  private accessToken: string;
  private apiVersion: string = 'v19.0';

  constructor() {
    // Use the hardcoded Facebook Pixel ID since it's already configured in the HTML
    this.pixelId = '1076872737889760';
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN || '';
    
    console.log('Facebook Conversions API initialized:', {
      pixelId: this.pixelId,
      hasAccessToken: !!this.accessToken,
      accessTokenLength: this.accessToken.length
    });
  }

  private hashData(data: string): string {
    if (!data) return '';
    return crypto.createHash('sha256')
      .update(data.toLowerCase().trim())
      .digest('hex');
  }

  private formatPhone(phone: string): string {
    // Remove all non-numeric characters
    return phone.replace(/[^\d]/g, '');
  }

  private prepareUserData(userData: UserData): any {
    const prepared: any = {};

    if (userData.email) {
      prepared.em = [this.hashData(userData.email)];
    }

    if (userData.phone) {
      const formattedPhone = this.formatPhone(userData.phone);
      if (formattedPhone) {
        prepared.ph = [this.hashData(formattedPhone)];
      }
    }

    if (userData.firstName) {
      prepared.fn = [this.hashData(userData.firstName)];
    }

    if (userData.lastName) {
      prepared.ln = [this.hashData(userData.lastName)];
    }

    if (userData.city) {
      prepared.ct = [this.hashData(userData.city)];
    }

    if (userData.state) {
      prepared.st = [this.hashData(userData.state)];
    }

    if (userData.zip) {
      prepared.zp = [userData.zip];
    }

    if (userData.customerId) {
      prepared.external_id = [userData.customerId.toString()];
    }

    if (userData.clientIp) {
      prepared.client_ip_address = userData.clientIp;
    }

    if (userData.userAgent) {
      prepared.client_user_agent = userData.userAgent;
    }

    if (userData.fbp) {
      prepared.fbp = userData.fbp;
    }

    if (userData.fbc) {
      prepared.fbc = userData.fbc;
    }

    // Default country to Australia
    prepared.country = ['au'];

    return prepared;
  }

  private generateEventId(eventType: string, identifier?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${eventType}_${identifier || timestamp}_${random}`;
  }

  async sendEvent(
    eventName: string,
    userData: UserData,
    customData?: CustomData,
    eventSourceUrl?: string,
    eventId?: string
  ): Promise<boolean> {
    if (!this.pixelId || !this.accessToken) {
      console.log('Facebook Conversions API not configured - skipping event:', eventName);
      return false;
    }

    try {
      const event: FacebookEvent = {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId || this.generateEventId(eventName, customData?.orderId),
        action_source: 'website',
        user_data: this.prepareUserData(userData)
      };

      if (eventSourceUrl) {
        event.event_source_url = eventSourceUrl;
      }

      if (customData) {
        event.custom_data = customData;
      }

      const payload = {
        data: [event]
      };

      console.log('Sending Facebook Conversions API event:', {
        event_name: eventName,
        event_id: event.event_id,
        pixel_id: this.pixelId
      });

      const response = await fetch(`https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Facebook Conversions API event sent successfully:', result);
        return true;
      } else {
        console.error('Facebook Conversions API error:', result);
        return false;
      }
    } catch (error) {
      console.error('Facebook Conversions API request failed:', error);
      return false;
    }
  }

  // Standard E-commerce Events

  async trackPurchase(
    userData: UserData,
    orderData: {
      orderId: string;
      total: number;
      currency: string;
      items: Array<{
        id: string;
        title: string;
        category: string;
        price: number;
        quantity: number;
      }>;
    },
    eventSourceUrl?: string,
    eventId?: string
  ): Promise<boolean> {
    const customData: CustomData = {
      currency: orderData.currency,
      value: orderData.total,
      orderId: orderData.orderId,
      contentIds: orderData.items.map(item => item.id),
      contents: orderData.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        itemPrice: item.price,
        title: item.title,
        category: item.category
      })),
      contentCategory: 'Garage Door Parts',
      numItems: orderData.items.reduce((sum, item) => sum + item.quantity, 0)
    };

    return this.sendEvent('Purchase', userData, customData, eventSourceUrl, eventId);
  }

  async trackAddToCart(
    userData: UserData,
    productData: {
      id: string;
      title: string;
      category: string;
      price: number;
      quantity: number;
    },
    eventSourceUrl?: string,
    eventId?: string
  ): Promise<boolean> {
    const customData: CustomData = {
      currency: 'AUD',
      value: productData.price * productData.quantity,
      contentIds: [productData.id],
      contents: [{
        id: productData.id,
        quantity: productData.quantity,
        itemPrice: productData.price,
        title: productData.title,
        category: productData.category
      }],
      contentCategory: 'Garage Door Parts',
      contentName: productData.title,
      contentType: 'product'
    };

    return this.sendEvent('AddToCart', userData, customData, eventSourceUrl, eventId);
  }

  async trackViewContent(
    userData: UserData,
    productData: {
      id: string;
      title: string;
      category: string;
      price?: number;
    },
    eventSourceUrl?: string,
    eventId?: string
  ): Promise<boolean> {
    const customData: CustomData = {
      contentIds: [productData.id],
      contentCategory: productData.category,
      contentName: productData.title,
      contentType: 'product'
    };

    if (productData.price) {
      customData.currency = 'AUD';
      customData.value = productData.price;
    }

    return this.sendEvent('ViewContent', userData, customData, eventSourceUrl, eventId);
  }

  async trackInitiateCheckout(
    userData: UserData,
    cartData: {
      total: number;
      currency: string;
      items: Array<{
        id: string;
        title: string;
        category: string;
        price: number;
        quantity: number;
      }>;
    },
    eventSourceUrl?: string,
    eventId?: string
  ): Promise<boolean> {
    const customData: CustomData = {
      currency: cartData.currency,
      value: cartData.total,
      contentIds: cartData.items.map(item => item.id),
      contents: cartData.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        itemPrice: item.price,
        title: item.title,
        category: item.category
      })),
      contentCategory: 'Garage Door Parts',
      numItems: cartData.items.reduce((sum, item) => sum + item.quantity, 0)
    };

    return this.sendEvent('InitiateCheckout', userData, customData, eventSourceUrl, eventId);
  }

  async trackAddPaymentInfo(
    userData: UserData,
    cartData: {
      total: number;
      currency: string;
    },
    eventSourceUrl?: string,
    eventId?: string
  ): Promise<boolean> {
    const customData: CustomData = {
      currency: cartData.currency,
      value: cartData.total,
      contentCategory: 'Garage Door Parts'
    };

    return this.sendEvent('AddPaymentInfo', userData, customData, eventSourceUrl, eventId);
  }

  async trackLead(
    userData: UserData,
    leadData?: {
      value?: number;
      currency?: string;
      contentCategory?: string;
    },
    eventSourceUrl?: string,
    eventId?: string
  ): Promise<boolean> {
    const customData: CustomData = {
      currency: leadData?.currency || 'AUD',
      value: leadData?.value,
      contentCategory: leadData?.contentCategory || 'Garage Door Parts'
    };

    return this.sendEvent('Lead', userData, customData, eventSourceUrl, eventId);
  }
}

export const facebookConversionsAPI = new FacebookConversionsAPI();
export default facebookConversionsAPI;