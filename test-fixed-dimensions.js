// Test the fixed dimensions for WYNN'S Silicone Lube
import { config } from 'dotenv';
config();

console.log('=== FIXED DIMENSIONS TEST ===');
console.log('WYNN\'S Silicone Lube with corrected dimensions');
console.log('');

const dimensions = {
  weight: 452,  // grams - correct weight from product
  length: 8,    // cm
  width: 8,     // cm
  height: 25    // cm
};

const MAX_DIMENSIONS = {
  weight: 22000, // 22kg in grams
  length: 105,   // 105cm
  width: 105,    // 105cm
  height: 105,   // 105cm
  girth: 140     // 140cm (length + 2×width + 2×height)
};

console.log('PRODUCT DIMENSIONS:');
console.log(`- Weight: ${dimensions.weight}g (${dimensions.weight/1000}kg)`);
console.log(`- Length: ${dimensions.length}cm`);
console.log(`- Width: ${dimensions.width}cm`);
console.log(`- Height: ${dimensions.height}cm`);

const girth = dimensions.length + (2 * dimensions.width) + (2 * dimensions.height);
console.log(`- Calculated girth: ${girth}cm`);
console.log('');

console.log('SIZE CHECK RESULTS:');
console.log(`- Weight OK: ${dimensions.weight <= MAX_DIMENSIONS.weight} (${dimensions.weight} ≤ ${MAX_DIMENSIONS.weight})`);
console.log(`- Length OK: ${dimensions.length <= MAX_DIMENSIONS.length} (${dimensions.length} ≤ ${MAX_DIMENSIONS.length})`);
console.log(`- Width OK: ${dimensions.width <= MAX_DIMENSIONS.width} (${dimensions.width} ≤ ${MAX_DIMENSIONS.width})`);
console.log(`- Height OK: ${dimensions.height <= MAX_DIMENSIONS.height} (${dimensions.height} ≤ ${MAX_DIMENSIONS.height})`);
console.log(`- Girth OK: ${girth <= MAX_DIMENSIONS.girth} (${girth} ≤ ${MAX_DIMENSIONS.girth})`);

const isOversized = (
  dimensions.weight > MAX_DIMENSIONS.weight ||
  dimensions.length > MAX_DIMENSIONS.length ||
  dimensions.width > MAX_DIMENSIONS.width ||
  dimensions.height > MAX_DIMENSIONS.height ||
  girth > MAX_DIMENSIONS.girth
);

console.log('');
console.log(`FINAL RESULT: ${isOversized ? 'OVERSIZED ❌' : 'NORMAL SIZE ✅'}`);

if (!isOversized) {
  console.log('');
  console.log('SATCHEL ANALYSIS:');
  console.log('- Dimensions: 8×8×25cm = very compact');
  console.log('- Weight: 452g = well under 5kg satchel limit');
  console.log('- Shape: Long and thin - perfect for satchel');
  console.log('');
  console.log('RECOMMENDED SHIPPING:');
  console.log('- Small Satchel (500g): Perfect fit');
  console.log('- Should cost around $11-12 for domestic shipping');
}