const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkMenuStructure() {
  try {
    console.log('🔍 Checking current menu structure...');

    // Get all menu items with their categories
    const menuItems = await sql`
      SELECT 
        m.id, 
        m.label, 
        m.type, 
        m.custom_url, 
        m.parent_id, 
        m.sort_order, 
        m.is_visible,
        c.name as category_name,
        c.slug as category_slug
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.is_visible = true
      ORDER BY m.sort_order, m.label
    `;
    
    console.log(`\n📋 Current menu structure (${menuItems.length} items):`);
    
    // Show top-level items
    const topLevelItems = menuItems.filter(item => !item.parent_id);
    
    topLevelItems.forEach(item => {
      const url = item.type === 'category' && item.category_slug 
        ? `/product-category/${item.category_slug}` 
        : item.custom_url || '#';
        
      console.log(`├── ${item.label} (${item.type}) → ${url}`);
      
      // Show child items
      const childItems = menuItems.filter(child => child.parent_id === item.id);
      childItems.forEach((child, index) => {
        const isLast = index === childItems.length - 1;
        const childUrl = child.type === 'category' && child.category_slug 
          ? `/product-category/${child.category_slug}` 
          : child.custom_url || '#';
          
        console.log(`${isLast ? '└──' : '├──'}    ${child.label} (${child.type}) → ${childUrl}`);
      });
    });

    console.log('\n✅ Menu structure check completed!');

  } catch (error) {
    console.error('❌ Error checking menu structure:', error);
    throw error;
  }
}

// Run the check
checkMenuStructure()
  .then(() => {
    console.log('\n✅ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
