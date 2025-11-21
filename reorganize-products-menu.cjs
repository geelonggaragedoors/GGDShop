const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function reorganizeProductsAndMenu() {
  try {
    console.log('🚀 Starting product and menu reorganization...');

    // First, let's see what products we have
    console.log('\n📦 Current products in database:');
    const products = await sql`
      SELECT p.id, p.name, p.sku, p.short_description, p.price, p.stock_quantity,
             c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.name
    `;
    
    console.log(`Found ${products.length} products`);
    products.forEach(p => {
      console.log(`- ${p.name} | Category: ${p.category_name || 'None'} | Brand: ${p.brand_name || 'None'} | Price: $${p.price}`);
    });

    // Check current categories
    console.log('\n📁 Current categories:');
    const categories = await sql`SELECT id, name, slug, parent_id FROM categories ORDER BY name`;
    console.log(`Found ${categories.length} categories`);
    categories.forEach(c => {
      console.log(`- ${c.name} (${c.slug}) | Parent: ${c.parent_id || 'None'}`);
    });

    // 1. Create the main category structure
    console.log('\n🏗️ Creating category structure...');
    
    // Clear existing categories and menu items to start fresh
    await sql`DELETE FROM menu_items`;
    await sql`DELETE FROM categories`;
    
    // Create main categories
    const doorsCategory = await sql`
      INSERT INTO categories (name, slug, description, sort_order, is_active, show_on_homepage)
      VALUES ('Doors', 'doors', 'Garage doors including sectional, roller, and tilt doors', 1, true, true)
      RETURNING id, name
    `;
    
    const motorsCategory = await sql`
      INSERT INTO categories (name, slug, description, sort_order, is_active, show_on_homepage)
      VALUES ('Motors & Openers', 'motors-openers', 'Garage door motors and opening systems', 2, true, true)
      RETURNING id, name
    `;
    
    const newPartsCategory = await sql`
      INSERT INTO categories (name, slug, description, sort_order, is_active, show_on_homepage)
      VALUES ('New Parts', 'new-parts', 'Brand new garage door parts and accessories', 3, true, true)
      RETURNING id, name
    `;
    
    const refurbishedCategory = await sql`
      INSERT INTO categories (name, slug, description, sort_order, is_active, show_on_homepage)
      VALUES ('Refurbished', 'refurbished', 'Professionally refurbished garage door parts', 4, true, false)
      RETURNING id, name
    `;
    
    const secondHandCategory = await sql`
      INSERT INTO categories (name, slug, description, sort_order, is_active, show_on_homepage)
      VALUES ('Second Hand', 'second-hand', 'Quality used garage door parts', 5, true, false)
      RETURNING id, name
    `;
    
    const clearanceCategory = await sql`
      INSERT INTO categories (name, slug, description, sort_order, is_active, show_on_homepage)
      VALUES ('Clearance Sale', 'clearance-sale', 'Discounted items and special offers', 6, true, true)
      RETURNING id, name
    `;

    // Create door subcategories
    const sectionalDoorsCategory = await sql`
      INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active)
      VALUES ('Sectional Doors', 'sectional-doors', 'Sectional garage doors', ${doorsCategory[0].id}, 1, true)
      RETURNING id, name
    `;
    
    const rollerDoorsCategory = await sql`
      INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active)
      VALUES ('Roller Doors', 'roller-doors', 'Roller garage doors', ${doorsCategory[0].id}, 2, true)
      RETURNING id, name
    `;
    
    const tiltDoorsCategory = await sql`
      INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active)
      VALUES ('Tilt Doors', 'tilt-doors', 'Tilt-up garage doors', ${doorsCategory[0].id}, 3, true)
      RETURNING id, name
    `;

    console.log('✅ Categories created successfully');

    // 2. Create menu structure
    console.log('\n🧭 Creating menu structure...');
    
    // Home menu item
    const homeMenu = await sql`
      INSERT INTO menu_items (label, type, custom_url, sort_order, is_visible)
      VALUES ('Home', 'custom', '/', 1, true)
      RETURNING id
    `;
    
    // All Products menu item
    const allProductsMenu = await sql`
      INSERT INTO menu_items (label, type, custom_url, sort_order, is_visible)
      VALUES ('All Products', 'custom', '/products', 2, true)
      RETURNING id
    `;
    
    // Doors menu item (parent)
    const doorsMenu = await sql`
      INSERT INTO menu_items (label, type, category_id, sort_order, is_visible)
      VALUES ('Doors', 'category', ${doorsCategory[0].id}, 3, true)
      RETURNING id
    `;
    
    // Door submenu items
    await sql`
      INSERT INTO menu_items (label, type, category_id, parent_id, sort_order, is_visible)
      VALUES 
        ('Sectional Doors', 'category', ${sectionalDoorsCategory[0].id}, ${doorsMenu[0].id}, 1, true),
        ('Roller Doors', 'category', ${rollerDoorsCategory[0].id}, ${doorsMenu[0].id}, 2, true),
        ('Tilt Doors', 'category', ${tiltDoorsCategory[0].id}, ${doorsMenu[0].id}, 3, true)
    `;
    
    // Other main menu items
    await sql`
      INSERT INTO menu_items (label, type, category_id, sort_order, is_visible)
      VALUES 
        ('Motors & Openers', 'category', ${motorsCategory[0].id}, 4, true),
        ('New Parts', 'category', ${newPartsCategory[0].id}, 5, true),
        ('Refurbished', 'category', ${refurbishedCategory[0].id}, 6, true),
        ('Second Hand', 'category', ${secondHandCategory[0].id}, 7, true),
        ('Clearance Sale', 'category', ${clearanceCategory[0].id}, 8, true)
    `;
    
    // Contact menu item
    await sql`
      INSERT INTO menu_items (label, type, custom_url, sort_order, is_visible)
      VALUES ('Contact', 'custom', '/contact', 9, true)
    `;

    console.log('✅ Menu structure created successfully');

    // 3. Categorize products based on their current data
    console.log('\n🏷️ Categorizing products...');
    
    for (const product of products) {
      let targetCategoryId;
      
      // Determine category based on product name and description
      const name = product.name.toLowerCase();
      const description = (product.short_description || '').toLowerCase();
      const sku = (product.sku || '').toLowerCase();
      
      // Categorize based on keywords in name, description, or SKU
      if (name.includes('clearance') || name.includes('sale') || description.includes('clearance')) {
        targetCategoryId = clearanceCategory[0].id;
      } else if (name.includes('refurbished') || description.includes('refurbished') || sku.includes('refurb')) {
        targetCategoryId = refurbishedCategory[0].id;
      } else if (name.includes('second hand') || name.includes('used') || description.includes('second hand') || description.includes('used')) {
        targetCategoryId = secondHandCategory[0].id;
      } else if (name.includes('motor') || name.includes('opener') || name.includes('remote') || description.includes('motor') || description.includes('opener')) {
        targetCategoryId = motorsCategory[0].id;
      } else if (name.includes('sectional door') || description.includes('sectional door')) {
        targetCategoryId = sectionalDoorsCategory[0].id;
      } else if (name.includes('roller door') || description.includes('roller door')) {
        targetCategoryId = rollerDoorsCategory[0].id;
      } else if (name.includes('tilt door') || description.includes('tilt door')) {
        targetCategoryId = tiltDoorsCategory[0].id;
      } else if (name.includes('door') && !name.includes('part') && !name.includes('component')) {
        targetCategoryId = doorsCategory[0].id; // General doors category
      } else {
        // Default to new parts for parts, components, and unclassified items
        targetCategoryId = newPartsCategory[0].id;
      }
      
      // Update the product's category
      await sql`
        UPDATE products 
        SET category_id = ${targetCategoryId}
        WHERE id = ${product.id}
      `;
      
      console.log(`✅ ${product.name} → ${getCategoryName(targetCategoryId, {
        [doorsCategory[0].id]: 'Doors',
        [sectionalDoorsCategory[0].id]: 'Sectional Doors',
        [rollerDoorsCategory[0].id]: 'Roller Doors',
        [tiltDoorsCategory[0].id]: 'Tilt Doors',
        [motorsCategory[0].id]: 'Motors & Openers',
        [newPartsCategory[0].id]: 'New Parts',
        [refurbishedCategory[0].id]: 'Refurbished',
        [secondHandCategory[0].id]: 'Second Hand',
        [clearanceCategory[0].id]: 'Clearance Sale'
      })}`);
    }

    console.log('\n🎉 Product and menu reorganization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Created hierarchical category structure');
    console.log('- Set up navigation menu with dropdowns');
    console.log(`- Categorized ${products.length} products`);
    console.log('\nMenu structure:');
    console.log('├── Home');
    console.log('├── All Products');
    console.log('├── Doors');
    console.log('│   ├── Sectional Doors');
    console.log('│   ├── Roller Doors');
    console.log('│   └── Tilt Doors');
    console.log('├── Motors & Openers');
    console.log('├── New Parts');
    console.log('├── Refurbished');
    console.log('├── Second Hand');
    console.log('├── Clearance Sale');
    console.log('└── Contact');

  } catch (error) {
    console.error('❌ Error during reorganization:', error);
    throw error;
  }
}

function getCategoryName(id, categoryMap) {
  return categoryMap[id] || 'Unknown Category';
}

// Run the reorganization
reorganizeProductsAndMenu()
  .then(() => {
    console.log('\n✅ All done! Your products and menu are now organized.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to reorganize:', error);
    process.exit(1);
  });
