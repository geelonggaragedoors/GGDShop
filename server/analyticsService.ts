import { db } from "./db";
import { pageViews, events, userSessions, conversionFunnels, seoMetrics } from "@shared/schema";
import type { InsertPageView, InsertEvent, InsertUserSession, InsertConversionFunnel, InsertSEOMetrics } from "@shared/schema";
import { eq, and, gte, lte, desc, count, sum, avg, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export class AnalyticsService {
  // Track page views with deduplication
  async trackPageView(data: Omit<InsertPageView, 'id' | 'createdAt'>): Promise<void> {
    // Check for recent duplicate page view (within 5 seconds for same session and path)
    const recentView = await db.select()
      .from(pageViews)
      .where(and(
        eq(pageViews.sessionId, data.sessionId),
        eq(pageViews.path, data.path),
        gte(pageViews.createdAt, new Date(Date.now() - 5000))
      ))
      .limit(1);

    if (recentView.length === 0) {
      await db.insert(pageViews).values({
        ...data,
        createdAt: new Date(),
      });
    }
  }

  // Track events (clicks, form submissions, etc.)
  async trackEvent(data: Omit<InsertEvent, 'id' | 'createdAt'>): Promise<void> {
    // Ensure eventName is provided, fallback to eventType if missing
    const eventData = {
      ...data,
      eventName: data.eventName || (data as any).eventType || 'unknown_event',
      createdAt: new Date(),
    };
    
    await db.insert(events).values(eventData);
  }

  // Start or update a user session
  async trackSession(data: any): Promise<void> {
    try {
      // Map 'id' to 'sessionId' if present
      const sessionData = {
        sessionId: data.sessionId || data.id,
        userId: data.userId,
        endTime: data.endTime,
        duration: data.duration,
        pageViews: data.pageViews || 0,
        events: data.events || 0,
        referrer: data.referrer,
        landingPage: data.landingPage,
        exitPage: data.exitPage,
        device: data.device,
        browser: data.browser,
        country: data.country,
        isConverted: data.isConverted || false,
        revenue: data.revenue || '0',
        startTime: new Date(),
      };

      // First try to insert
      await db.insert(userSessions).values(sessionData);
    } catch (error) {
      // If insert fails due to conflict, update the existing session
      const sessionId = data.sessionId || data.id;
      const updateData: any = {};
      if (data.endTime) updateData.endTime = data.endTime;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.pageViews !== undefined) updateData.pageViews = data.pageViews;
      if (data.events !== undefined) updateData.events = data.events;
      if (data.exitPage) updateData.exitPage = data.exitPage;
      if (data.isConverted !== undefined) updateData.isConverted = data.isConverted;
      if (data.revenue !== undefined) updateData.revenue = data.revenue;
      
      if (Object.keys(updateData).length > 0) {
        await db.update(userSessions)
          .set(updateData)
          .where(eq(userSessions.sessionId, sessionId));
      }
    }
  }

  // Track conversion funnel steps
  async trackConversion(data: Omit<InsertConversionFunnel, 'id' | 'completedAt'>): Promise<void> {
    await db.insert(conversionFunnels).values({
      ...data,
      completedAt: new Date(),
    });
  }

  // Update SEO metrics for a page
  async updateSEOMetrics(data: Omit<InsertSEOMetrics, 'id' | 'updatedAt'>): Promise<void> {
    // Sanitize numeric fields to prevent type conversion errors
    const sanitizedData = {
      ...data,
      pageSpeed: typeof data.pageSpeed === 'number' ? data.pageSpeed : 
                 (String(data.pageSpeed) === 'false' || data.pageSpeed === false ? 0 : 
                  parseInt(String(data.pageSpeed)) || 0),
      mobileUsability: typeof data.mobileUsability === 'boolean' ? data.mobileUsability : 
                      (String(data.mobileUsability) === 'false' ? false : 
                       Boolean(data.mobileUsability)),
      updatedAt: new Date(),
    };

    await db.insert(seoMetrics).values(sanitizedData).onConflictDoUpdate({
      target: seoMetrics.path,
      set: {
        title: sanitizedData.title,
        description: sanitizedData.description,
        keywords: sanitizedData.keywords,
        ogTitle: sanitizedData.ogTitle,
        ogDescription: sanitizedData.ogDescription,
        canonicalUrl: sanitizedData.canonicalUrl,
        lastCrawled: sanitizedData.lastCrawled,
        pageSpeed: sanitizedData.pageSpeed,
        mobileUsability: sanitizedData.mobileUsability,
        updatedAt: new Date(),
      },
    });
  }

  // Get analytics dashboard data
  async getDashboardData(startDate: Date, endDate: Date) {
    const pageViewsData = await db.select({
      count: count(),
      date: sql<string>`DATE(${pageViews.createdAt})`,
    })
    .from(pageViews)
    .where(and(
      gte(pageViews.createdAt, startDate),
      lte(pageViews.createdAt, endDate)
    ))
    .groupBy(sql`DATE(${pageViews.createdAt})`)
    .orderBy(sql`DATE(${pageViews.createdAt})`);

    const topPages = await db.select({
      path: pageViews.path,
      title: pageViews.title,
      views: count(),
      uniqueUsers: sql<number>`COUNT(DISTINCT ${pageViews.userId})`,
    })
    .from(pageViews)
    .where(and(
      gte(pageViews.createdAt, startDate),
      lte(pageViews.createdAt, endDate)
    ))
    .groupBy(pageViews.path, pageViews.title)
    .orderBy(desc(count()))
    .limit(10);

    const deviceStats = await db.select({
      device: pageViews.device,
      count: count(),
    })
    .from(pageViews)
    .where(and(
      gte(pageViews.createdAt, startDate),
      lte(pageViews.createdAt, endDate)
    ))
    .groupBy(pageViews.device);

    const browserStats = await db.select({
      browser: pageViews.browser,
      count: count(),
    })
    .from(pageViews)
    .where(and(
      gte(pageViews.createdAt, startDate),
      lte(pageViews.createdAt, endDate)
    ))
    .groupBy(pageViews.browser);

    const countryStats = await db.select({
      country: pageViews.country,
      count: count(),
    })
    .from(pageViews)
    .where(and(
      gte(pageViews.createdAt, startDate),
      lte(pageViews.createdAt, endDate)
    ))
    .groupBy(pageViews.country)
    .orderBy(desc(count()))
    .limit(10);

    const totalSessions = await db.select({
      count: count(),
    }).from(userSessions).where(and(
      gte(userSessions.startTime, startDate),
      lte(userSessions.startTime, endDate)
    ));

    const avgSessionDuration = await db.select({
      avgDuration: avg(userSessions.duration),
    }).from(userSessions).where(and(
      gte(userSessions.startTime, startDate),
      lte(userSessions.startTime, endDate)
    ));

    const conversionRate = await db.select({
      converted: count(),
    }).from(userSessions).where(and(
      gte(userSessions.startTime, startDate),
      lte(userSessions.startTime, endDate),
      eq(userSessions.isConverted, true)
    ));

    const totalRevenue = await db.select({
      revenue: sum(userSessions.revenue),
    }).from(userSessions).where(and(
      gte(userSessions.startTime, startDate),
      lte(userSessions.startTime, endDate)
    ));

    const topEvents = await db.select({
      eventName: events.eventName,
      eventCategory: events.eventCategory,
      eventLabel: events.eventLabel,
      count: count(),
    })
    .from(events)
    .where(and(
      gte(events.createdAt, startDate),
      lte(events.createdAt, endDate)
    ))
    .groupBy(events.eventName, events.eventCategory, events.eventLabel)
    .orderBy(desc(count()))
    .limit(20);

    const conversionFunnelData = await db.select({
      step: conversionFunnels.step,
      stepOrder: conversionFunnels.stepOrder,
      count: count(),
    })
    .from(conversionFunnels)
    .where(and(
      gte(conversionFunnels.completedAt, startDate),
      lte(conversionFunnels.completedAt, endDate)
    ))
    .groupBy(conversionFunnels.step, conversionFunnels.stepOrder)
    .orderBy(conversionFunnels.stepOrder);

    return {
      pageViews: pageViewsData,
      topPages,
      deviceStats,
      browserStats,
      countryStats,
      totalSessions: totalSessions[0]?.count || 0,
      avgSessionDuration: Math.round(Number(avgSessionDuration[0]?.avgDuration) || 0),
      conversionRate: totalSessions[0]?.count ? 
        ((conversionRate[0]?.converted || 0) / totalSessions[0].count * 100) : 0,
      totalRevenue: Number(totalRevenue[0]?.revenue) || 0,
      topEvents,
      conversionFunnel: conversionFunnelData,
    };
  }

  // Get real-time analytics (last 30 minutes)
  async getRealTimeData() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const activeUsers = await db.select({
      count: sql<number>`COUNT(DISTINCT ${pageViews.sessionId})`,
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, thirtyMinutesAgo));

    const recentPageViews = await db.select({
      path: pageViews.path,
      title: pageViews.title,
      count: count(),
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, thirtyMinutesAgo))
    .groupBy(pageViews.path, pageViews.title)
    .orderBy(desc(count()))
    .limit(10);

    const recentEvents = await db.select({
      eventName: events.eventName,
      path: events.path,
      count: count(),
    })
    .from(events)
    .where(gte(events.createdAt, thirtyMinutesAgo))
    .groupBy(events.eventName, events.path)
    .orderBy(desc(count()))
    .limit(10);

    return {
      activeUsers: activeUsers[0]?.count || 0,
      recentPageViews,
      recentEvents,
    };
  }

  // Generate a new session ID
  generateSessionId(): string {
    return nanoid();
  }

  // Detect device type from user agent
  getDeviceType(userAgent: string): string {
    if (/Mobile|Android|iP(hone|od|ad)|BlackBerry|IEMobile/.test(userAgent)) {
      return 'mobile';
    } else if (/Tablet|iPad/.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  // Extract browser from user agent
  getBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Other';
  }
}

export const analyticsService = new AnalyticsService();