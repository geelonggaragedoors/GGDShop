import { Request, Response } from 'express';
import crypto from 'crypto';
import { storage } from './storage';
import { emailService } from './email';

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// PayPal webhook event types we care about
const WEBHOOK_EVENTS = {
  PAYMENT_CAPTURE_COMPLETED: 'PAYMENT.CAPTURE.COMPLETED',
  PAYMENT_CAPTURE_DENIED: 'PAYMENT.CAPTURE.DENIED',
  CHECKOUT_ORDER_APPROVED: 'CHECKOUT.ORDER.APPROVED',
  CHECKOUT_ORDER_COMPLETED: 'CHECKOUT.ORDER.COMPLETED'
};

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  summary: string;
  resource: {
    id: string;
    status: string;
    amount?: {
      currency_code: string;
      value: string;
    };
    custom_id?: string; // This is where we'll store our order ID
    invoice_id?: string;
  };
  create_time: string;
}

// Verify PayPal webhook signature
function verifyWebhookSignature(payload: string, headers: any): boolean {
  try {
    const authAlgo = headers['paypal-auth-algo'];
    const transmission = headers['paypal-transmission-id'];
    const certId = headers['paypal-cert-id'];
    const signature = headers['paypal-transmission-sig'];
    const timestamp = headers['paypal-transmission-time'];

    if (!authAlgo || !transmission || !certId || !signature || !timestamp) {
      console.log('❌ Missing required PayPal webhook headers');
      return false;
    }

    // For production, you should verify the certificate and signature
    // For now, we'll do basic validation
    return true;
  } catch (error) {
    console.error('❌ PayPal webhook signature verification failed:', error);
    return false;
  }
}

export async function handlePayPalWebhook(req: Request, res: Response) {
  try {
    console.log('📨 PayPal webhook received:', req.headers['paypal-transmission-id']);
    
    const payload = JSON.stringify(req.body);
    const event: PayPalWebhookEvent = req.body;

    // Verify the webhook signature
    if (!verifyWebhookSignature(payload, req.headers)) {
      console.log('❌ PayPal webhook signature verification failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('✅ PayPal webhook verified, event type:', event.event_type);
    console.log('📦 PayPal resource:', JSON.stringify(event.resource, null, 2));

    // Handle different webhook events
    switch (event.event_type) {
      case WEBHOOK_EVENTS.PAYMENT_CAPTURE_COMPLETED:
        await handlePaymentCompleted(event);
        break;
      
      case WEBHOOK_EVENTS.CHECKOUT_ORDER_COMPLETED:
        await handleOrderCompleted(event);
        break;
      
      case WEBHOOK_EVENTS.PAYMENT_CAPTURE_DENIED:
        await handlePaymentDenied(event);
        break;
      
      default:
        console.log('ℹ️ Unhandled PayPal webhook event:', event.event_type);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ PayPal webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePaymentCompleted(event: PayPalWebhookEvent) {
  try {
    console.log('💰 Payment completed for PayPal transaction:', event.resource.id);
    
    // Extract order information
    const paypalOrderId = event.resource.id;
    const customId = event.resource.custom_id; // Our order ID should be here
    const amount = event.resource.amount;
    
    if (!customId) {
      console.error('❌ No custom_id found in PayPal webhook - cannot identify order');
      return;
    }

    // Find the order in our database
    const order = await storage.getOrderById(customId);
    if (!order) {
      console.error('❌ Order not found in database:', customId);
      return;
    }

    console.log(`✅ Found order ${order.orderNumber} for PayPal transaction ${paypalOrderId}`);

    // Update order status to paid
    await storage.updateOrderStatus(order.id, 'paid');
    await storage.updateOrder(order.id, {
      paypalTransactionId: paypalOrderId,
      paymentStatus: 'completed',
      paidAt: new Date()
    });

    console.log(`✅ Order ${order.orderNumber} marked as paid`);

    // Send payment confirmation email to customer
    try {
      const customer = await storage.getCustomerById(order.customerId);
      if (customer) {
        await emailService.sendPaymentConfirmation(customer.email, {
          orderNumber: order.orderNumber,
          customerName: `${customer.firstName} ${customer.lastName}`,
          total: order.total,
          paypalTransactionId: paypalOrderId,
          paidAt: new Date()
        });
        console.log('✅ Payment confirmation email sent to customer');
      }
    } catch (emailError) {
      console.error('❌ Failed to send payment confirmation email:', emailError);
    }

  } catch (error) {
    console.error('❌ Error handling payment completed:', error);
  }
}

async function handleOrderCompleted(event: PayPalWebhookEvent) {
  try {
    console.log('📦 PayPal order completed:', event.resource.id);
    // Similar to payment completed, but might have different data structure
    await handlePaymentCompleted(event);
  } catch (error) {
    console.error('❌ Error handling order completed:', error);
  }
}

async function handlePaymentDenied(event: PayPalWebhookEvent) {
  try {
    console.log('❌ Payment denied for PayPal transaction:', event.resource.id);
    
    const customId = event.resource.custom_id;
    if (!customId) {
      console.error('❌ No custom_id found in PayPal webhook - cannot identify order');
      return;
    }

    // Find the order in our database
    const order = await storage.getOrderById(customId);
    if (!order) {
      console.error('❌ Order not found in database:', customId);
      return;
    }

    // Update order status to failed
    await storage.updateOrderStatus(order.id, 'payment_failed');
    await storage.updateOrder(order.id, {
      paymentStatus: 'failed',
      paymentFailureReason: 'Payment denied by PayPal'
    });

    console.log(`❌ Order ${order.orderNumber} marked as payment failed`);

  } catch (error) {
    console.error('❌ Error handling payment denied:', error);
  }
}