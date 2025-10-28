// XML Sitemap Generator for SEO
import { db } from './db';
import { products, categories } from '../shared/schema';
import { eq } from 'drizzle-orm';

interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

class SitemapService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Use environment variable or correct canonical domain
    this.baseUrl = baseUrl || process.env.SITE_URL || 'https://geelonggaragedoors.com.au';
  }

  private formatDate(date: Date | null): string {
    if (!date) return new Date().toISOString().split('T')[0];
    return new Date(date).toISOString().split('T')[0];
  }

  private generateXML(urls: SitemapURL[]): string {
    const urlEntries = urls.map(url => {
      let entry = `  <url>\n    <loc>${url.loc}</loc>\n`;
      
      if (url.lastmod) {
        entry += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }
      if (url.changefreq) {
        entry += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }
      if (url.priority) {
        entry += `    <priority>${url.priority}</priority>\n`;
      }
      
      entry += `  </url>`;
      return entry;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
  }

  async generateSitemap(): Promise<string> {
    const urls: SitemapURL[] = [];

    // Static pages with high priority
    urls.push({
      loc: this.baseUrl,
      changefreq: 'weekly',
      priority: '1.0',
      lastmod: this.formatDate(new Date())
    });

    urls.push({
      loc: `${this.baseUrl}/products`,
      changefreq: 'daily',
      priority: '0.9',
      lastmod: this.formatDate(new Date())
    });

    urls.push({
      loc: `${this.baseUrl}/about`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: this.formatDate(new Date())
    });

    urls.push({
      loc: `${this.baseUrl}/contact`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: this.formatDate(new Date())
    });

    // Fetch all active categories
    const allCategories = await db.select().from(categories);
    for (const category of allCategories) {
      if (category.slug) {
        urls.push({
          loc: `${this.baseUrl}/product-category/${category.slug}`,
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: this.formatDate(category.updatedAt)
        });
      }
    }

    // Fetch all active products
    const allProducts = await db.select().from(products).where(eq(products.isActive, true));
    for (const product of allProducts) {
      if (product.slug) {
        urls.push({
          loc: `${this.baseUrl}/product/${product.slug}`,
          changefreq: 'weekly',
          priority: '0.6',
          lastmod: this.formatDate(product.updatedAt)
        });
      }
    }

    return this.generateXML(urls);
  }
}

export const sitemapService = new SitemapService();
