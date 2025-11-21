const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkProductImportIssues() {
  try {
    console.log('🔍 Analyzing product import issues...');

    // Check all products and their image/price status
    const products = await sql`
      SELECT 
        id, name, sku, images, price, compare_at_price, 
        stock_quantity, is_active, is_featured,
        created_at, category_id
      FROM products 
      ORDER BY created_at DESC
    `;
    
    console.log(`📦 Total products in database: ${products.length}`);

    // Analyze the data
    let hasImages = 0;
    let missingImages = 0;
    let hasPrice = 0;
    let missingPrice = 0;
    let hasSKU = 0;
    let missingSKU = 0;
    let isActive = 0;
    let isFeatured = 0;

    const recentProducts = products.slice(0, 10);
    
    console.log('\n📋 Recent products analysis:');
    
    products.forEach(product => {
      // Image analysis
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        hasImages++;
      } else {
        missingImages++;
      }
      
      // Price analysis
      if (product.price && parseFloat(product.price) > 0) {
        hasPrice++;
      } else {
        missingPrice++;
      }
      
      // SKU analysis
      if (product.sku && product.sku.trim()) {
        hasSKU++;
      } else {
        missingSKU++;
      }
      
      // Status analysis
      if (product.is_active) isActive++;
      if (product.is_featured) isFeatured++;
    });

    console.log('\n📊 Overall Statistics:');
    console.log(`- Products with images: ${hasImages}/${products.length} (${Math.round(hasImages/products.length*100)}%)`);
    console.log(`- Products missing images: ${missingImages}/${products.length} (${Math.round(missingImages/products.length*100)}%)`);
    console.log(`- Products with prices: ${hasPrice}/${products.length} (${Math.round(hasPrice/products.length*100)}%)`);
    console.log(`- Products missing prices: ${missingPrice}/${products.length} (${Math.round(missingPrice/products.length*100)}%)`);
    console.log(`- Products with SKUs: ${hasSKU}/${products.length} (${Math.round(hasSKU/products.length*100)}%)`);
    console.log(`- Active products: ${isActive}/${products.length} (${Math.round(isActive/products.length*100)}%)`);
    console.log(`- Featured products: ${isFeatured}/${products.length} (${Math.round(isFeatured/products.length*100)}%)`);

    // Show examples of products with and without images
    console.log('\n✅ Products WITH images (sample):');
    const withImages = products.filter(p => p.images && Array.isArray(p.images) && p.images.length > 0).slice(0, 5);
    withImages.forEach(product => {
      console.log(`- ${product.name} (${product.sku || 'No SKU'})`);
      console.log(`  Images: ${product.images.length} image(s) - ${product.images[0]}`);
      console.log(`  Price: $${product.price || '0.00'}`);
    });

    console.log('\n❌ Products WITHOUT images (sample):');
    const withoutImages = products.filter(p => !p.images || !Array.isArray(p.images) || p.images.length === 0).slice(0, 5);
    withoutImages.forEach(product => {
      console.log(`- ${product.name} (${product.sku || 'No SKU'})`);
      console.log(`  Images: ${JSON.stringify(product.images)}`);
      console.log(`  Price: $${product.price || '0.00'}`);
    });

    // Check if there are any patterns in the missing data
    console.log('\n🔍 Missing Data Patterns:');
    
    const missingBoth = products.filter(p => 
      (!p.images || !Array.isArray(p.images) || p.images.length === 0) && 
      (!p.price || parseFloat(p.price) === 0)
    );
    
    console.log(`- Products missing both images AND prices: ${missingBoth.length}`);
    
    if (missingBoth.length > 0) {
      console.log('  Examples:');
      missingBoth.slice(0, 3).forEach(product => {
        console.log(`  - ${product.name} (${product.sku || 'No SKU'})`);
      });
    }

    // Check categories
    const categoryCounts = await sql`
      SELECT c.name, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY product_count DESC
    `;

    console.log('\n📁 Products by category:');
    categoryCounts.forEach(cat => {
      console.log(`- ${cat.name}: ${cat.product_count} products`);
    });

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (missingImages > hasImages) {
      console.log('🖼️ IMAGES: Most products are missing images. This suggests:');
      console.log('   - The CSV import did not download external images');
      console.log('   - External URLs from WordPress were not converted to local uploads');
      console.log('   - Solution: Download and re-upload images or create an image migration script');
    }
    
    if (missingPrice > hasPrice) {
      console.log('💰 PRICES: Most products are missing prices. This suggests:');
      console.log('   - Price column was not mapped correctly during import');
      console.log('   - Prices were stored as 0 or null');
      console.log('   - Solution: Re-import with correct price mapping or update prices manually');
    }

    console.log('\n✅ Analysis completed!');

  } catch (error) {
    console.error('❌ Error analyzing products:', error);
    throw error;
  }
}

// Run the analysis
checkProductImportIssues()
  .then(() => {
    console.log('\n✅ Analysis completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });
