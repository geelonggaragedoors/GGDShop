#!/usr/bin/env node

/**
 * Database migration script to fix existing product images
 * Normalizes all image URLs in the products table to ensure consistent /uploads/ prefix
 * 
 * Usage:
 *   node fix-product-images.cjs [--dry-run]
 * 
 * Options:
 *   --dry-run    Preview changes without applying them
 */

const { Client } = require('pg');
require('dotenv').config();

// Normalize image URL function (same logic as frontend)
function normalizeImageUrl(imagePath, type = 'product') {
  const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800';
  const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800';
  
  if (!imagePath || imagePath.trim() === '') {
    return type === 'product' ? DEFAULT_PRODUCT_IMAGE : DEFAULT_CATEGORY_IMAGE;
  }

  const cleanPath = imagePath.trim();

  // If already a full URL (starts with http), return as-is
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // If it's a relative path (starts with /uploads/), return as-is
  if (cleanPath.startsWith('/uploads/')) {
    return cleanPath;
  }

  // If path already contains 'uploads/' prefix (without leading slash), add only the leading slash
  if (cleanPath.startsWith('uploads/')) {
    return `/${cleanPath}`;
  }

  // If it's just a filename or relative path, add /uploads/ prefix
  if (!cleanPath.startsWith('/')) {
    return `/uploads/${cleanPath}`;
  }

  // If it starts with / but not /uploads/, return as-is to avoid misrouting valid URLs
  // Only product images are guaranteed to be either full URLs or already under /uploads/
  if (cleanPath.startsWith('/') && !cleanPath.startsWith('/uploads/')) {
    return cleanPath;
  }

  return cleanPath;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  
  console.log('🔧 Product Images Migration Script');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (preview only)' : 'LIVE (will apply changes)'}`);
  console.log('');

  // Create database connection
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Query all products with images
    const result = await client.query(
      'SELECT id, name, images FROM products WHERE images IS NOT NULL AND images != \'null\' AND images != \'[]\''
    );

    console.log(`📊 Found ${result.rows.length} products with images`);
    console.log('');

    let updatedCount = 0;
    let errorCount = 0;

    for (const product of result.rows) {
      try {
        let images = product.images;
        
        // Parse images if it's a string
        if (typeof images === 'string') {
          try {
            images = JSON.parse(images);
          } catch (e) {
            console.log(`⚠️  Product ${product.name}: Could not parse images JSON`);
            errorCount++;
            continue;
          }
        }

        // Skip if not an array
        if (!Array.isArray(images)) {
          console.log(`⚠️  Product ${product.name}: Images is not an array`);
          errorCount++;
          continue;
        }

        // Normalize each image URL
        const normalizedImages = images
          .filter(img => img && typeof img === 'string' && img.trim() !== '')
          .map(img => normalizeImageUrl(img, 'product'));

        // Check if any changes were made
        const originalJson = JSON.stringify(images);
        const normalizedJson = JSON.stringify(normalizedImages);
        
        if (originalJson !== normalizedJson) {
          console.log(`🔄 Product: ${product.name}`);
          console.log(`   Original: ${originalJson}`);
          console.log(`   Normalized: ${normalizedJson}`);
          
          if (!isDryRun) {
            // Update the product in database
            await client.query(
              'UPDATE products SET images = $1 WHERE id = $2',
              [normalizedJson, product.id]
            );
            console.log(`   ✅ Updated in database`);
          } else {
            console.log(`   📋 Would update in database`);
          }
          
          updatedCount++;
          console.log('');
        }
      } catch (error) {
        console.error(`❌ Error processing product ${product.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('📈 Migration Summary:');
    console.log(`   Products processed: ${result.rows.length}`);
    console.log(`   Products updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (isDryRun) {
      console.log('');
      console.log('🔍 This was a dry run. No changes were applied.');
      console.log('   Run without --dry-run to apply changes.');
    } else {
      console.log('');
      console.log('✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
main().catch(console.error);
