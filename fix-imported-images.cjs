const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function fixImportedImages() {
  try {
    console.log('🔍 Checking imported products for missing images...');

    // Read the CSV file to see what images were supposed to be imported
    const csvPath = 'C:\\Users\\61479\\Documents\\GGD\\wc-product-export-27-10-2025-1761532468327.csv';
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found at:', csvPath);
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    console.log('📋 CSV Headers found:', headers.slice(0, 10), '...');
    
    // Find the indices for important columns
    const skuIndex = headers.findIndex(h => h.toLowerCase().includes('sku'));
    const nameIndex = headers.findIndex(h => h.toLowerCase().includes('name'));
    const imagesIndex = headers.findIndex(h => h.toLowerCase().includes('images'));
    const priceIndex = headers.findIndex(h => h.toLowerCase().includes('regular price'));
    
    console.log(`Column indices - SKU: ${skuIndex}, Name: ${nameIndex}, Images: ${imagesIndex}, Price: ${priceIndex}`);

    // Parse products from CSV
    const csvProducts = [];
    for (let i = 1; i < Math.min(lines.length, 50); i++) { // Check first 50 products
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Simple CSV parsing (this might need improvement for complex CSV)
      const columns = line.split(',');
      
      if (columns.length > Math.max(skuIndex, nameIndex, imagesIndex, priceIndex)) {
        const product = {
          sku: columns[skuIndex]?.replace(/"/g, ''),
          name: columns[nameIndex]?.replace(/"/g, ''),
          images: columns[imagesIndex]?.replace(/"/g, ''),
          price: columns[priceIndex]?.replace(/"/g, '')
        };
        
        if (product.sku && product.name) {
          csvProducts.push(product);
        }
      }
    }

    console.log(`\n📦 Found ${csvProducts.length} products in CSV`);

    // Check which products exist in database and their image status
    console.log('\n🔍 Checking database products...');
    
    const dbProducts = await sql`
      SELECT id, name, sku, images, price
      FROM products 
      WHERE sku IS NOT NULL AND sku != ''
      ORDER BY created_at DESC
      LIMIT 50
    `;

    console.log(`Found ${dbProducts.length} products in database with SKUs`);

    // Match CSV products with database products
    let matchedCount = 0;
    let missingImagesCount = 0;
    let hasImagesCount = 0;
    let priceIssuesCount = 0;

    console.log('\n📊 Product Analysis:');
    
    for (const dbProduct of dbProducts) {
      const csvProduct = csvProducts.find(p => p.sku === dbProduct.sku);
      
      if (csvProduct) {
        matchedCount++;
        
        const hasDbImages = dbProduct.images && Array.isArray(dbProduct.images) && dbProduct.images.length > 0;
        const hasCsvImages = csvProduct.images && csvProduct.images.trim() && !csvProduct.images.includes('undefined');
        const hasPrice = dbProduct.price && parseFloat(dbProduct.price) > 0;
        
        if (!hasDbImages && hasCsvImages) {
          missingImagesCount++;
          console.log(`❌ ${dbProduct.name} (${dbProduct.sku})`);
          console.log(`   DB Images: ${JSON.stringify(dbProduct.images)}`);
          console.log(`   CSV Images: ${csvProduct.images}`);
          console.log('');
        } else if (hasDbImages) {
          hasImagesCount++;
        }
        
        if (!hasPrice && csvProduct.price && parseFloat(csvProduct.price) > 0) {
          priceIssuesCount++;
        }
      }
    }

    console.log('\n📈 Summary:');
    console.log(`- Matched products: ${matchedCount}`);
    console.log(`- Products with images in DB: ${hasImagesCount}`);
    console.log(`- Products missing images: ${missingImagesCount}`);
    console.log(`- Products with price issues: ${priceIssuesCount}`);

    // Show some examples of products with external image URLs
    console.log('\n🌐 External image URLs found in CSV:');
    const externalImages = csvProducts
      .filter(p => p.images && p.images.includes('geelonggaragedoors.com.au'))
      .slice(0, 5);
      
    externalImages.forEach(product => {
      console.log(`- ${product.name}: ${product.images}`);
    });

    if (missingImagesCount > 0) {
      console.log('\n💡 Recommendation:');
      console.log('The CSV import did not download the external images from the WordPress site.');
      console.log('You have two options:');
      console.log('1. Manually download and upload the images through the admin interface');
      console.log('2. Create a script to automatically download the external images');
      console.log('\nWould you like me to create an image download script?');
    }

    console.log('\n✅ Image analysis completed!');

  } catch (error) {
    console.error('❌ Error analyzing imported images:', error);
    throw error;
  }
}

// Run the analysis
fixImportedImages()
  .then(() => {
    console.log('\n✅ Analysis completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });
