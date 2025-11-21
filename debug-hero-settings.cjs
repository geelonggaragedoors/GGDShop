const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function debugHeroSettings() {
  try {
    console.log('🔍 Checking hero settings...');

    // Get all hero-related site settings
    const heroSettings = await sql`
      SELECT key, value, description 
      FROM site_settings 
      WHERE category = 'hero' 
      ORDER BY key
    `;
    
    console.log(`\n📋 Hero settings (${heroSettings.length} items):`);
    heroSettings.forEach(setting => {
      console.log(`- ${setting.key}: "${setting.value}" (${setting.description})`);
    });

    // Check if the image file exists
    const imageUrlSetting = heroSettings.find(s => s.key === 'hero_image_url');
    if (imageUrlSetting && imageUrlSetting.value) {
      console.log(`\n🖼️ Hero image URL: ${imageUrlSetting.value}`);
      
      // Check if it's a local upload
      if (imageUrlSetting.value.startsWith('/uploads/')) {
        console.log('✅ Using local upload path');
      } else if (imageUrlSetting.value.startsWith('http')) {
        console.log('🌐 Using external URL');
      } else {
        console.log('⚠️ Unknown URL format');
      }
    } else {
      console.log('❌ No hero image URL found');
    }

    console.log('\n✅ Hero settings check completed!');

  } catch (error) {
    console.error('❌ Error checking hero settings:', error);
    throw error;
  }
}

// Run the check
debugHeroSettings()
  .then(() => {
    console.log('\n✅ Debug completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  });
