const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function fixFeaturedProducts() {
  try {
    console.log('🌟 Setting featured products...');

    // Get some good products to feature (with images, from different categories)
    const candidateProducts = await sql`
      SELECT id, name, sku, images, category_id, price
      FROM products 
      WHERE is_active = true 
        AND images IS NOT NULL 
        AND jsonb_array_length(images) > 0
      ORDER BY created_at DESC
      LIMIT 20
    `;
    
    console.log(`\n📦 Found ${candidateProducts.length} candidate products with images`);

    // Select 8 diverse products to feature
    const productsToFeature = candidateProducts.slice(0, 8);
    
    console.log('\n⭐ Setting these products as featured:');
    
    for (const product of productsToFeature) {
      await sql`
        UPDATE products 
        SET is_featured = true 
        WHERE id = ${product.id}
      `;
      
      console.log(`✅ ${product.name} (${product.sku}) - $${product.price}`);
    }

    // Verify the update
    const featuredCount = await sql`
      SELECT COUNT(*) as count FROM products WHERE is_featured = true AND is_active = true
    `;
    
    console.log(`\n🎉 Successfully set ${featuredCount[0].count} products as featured!`);

    // Show the featured products
    const featuredProducts = await sql`
      SELECT p.name, p.sku, p.price, c.name as category_name, p.images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_featured = true AND p.is_active = true
      ORDER BY p.name
    `;

    console.log('\n📋 Featured products list:');
    featuredProducts.forEach((product, index) => {
      const imageCount = product.images ? product.images.length : 0;
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Category: ${product.category_name || 'Uncategorized'}`);
      console.log(`   Price: $${product.price}`);
      console.log(`   Images: ${imageCount} image(s)`);
      console.log('');
    });

    console.log('✅ Featured products setup completed!');

  } catch (error) {
    console.error('❌ Error setting featured products:', error);
    throw error;
  }
}

// Run the fix
fixFeaturedProducts()
  .then(() => {
    console.log('\n✅ Featured products fixed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to fix featured products:', error);
    process.exit(1);
  });
