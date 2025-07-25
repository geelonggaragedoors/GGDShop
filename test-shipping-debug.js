// Quick debug test to show why products are marked as oversized
import { config } from 'dotenv';
config();

console.log('=== SHIPPING DEBUG TEST ===');
console.log('Testing WYNN\'S Silicone Lube 300g');
console.log('Dimensions: 8×8×25cm, Weight: 452g');
console.log('');

// Test the size limits
const dimensions = {
  weight: 452, // grams
  length: 8,   // cm
  width: 8,    // cm  
  height: 25   // cm
};

console.log('AUSTRALIA POST LIMITS:');
console.log('- Max weight: 22,000g (22kg)');
console.log('- Max length: 105cm');
console.log('- Max width: 105cm');
console.log('- Max height: 105cm');
console.log('- Max girth: 140cm (length + 2×width + 2×height)');
console.log('');

console.log('PRODUCT DIMENSIONS:');
console.log(`- Weight: ${dimensions.weight}g (${dimensions.weight/1000}kg)`);
console.log(`- Length: ${dimensions.length}cm`);
console.log(`- Width: ${dimensions.width}cm`);
console.log(`- Height: ${dimensions.height}cm`);

const girth = dimensions.length + (2 * dimensions.width) + (2 * dimensions.height);
console.log(`- Calculated girth: ${girth}cm`);
console.log('');

console.log('SIZE CHECK RESULTS:');
console.log(`- Weight OK: ${dimensions.weight <= 22000} (${dimensions.weight} ≤ 22,000)`);
console.log(`- Length OK: ${dimensions.length <= 105} (${dimensions.length} ≤ 105)`);
console.log(`- Width OK: ${dimensions.width <= 105} (${dimensions.width} ≤ 105)`);
console.log(`- Height OK: ${dimensions.height <= 105} (${dimensions.height} ≤ 105)`);
console.log(`- Girth OK: ${girth <= 140} (${girth} ≤ 140)`);

const isOversized = (
  dimensions.weight > 22000 ||
  dimensions.length > 105 ||
  dimensions.width > 105 ||
  dimensions.height > 105 ||
  girth > 140
);

console.log('');
console.log(`FINAL RESULT: ${isOversized ? 'OVERSIZED ❌' : 'NORMAL SIZE ✅'}`);
console.log('');

console.log('API KEY STATUS:');
console.log(`- AUSPOST_API_KEY available: ${!!process.env.AUSPOST_API_KEY}`);
console.log(`- Key length: ${process.env.AUSPOST_API_KEY ? process.env.AUSPOST_API_KEY.length : 0} characters`);

if (!process.env.AUSPOST_API_KEY) {
  console.log('');
  console.log('⚠️  ISSUE IDENTIFIED:');
  console.log('   Without the API key, shipping calculations fail');
  console.log('   and the system defaults to marking items as "oversized"');
  console.log('   even when they fit normal size limits.');
}