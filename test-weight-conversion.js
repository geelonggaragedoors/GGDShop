// Test to understand the weight conversion issue
console.log('=== WEIGHT CONVERSION TEST ===');
console.log('WYNN\'S Silicone Lube should be 452 grams');
console.log('');

// Test different scenarios
const scenarios = [
  { input: 452, label: 'If user entered 452 in grams field', conversion: 'none', result: 452 },
  { input: 0.452, label: 'If user entered 0.452 in kg field', conversion: 'kg to grams', result: 0.452 * 1000 },
  { input: 452, label: 'If 452 grams converted incorrectly', conversion: 'divide by 1000', result: 452 / 1000 },
  { input: 0.452, label: 'If 0.452 kg used directly as grams', conversion: 'wrong units', result: 0.452 }
];

scenarios.forEach(scenario => {
  console.log(`Scenario: ${scenario.label}`);
  console.log(`Input: ${scenario.input}`);
  console.log(`Result: ${scenario.result} ${scenario.conversion.includes('grams') ? 'grams' : 'kg'}`);
  
  if (scenario.result === 452) {
    console.log('✅ CORRECT - This would work properly');
  } else if (scenario.result === 0.452) {
    console.log('❌ WRONG - This would be treated as 0.452g (way too light)');
  } else {
    console.log('❓ UNCLEAR - Need to check if this makes sense');
  }
  console.log('');
});

console.log('RECOMMENDATION:');
console.log('- Use consistent grams throughout the system');
console.log('- Clear field labels: "Weight (grams)" with placeholder "452"');
console.log('- No conversions needed if everything uses grams');