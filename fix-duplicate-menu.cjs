const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function fixDuplicateMenuItems() {
  try {
    console.log('🔍 Checking for duplicate menu items...');

    // Get all menu items
    const menuItems = await sql`
      SELECT id, label, type, custom_url, category_id, parent_id, sort_order, is_visible
      FROM menu_items 
      ORDER BY sort_order, label
    `;
    
    console.log(`Found ${menuItems.length} menu items:`);
    menuItems.forEach(item => {
      console.log(`- ${item.label} (${item.type}) | Sort: ${item.sort_order} | Parent: ${item.parent_id || 'None'} | Visible: ${item.is_visible}`);
    });

    // Find duplicates by label
    const labelCounts = {};
    menuItems.forEach(item => {
      labelCounts[item.label] = (labelCounts[item.label] || 0) + 1;
    });

    const duplicates = Object.entries(labelCounts).filter(([label, count]) => count > 1);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }

    console.log('\n🚨 Found duplicates:');
    duplicates.forEach(([label, count]) => {
      console.log(`- "${label}" appears ${count} times`);
    });

    // Remove duplicates, keeping the first occurrence of each
    console.log('\n🧹 Removing duplicates...');
    
    for (const [duplicateLabel] of duplicates) {
      const itemsWithLabel = menuItems.filter(item => item.label === duplicateLabel);
      
      // Keep the first one, remove the rest
      const toKeep = itemsWithLabel[0];
      const toRemove = itemsWithLabel.slice(1);
      
      console.log(`\nKeeping: ${toKeep.label} (ID: ${toKeep.id}, Sort: ${toKeep.sort_order})`);
      
      for (const item of toRemove) {
        console.log(`Removing: ${item.label} (ID: ${item.id}, Sort: ${item.sort_order})`);
        await sql`DELETE FROM menu_items WHERE id = ${item.id}`;
      }
    }

    // Get the cleaned menu items
    const cleanedMenuItems = await sql`
      SELECT id, label, type, custom_url, category_id, parent_id, sort_order, is_visible
      FROM menu_items 
      ORDER BY sort_order, label
    `;

    console.log('\n✅ Cleaned menu structure:');
    cleanedMenuItems.forEach(item => {
      const indent = item.parent_id ? '  └── ' : '├── ';
      console.log(`${indent}${item.label} (Sort: ${item.sort_order})`);
    });

    // Fix sort order to be sequential
    console.log('\n🔢 Fixing sort order...');
    const topLevelItems = cleanedMenuItems.filter(item => !item.parent_id);
    
    for (let i = 0; i < topLevelItems.length; i++) {
      const newSortOrder = i + 1;
      if (topLevelItems[i].sort_order !== newSortOrder) {
        await sql`
          UPDATE menu_items 
          SET sort_order = ${newSortOrder}
          WHERE id = ${topLevelItems[i].id}
        `;
        console.log(`Updated ${topLevelItems[i].label} sort order: ${topLevelItems[i].sort_order} → ${newSortOrder}`);
      }
    }

    console.log('\n🎉 Menu cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing menu items:', error);
    throw error;
  }
}

// Run the fix
fixDuplicateMenuItems()
  .then(() => {
    console.log('\n✅ Menu items fixed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to fix menu items:', error);
    process.exit(1);
  });
