import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { db } from './db';
import { notifications } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { InsertNotification, Notification } from '@shared/schema';
import { storage } from './storage';

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
}

export class NotificationService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient[]> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws/notifications',
      verifyClient: (info: any) => {
        // Reject Vite HMR connections by checking the URL and protocol
        const url = info.req.url || '';
        const protocol = info.req.headers['sec-websocket-protocol'] || '';
        
        if (url.includes('__vite_hmr') || protocol.includes('vite-hmr')) {
          return false;
        }
        return true;
      }
    });

    console.log('Notification WebSocket server initialized on /ws/notifications');

    this.wss.on('connection', (ws, req) => {
      console.log('New notification WebSocket connection');
      
      // Add ping/pong for connection health
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, 30000); // Ping every 30 seconds

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'auth' && message.userId) {
            this.addClient(message.userId, ws);
            ws.send(JSON.stringify({ type: 'auth_success', message: 'Connected to notifications' }));
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });

      ws.on('close', (code) => {
        clearInterval(pingInterval);
        this.removeClient(ws);
        console.log(`Notification WebSocket connection closed with code: ${code}`);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clearInterval(pingInterval);
        this.removeClient(ws);
      });

      ws.on('pong', () => {
        // Keep connection alive
      });
    });
  }

  private addClient(userId: string, ws: WebSocket) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }
    this.clients.get(userId)!.push({ ws, userId });
  }

  private removeClient(ws: WebSocket) {
    for (const [userId, clients] of Array.from(this.clients.entries())) {
      const index = clients.findIndex((client: ConnectedClient) => client.ws === ws);
      if (index !== -1) {
        clients.splice(index, 1);
        if (clients.length === 0) {
          this.clients.delete(userId);
        }
        break;
      }
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();

    // Send real-time notification to connected clients
    this.broadcastToUser(notification.userId, {
      type: 'notification',
      data: created
    });

    return created;
  }

  async createOrderNotification(userId: string, orderId: string, type: 'new' | 'updated', orderData: any) {
    const title = type === 'new' ? 'New Order Received' : 'Order Updated';
    const message = type === 'new' 
      ? `New order #${orderData.orderNumber} from ${orderData.customerName}`
      : `Order #${orderData.orderNumber} status changed to ${orderData.status}`;

    return this.createNotification({
      userId,
      type: `order_${type}`,
      title,
      message,
      data: { orderId, orderNumber: orderData.orderNumber, ...orderData },
      isRead: false
    });
  }

  async createLowStockNotification(userId: string, productId: string, productName: string, currentStock: number) {
    return this.createNotification({
      userId,
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${productName} is running low (${currentStock} remaining)`,
      data: { productId, productName, currentStock },
      isRead: false
    });
  }

  async createEnquiryNotification(enquiry: any) {
    const adminUsers = await storage.getStaffMembers();
    
    for (const admin of adminUsers) {
      await this.createNotification({
        userId: admin.id,
        type: 'enquiry',
        title: 'New Quote Request',
        message: `${enquiry.name} requested a quote: ${enquiry.subject}`,
        data: { enquiryId: enquiry.id, customerName: enquiry.name, subject: enquiry.subject },
        isRead: false
      });
    }
  }

  async broadcastToStaff(notification: { type: string; title: string; message: string; data?: any }) {
    try {
      const staffMembers = await storage.getStaffMembers();
      
      for (const staff of staffMembers) {
        // Create database notification
        await this.createNotification({
          userId: staff.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          isRead: false
        });

        // Send real-time notification if connected
        this.broadcastToUser(staff.id, {
          type: 'notification',
          data: {
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data
          }
        });
      }
    } catch (error) {
      console.error('Error broadcasting to staff:', error);
    }
  }

  private broadcastToUser(userId: string, message: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const messageStr = JSON.stringify(message);
      userClients.forEach(client => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(messageStr);
        }
      });
    }
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
    
    return (result.rowCount || 0) > 0;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    
    return (result.rowCount || 0) > 0;
  }
}

export const notificationService = new NotificationService();