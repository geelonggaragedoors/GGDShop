import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { parse } from 'csv-parse';
import { db } from './db';
import { products, categories, brands } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { fileStorage } from './fileStorage';

interface WooCommerceProduct {
  ID: string;
  Type: string;
  SKU: string;
  Name: string;
  Published: string;
  'Is featured?': string;
  'Short description': string;
  Description: string;
  'In stock?': string;
  Stock: string;
  'Weight (kg)': string;
  'Length (cm)': string;
  'Width (cm)': string;
  'Height (cm)': string;
  'Regular price': string;
  Categories: string;
  Images: string;
  'Part Number': string;
}

export class ImportService {
  private async downloadImage(url: string): Promise<{ filename: string; url: string } | null> {
    if (!url || !url.startsWith('http')) {
      return null;
    }

    try {
      const protocol = url.startsWith('https') ? https : http;
      
      return new Promise((resolve, reject) => {
        const request = protocol.get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download image: ${response.statusCode}`));
            return;
          }

          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', async () => {
            try {
              const buffer = Buffer.concat(chunks);
              const urlPath = new URL(url).pathname;
              const originalName = path.basename(urlPath) || 'image.jpg';
              const mimeType = response.headers['content-type'] || 'image/jpeg';
              
              const result = await fileStorage.saveFile(buffer, originalName, mimeType);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
        });

        request.on('error', reject);
        request.setTimeout(30000, () => {
          request.destroy();
          reject(new Error('Image download timeout'));
        });
      });
    } catch (error) {
      console.error('Error downloading image:', url, error);
      return null;
    }
  }

  private async findOrCreateCategory(categoryPath: string): Promise<string> {
    // Parse category path like "Category > Subcategory"
    const parts = categoryPath.split(' > ').map(p => p.trim());
    const mainCategory = parts[0];
    
    // Check if category exists
    const existingCategory = await db.select()
      .from(categories)
      .where(eq(categories.name, mainCategory))
      .limit(1);

    if (existingCategory.length > 0) {
      return existingCategory[0].id;
    }

    // Create new category
    const [newCategory] = await db.insert(categories).values({
      name: mainCategory,
      slug: mainCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `Imported from WooCommerce: ${mainCategory}`,
      isActive: true
    }).returning();

    return newCategory.id;
  }

  private async findOrCreateBrand(brandName: string): Promise<string> {
    if (!brandName) {
      // Create a default brand if none specified
      brandName = 'Generic';
    }

    const existingBrand = await db.select()
      .from(brands)
      .where(eq(brands.name, brandName))
      .limit(1);

    if (existingBrand.length > 0) {
      return existingBrand[0].id;
    }

    // Create new brand
    const [newBrand] = await db.insert(brands).values({
      name: brandName,
      slug: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `Imported from WooCommerce`,
      isActive: true
    }).returning();

    return newBrand.id;
  }

  private generateSKU(name: string): string {
    const prefix = name.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const suffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}${suffix}`;
  }

  private cleanHtml(html: string): string {
    if (!html) return '';
    
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractBrandFromName(name: string): string {
    const brandKeywords = ['B&D', 'Merlin', 'ATA', 'Gliderol', 'Dominator', 'Steeline', 'BOSS', 'Trio-Code', 'SecuraCode'];
    
    for (const brand of brandKeywords) {
      if (name.toUpperCase().includes(brand.toUpperCase())) {
        return brand;
      }
    }
    
    return 'Generic';
  }

  async importFromWooCommerce(csvFilePath: string): Promise<{
    success: boolean;
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };

    try {
      const csvContent = fs.readFileSync(csvFilePath, 'utf8');
      
      return new Promise((resolve) => {
        parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        }, async (err, records: WooCommerceProduct[]) => {
          if (err) {
            results.success = false;
            results.errors.push(`CSV parsing error: ${err.message}`);
            resolve(results);
            return;
          }

          for (const record of records) {
            try {
              // Skip if not a simple product or no name
              if (record.Type !== 'simple' || !record.Name) {
                results.skipped++;
                continue;
              }

              // Check if product already exists by name
              const existingProduct = await db.select()
                .from(products)
                .where(eq(products.name, record.Name))
                .limit(1);

              if (existingProduct.length > 0) {
                results.skipped++;
                continue;
              }

              // Extract brand from name or part number
              const brandName = this.extractBrandFromName(record.Name);
              const brandId = await this.findOrCreateBrand(brandName);

              // Process categories
              const categoryId = record.Categories ? 
                await this.findOrCreateCategory(record.Categories) : 
                await this.findOrCreateCategory('Imported Products');

              // Download and process images
              const imageUrls: string[] = [];
              if (record.Images) {
                const images = record.Images.split(',').map(img => img.trim());
                
                for (const imageUrl of images) {
                  if (imageUrl) {
                    const downloadedImage = await this.downloadImage(imageUrl);
                    if (downloadedImage) {
                      imageUrls.push(downloadedImage.url);
                    }
                  }
                }
              }

              // Parse numeric values
              const price = parseFloat(record['Regular price']) || 0;
              const weight = parseFloat(record['Weight (kg)']) || 0;
              const length = parseFloat(record['Length (cm)']) || 0;
              const width = parseFloat(record['Width (cm)']) || 0;
              const height = parseFloat(record['Height (cm)']) || 0;
              const stockQuantity = parseInt(record.Stock) || 0;

              // Clean descriptions
              const shortDescription = this.cleanHtml(record['Short description']);
              const description = this.cleanHtml(record.Description);

              // Create product
              const productData = {
                name: record.Name,
                slug: record.Name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                sku: record.SKU || this.generateSKU(record.Name),
                description: description,
                shortDescription: shortDescription,
                price: price,
                weight: weight,
                length: length,
                width: width,
                height: height,
                stockQuantity: stockQuantity,
                categoryId: categoryId,
                brandId: brandId,
                images: imageUrls,
                isActive: record.Published === '1',
                isFeatured: record['Is featured?'] === '1',
                boxSize: '' // Will be calculated later based on dimensions
              };

              await db.insert(products).values(productData);
              results.imported++;

              console.log(`Imported: ${record.Name}`);

            } catch (error) {
              results.errors.push(`Error importing "${record.Name}": ${error.message}`);
              console.error(`Error importing product ${record.Name}:`, error);
            }
          }

          resolve(results);
        });
      });

    } catch (error) {
      results.success = false;
      results.errors.push(`File reading error: ${error.message}`);
      return results;
    }
  }
}

export const importService = new ImportService();