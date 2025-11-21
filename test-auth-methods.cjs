const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

/**
 * Test different authentication methods for Interparcel API
 */

const TEST_ENDPOINTS = [
  'https://api.interparcel.com/quote',
  'https://api.interparcel.com/v1/quote',
  'https://api.interparcel.com/v2/quote',
  'https://api.interparcel.com/v3/quote'
];

const AUTH_METHODS = [
  { name: 'Bearer Token', headers: { 'Authorization': `Bearer ${process.env.INTERPARCEL_API_KEY}` }},
  { name: 'API Key Direct', headers: { 'Authorization': `${process.env.INTERPARCEL_API_KEY}` }},
  { name: 'X-API-Key', headers: { 'X-API-Key': `${process.env.INTERPARCEL_API_KEY}` }},
  { name: 'API-Key', headers: { 'API-Key': `${process.env.INTERPARCEL_API_KEY}` }},
  { name: 'Interparcel-API-Key', headers: { 'Interparcel-API-Key': `${process.env.INTERPARCEL_API_KEY}` }},
  { name: 'Token', headers: { 'Token': `${process.env.INTERPARCEL_API_KEY}` }}
];

const testRequest = {
  collection: {
    city: "Geelong",
    state: "VIC",
    postcode: "3220",
    country: "AU"
  },
  delivery: {
    city: "Melbourne",
    state: "VIC",
    postcode: "3000",
    country: "AU"
  },
  parcels: [{
    weight: 2,
    length: 30,
    width: 20,
    height: 15
  }]
};

async function testAuthMethod(endpoint, authMethod) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Geelong-Garage-Doors/1.0',
      ...authMethod.headers
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(testRequest)
    });

    const data = await response.json();
    
    return {
      success: response.ok && data.status === 0,
      status: response.status,
      statusText: response.statusText,
      data: data,
      endpoint: endpoint,
      authMethod: authMethod.name
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      endpoint: endpoint,
      authMethod: authMethod.name
    };
  }
}

async function testAllCombinations() {
  console.log('🔐 Interparcel API Authentication Method Testing');
  console.log('='.repeat(50));
  console.log(`🔑 API Key: ${process.env.INTERPARCEL_API_KEY ? 'Loaded ✅' : 'Missing ❌'}`);
  console.log('');

  if (!process.env.INTERPARCEL_API_KEY) {
    console.log('❌ INTERPARCEL_API_KEY not found in environment variables');
    return;
  }

  const results = [];

  for (const endpoint of TEST_ENDPOINTS) {
    console.log(`\n🌐 Testing Endpoint: ${endpoint}`);
    console.log('-'.repeat(40));

    for (const authMethod of AUTH_METHODS) {
      console.log(`   🔑 ${authMethod.name}... `, { end: '' });
      
      const result = await testAuthMethod(endpoint, authMethod);
      results.push(result);

      if (result.success) {
        console.log('✅ SUCCESS!');
        console.log(`      Found ${result.data.services?.length || 0} services`);
        if (result.data.services && result.data.services.length > 0) {
          const cheapest = result.data.services.reduce((min, curr) => curr.price < min.price ? curr : min);
          console.log(`      Cheapest: ${cheapest.carrier} ${cheapest.name} - $${cheapest.price}`);
        }
      } else if (result.error) {
        console.log(`❌ ERROR: ${result.error}`);
      } else {
        console.log(`❌ ${result.status} - ${result.data?.errorMessage || result.statusText}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Summary
  console.log('\n📊 AUTHENTICATION TEST SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful combinations: ${successful.length}/${results.length}`);
  console.log(`❌ Failed combinations: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log('\n🎉 WORKING COMBINATIONS:');
    successful.forEach(result => {
      console.log(`   ✅ ${result.endpoint} + ${result.authMethod}`);
    });
  } else {
    console.log('\n❌ No working combinations found');
    console.log('\n🔍 Common error patterns:');
    const errorCounts = {};
    failed.forEach(result => {
      const error = result.data?.errorMessage || result.error || result.statusText;
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });
    
    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`   ${error}: ${count} occurrences`);
    });

    console.log('\n💡 Recommendations:');
    console.log('   1. Contact Interparcel support at (02) 8373 9108');
    console.log('   2. Verify API key is activated for your account');
    console.log('   3. Check if there are additional setup steps required');
    console.log('   4. Ask for the correct endpoint URL and authentication method');
  }

  return results;
}

// Run all authentication tests
testAllCombinations()
  .then((results) => {
    const successful = results.filter(r => r.success);
    console.log(`\n🏁 Testing completed: ${successful.length} working methods found`);
    process.exit(successful.length > 0 ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
