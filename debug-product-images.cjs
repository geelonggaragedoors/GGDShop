const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function debugProductImages() {
  try {
    console.log('🔍 Checking product images...');

    // Get a sample of products with their images
    const products = await sql`
      SELECT id, name, sku, images, category_id, is_featured
      FROM products 
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    console.log(`\n📦 Found ${products.length} products:`);
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku || 'No SKU'}`);
      console.log(`   Category ID: ${product.category_id || 'No category'}`);
      console.log(`   Featured: ${product.is_featured}`);
      console.log(`   Images: ${JSON.stringify(product.images)}`);
      
      if (product.images) {
        if (Array.isArray(product.images)) {
          console.log(`   → ${product.images.length} image(s) found`);
          product.images.forEach((img, i) => {
            console.log(`     ${i + 1}: ${img}`);
          });
        } else {
          console.log(`   → Images field is not an array: ${typeof product.images}`);
        }
      } else {
        console.log(`   → No images field`);
      }
    });

    // Check if any products have featured status
    const featuredCount = await sql`
      SELECT COUNT(*) as count FROM products WHERE is_featured = true AND is_active = true
    `;
    
    console.log(`\n⭐ Featured products: ${featuredCount[0].count}`);

    // Check categories
    const categoriesWithProducts = await sql`
      SELECT c.name, c.slug, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      GROUP BY c.id, c.name, c.slug
      ORDER BY product_count DESC
    `;
    
    console.log(`\n📁 Categories with product counts:`);
    categoriesWithProducts.forEach(cat => {
      console.log(`   ${cat.name} (${cat.slug}): ${cat.product_count} products`);
    });

    console.log('\n✅ Product images debug completed!');

  } catch (error) {
    console.error('❌ Error debugging product images:', error);
    throw error;
  }
}

// Run the debug
debugProductImages()
  .then(() => {
    console.log('\n✅ Debug completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  });
