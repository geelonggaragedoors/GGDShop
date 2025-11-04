import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { parse } from 'csv-parse/sync';
import { db } from './server/db';
import { products } from './shared/schema';
import { eq } from 'drizzle-orm';

interface CSVProduct {
  Name: string;
  Images: string;
}

async function downloadImage(url: string, targetPath: string): Promise<boolean> {
  if (!url || !url.startsWith('http')) {
    console.log(`  ❌ Invalid URL: ${url}`);
    return false;
  }

  try {
    const protocol = url.startsWith('https') ? https : http;
    
    return new Promise((resolve, reject) => {
      const request = protocol.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirects
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            console.log(`  ↪️  Redirecting to: ${redirectUrl}`);
            downloadImage(redirectUrl, targetPath).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          console.log(`  ❌ Failed to download: HTTP ${response.statusCode}`);
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(targetPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`  ✅ Downloaded: ${path.basename(targetPath)}`);
          resolve(true);
        });

        fileStream.on('error', (err) => {
          fs.unlink(targetPath, () => {});
          reject(err);
        });
      });

      request.on('error', (err) => {
        console.log(`  ❌ Download error: ${err.message}`);
        reject(err);
      });

      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Timeout'));
      });
    });
  } catch (error) {
    console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function fixMissingImages() {
  console.log('🔧 Starting image fix process...\n');

  // Read CSV
  const csvPath = 'attached_assets/wc-product-export-27-10-2025-1761532468327_1762232721153.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as CSVProduct[];

  console.log(`📄 Found ${records.length} products in CSV\n`);

  let matched = 0;
  let downloaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of records) {
    const productName = record.Name;
    const imageUrls = record.Images;

    if (!productName || !imageUrls) {
      continue;
    }

    // Find product in database by name
    const [dbProduct] = await db.select()
      .from(products)
      .where(eq(products.name, productName))
      .limit(1);

    if (!dbProduct) {
      console.log(`⚠️  Not found in DB: ${productName}`);
      skipped++;
      continue;
    }

    const dbImages = dbProduct.images as string[] || [];
    
    if (dbImages.length === 0) {
      console.log(`⚠️  No image path in DB for: ${productName}`);
      skipped++;
      continue;
    }

    console.log(`\n📦 ${productName}`);
    matched++;

    // Get first image URL from CSV
    const firstImageUrl = imageUrls.split(',')[0].trim();
    
    // Get expected path from database
    const expectedPath = dbImages[0];
    
    if (!expectedPath || !expectedPath.startsWith('/uploads/')) {
      console.log(`  ⚠️  Invalid DB path: ${expectedPath}`);
      errors++;
      continue;
    }

    // Convert /uploads/filename.jpg to uploads/filename.jpg
    const targetPath = expectedPath.substring(1);
    
    // Check if file already exists
    if (fs.existsSync(targetPath)) {
      console.log(`  ✓ Already exists: ${path.basename(targetPath)}`);
      continue;
    }

    console.log(`  📥 Downloading from WordPress...`);
    console.log(`     URL: ${firstImageUrl}`);
    console.log(`     Target: ${targetPath}`);

    try {
      const success = await downloadImage(firstImageUrl, targetPath);
      if (success) {
        downloaded++;
      } else {
        errors++;
      }
    } catch (error) {
      console.log(`  ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      errors++;
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('='.repeat(50));
  console.log(`✅ Products matched: ${matched}`);
  console.log(`📥 Images downloaded: ${downloaded}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(50));
}

fixMissingImages()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
