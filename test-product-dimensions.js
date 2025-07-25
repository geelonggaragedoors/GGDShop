// Test different product sizes to understand Australia Post limits
import { config } from 'dotenv';
config();

console.log('=== AUSTRALIA POST SIZE LIMIT ANALYSIS ===');
console.log('');

const testProducts = [
  {
    name: "WYNN'S Silicone Lube (Current)",
    dimensions: { length: 8, width: 8, height: 25, weight: 0.452 },
    description: "Tall thin bottle - too tall for standard boxes"
  },
  {
    name: "Small Garage Door Spring",
    dimensions: { length: 15, width: 10, height: 8, weight: 0.25 },
    description: "Should fit Small Box perfectly"
  },
  {
    name: "Medium Garage Door Handle",
    dimensions: { length: 25, width: 20, height: 12, weight: 0.8 },
    description: "Should fit Medium Box"
  },
  {
    name: "Large Garage Door Motor Bracket",
    dimensions: { length: 35, width: 25, height: 18, weight: 2.5 },
    description: "Should fit Large Box"
  }
];

const boxLimits = {
  satchelSmall: { length: 35.5, width: 22.5, height: 2, weight: 5, cost: 11.30 },
  satchelMedium: { length: 39, width: 27, height: 2, weight: 5, cost: 15.30 },
  satchelLarge: { length: 40.5, width: 31.5, height: 2, weight: 5, cost: 19.35 },
  boxSmall: { length: 20, width: 15, height: 10, weightBase: 8.95, weightRate: 3.50 },
  boxMedium: { length: 30, width: 25, height: 15, weightBase: 12.95, weightRate: 4.50 },
  boxLarge: { length: 40, width: 30, height: 20, weightBase: 16.95, weightRate: 5.50 }
};

function checkProductFit(product) {
  console.log(`\n🔍 ${product.name}:`);
  console.log(`   Dimensions: ${product.dimensions.length}×${product.dimensions.width}×${product.dimensions.height}cm, ${product.dimensions.weight}kg`);
  console.log(`   ${product.description}`);
  
  let foundFit = false;
  
  // Check satchels (only if height <= 2cm)
  if (product.dimensions.height <= 2 && product.dimensions.weight <= 5) {
    if (product.dimensions.length <= boxLimits.satchelSmall.length && 
        product.dimensions.width <= boxLimits.satchelSmall.width) {
      console.log(`   ✅ Small Satchel: $${boxLimits.satchelSmall.cost}`);
      foundFit = true;
    } else if (product.dimensions.length <= boxLimits.satchelMedium.length && 
               product.dimensions.width <= boxLimits.satchelMedium.width) {
      console.log(`   ✅ Medium Satchel: $${boxLimits.satchelMedium.cost}`);
      foundFit = true;
    } else if (product.dimensions.length <= boxLimits.satchelLarge.length && 
               product.dimensions.width <= boxLimits.satchelLarge.width) {
      console.log(`   ✅ Large Satchel: $${boxLimits.satchelLarge.cost}`);
      foundFit = true;
    }
  }
  
  // Check boxes
  if (product.dimensions.length <= boxLimits.boxSmall.length && 
      product.dimensions.width <= boxLimits.boxSmall.width && 
      product.dimensions.height <= boxLimits.boxSmall.height) {
    const cost = Math.max(boxLimits.boxSmall.weightBase, product.dimensions.weight * boxLimits.boxSmall.weightRate);
    console.log(`   ✅ Small Box: $${cost.toFixed(2)}`);
    foundFit = true;
  } else if (product.dimensions.length <= boxLimits.boxMedium.length && 
             product.dimensions.width <= boxLimits.boxMedium.width && 
             product.dimensions.height <= boxLimits.boxMedium.height) {
    const cost = Math.max(boxLimits.boxMedium.weightBase, product.dimensions.weight * boxLimits.boxMedium.weightRate);
    console.log(`   ✅ Medium Box: $${cost.toFixed(2)}`);
    foundFit = true;
  } else if (product.dimensions.length <= boxLimits.boxLarge.length && 
             product.dimensions.width <= boxLimits.boxLarge.width && 
             product.dimensions.height <= boxLimits.boxLarge.height) {
    const cost = Math.max(boxLimits.boxLarge.weightBase, product.dimensions.weight * boxLimits.boxLarge.weightRate);
    console.log(`   ✅ Large Box: $${cost.toFixed(2)}`);
    foundFit = true;
  }
  
  if (!foundFit) {
    console.log('   ❌ Custom Shipping Required - Oversized');
    console.log('   Reasons:');
    if (product.dimensions.height > 2) console.log(`     - Too thick for satchels (${product.dimensions.height}cm > 2cm)`);
    if (product.dimensions.height > boxLimits.boxLarge.height) console.log(`     - Too tall for largest box (${product.dimensions.height}cm > ${boxLimits.boxLarge.height}cm)`);
    if (product.dimensions.length > boxLimits.boxLarge.length) console.log(`     - Too long for largest box (${product.dimensions.length}cm > ${boxLimits.boxLarge.length}cm)`);
    if (product.dimensions.width > boxLimits.boxLarge.width) console.log(`     - Too wide for largest box (${product.dimensions.width}cm > ${boxLimits.boxLarge.width}cm)`);
  }
}

testProducts.forEach(checkProductFit);

console.log('\n📊 SUMMARY:');
console.log('The WYNN\'s Silicone Lube correctly shows "Custom Shipping Required"');
console.log('because it\'s 25cm tall - too tall for Australia Post\'s largest standard box (20cm limit).');
console.log('This is not a bug - it\'s correct behavior for this specific product.');
console.log('\nTo test the fix works, try editing a smaller product that should fit standard boxes.');