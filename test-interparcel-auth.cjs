const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

async function testInterparcelAuth() {
  console.log('🔐 Testing Interparcel API Authentication');
  console.log('=========================================');
  
  const apiKey = process.env.INTERPARCEL_API_KEY;
  
  if (!apiKey) {
    console.log('❌ INTERPARCEL_API_KEY not found in environment');
    return;
  }
  
  console.log(`🔑 API Key loaded: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`📏 API Key length: ${apiKey.length} characters`);
  
  // Test simple request to Melbourne
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
      weight: 1,
      length: 20,
      width: 15,
      height: 10
    }]
  };

  // Test different authentication methods
  const authMethods = [
    {
      name: "Bearer Token",
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: "API Key Header",
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    },
    {
      name: "Authorization Header (no Bearer)",
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      }
    }
  ];

  for (const method of authMethods) {
    console.log(`\n🧪 Testing: ${method.name}`);
    
    try {
      const response = await fetch('https://api.interparcel.com/v2/quote', {
        method: 'POST',
        headers: method.headers,
        body: JSON.stringify(testRequest)
      });

      const data = await response.json();
      
      console.log(`📊 Response Status: ${response.status}`);
      console.log(`📋 Response Data:`, JSON.stringify(data, null, 2));
      
      if (response.ok && data.status === 0) {
        console.log(`✅ ${method.name} - SUCCESS!`);
        console.log(`🎯 Found ${data.services?.length || 0} services`);
        return { success: true, method: method.name, data };
      } else {
        console.log(`❌ ${method.name} - Failed: ${data.errorMessage || data.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log(`❌ ${method.name} - Error: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 Authentication test completed');
  return { success: false };
}

testInterparcelAuth()
  .then((result) => {
    if (result.success) {
      console.log(`\n🎉 SUCCESS! Use "${result.method}" for authentication`);
    } else {
      console.log('\n❌ All authentication methods failed');
      console.log('💡 Suggestions:');
      console.log('   1. Verify API key is correct');
      console.log('   2. Check if API key needs to be activated');
      console.log('   3. Contact Interparcel support: (02) 8373 9108');
    }
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
  });
