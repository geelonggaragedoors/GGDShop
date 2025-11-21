const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function testFeaturedProductsAPI() {
  try {
    console.log('🔍 Testing featured products API response...');

    // Simulate the API call that the frontend makes
    const featuredProducts = await sql`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.description,
        p.price,
        p.compare_at_price,
        p.images,
        p.stock_quantity,
        p.is_active,
        p.is_featured,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_featured = true 
        AND p.is_active = true
      ORDER BY p.created_at DESC
      LIMIT 4
    `;

    console.log(`\n📦 Featured products API would return ${featuredProducts.length} products:`);

    featuredProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Slug: ${product.slug}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Price: $${product.price}`);
      console.log(`   Category: ${product.category_name || 'None'}`);
      console.log(`   Brand: ${product.brand_name || 'None'}`);
      console.log(`   Images: ${JSON.stringify(product.images)}`);
      console.log(`   Stock: ${product.stock_quantity}`);
      console.log(`   Active: ${product.is_active}`);
      console.log(`   Featured: ${product.is_featured}`);
      
      // Check if image exists
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        console.log(`   ✅ Has ${product.images.length} image(s)`);
        console.log(`   First image: ${product.images[0]}`);
      } else {
        console.log(`   ❌ No images`);
      }
    });

    // Test the actual API endpoint format
    console.log('\n🌐 Testing API endpoint format...');
    
    const apiResponse = {
      products: featuredProducts.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        shortDescription: product.short_description,
        description: product.description,
        price: parseFloat(product.price) || 0,
        compareAtPrice: product.compare_at_price ? parseFloat(product.compare_at_price) : null,
        images: product.images || [],
        stockQuantity: product.stock_quantity || 0,
        category: product.category_name,
        brand: product.brand_name,
        isActive: product.is_active,
        isFeatured: product.is_featured
      })),
      total: featuredProducts.length,
      page: 1,
      limit: 4
    };

    console.log('\n📋 API Response Structure:');
    console.log(JSON.stringify(apiResponse, null, 2));

    // Check if any images are accessible
    console.log('\n🖼️ Image accessibility check:');
    for (const product of featuredProducts) {
      if (product.images && product.images.length > 0) {
        const imageUrl = product.images[0];
        console.log(`Testing: ${imageUrl}`);
        
        if (imageUrl.startsWith('/uploads/')) {
          console.log(`✅ Local upload path - should be accessible at http://localhost:5000${imageUrl}`);
        } else if (imageUrl.startsWith('http')) {
          console.log(`🌐 External URL - ${imageUrl}`);
        } else {
          console.log(`⚠️ Unknown format - ${imageUrl}`);
        }
      }
    }

    console.log('\n✅ Featured products API test completed!');

  } catch (error) {
    console.error('❌ Error testing featured products API:', error);
    throw error;
  }
}

// Run the test
testFeaturedProductsAPI()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
