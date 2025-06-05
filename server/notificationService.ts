import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { db } from './db';
import { notifications } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import type { InsertNotification, Notification } from '@shared/schema';

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
      verifyClient: (info) => {
        // Add authentication verification here if needed
        return true;
      }
    });

    this.wss.on('connection', (ws, req) => {
      console.log('New notification WebSocket connection');

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

      ws.on('close', () => {
        this.removeClient(ws);
        console.log('Notification WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClient(ws);
      });
    });

    console.log('Notification WebSocket server initialized on /ws/notifications');
  }

  private addClient(userId: string, ws: WebSocket) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }
    this.clients.get(userId)!.push({ ws, userId });
  }

  private removeClient(ws: WebSocket) {
    for (const [userId, clients] of this.clients.entries()) {
      const index = clients.findIndex(client => client.ws === ws);
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
      .where(eq(notifications.userId, userId))
      .where(eq(notifications.isRead, false))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
    
    return result.rowCount > 0;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId))
      .where(eq(notifications.isRead, false));
    
    return result.rowCount > 0;
  }
}

export const notificationService = new NotificationService();