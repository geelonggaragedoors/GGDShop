const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

/**
 * Check current IP and test Interparcel API with rate limiting
 */

async function checkCurrentIP() {
  try {
    console.log('🌐 Checking current public IP address...');
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.log('❌ Could not determine public IP:', error.message);
    return null;
  }
}

async function testInterparcelWithRateLimit() {
  console.log('🚚 Interparcel API Test with Rate Limiting');
  console.log('==========================================');
  
  // Check current IP
  const currentIP = await checkCurrentIP();
  const allowedIPs = ['104.21.10.218'];
  
  console.log(`📍 Current IP: ${currentIP || 'Unknown'}`);
  console.log(`🔒 Allowed IPs: ${allowedIPs.join(', ')}`);
  
  if (currentIP && !allowedIPs.includes(currentIP)) {
    console.log('⚠️  WARNING: Your current IP is not in the allowed list!');
    console.log('   This is likely why you\'re getting 401 Unauthorized errors.');
    console.log('   You may need to:');
    console.log('   1. Contact Interparcel to add your IP to the allowlist');
    console.log('   2. Use a VPN or proxy with the allowed IP');
    console.log('   3. Deploy from a server with the allowed IP');
    console.log('');
  } else if (currentIP && allowedIPs.includes(currentIP)) {
    console.log('✅ Your IP is allowed! Authentication should work.');
    console.log('');
  }

  // Test with proper rate limiting
  console.log('🔄 Testing API with rate limiting (5 requests/minute)...');
  console.log(`🔑 API Key: ${process.env.INTERPARCEL_API_KEY ? 'Loaded ✅' : 'Missing ❌'}`);
  
  if (!process.env.INTERPARCEL_API_KEY) {
    console.log('❌ INTERPARCEL_API_KEY not found in environment variables');
    return;
  }

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

  // Test different endpoints with rate limiting
  const endpoints = [
    'https://api.interparcel.com/quote',
    'https://api.interparcel.com/v1/quote',
    'https://api.interparcel.com/v2/quote'
  ];

  const authMethods = [
    { name: 'Bearer Token', headers: { 'Authorization': `Bearer ${process.env.INTERPARCEL_API_KEY}` }},
    { name: 'X-API-Key', headers: { 'X-API-Key': `${process.env.INTERPARCEL_API_KEY}` }}
  ];

  let requestCount = 0;
  const maxRequests = 4; // Stay under 5/minute limit

  for (const endpoint of endpoints) {
    if (requestCount >= maxRequests) {
      console.log('⏸️  Reached rate limit, stopping tests');
      break;
    }

    console.log(`\n🌐 Testing: ${endpoint}`);
    
    for (const authMethod of authMethods) {
      if (requestCount >= maxRequests) break;

      console.log(`   🔑 ${authMethod.name}...`);
      
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
        requestCount++;

        console.log(`      Status: ${response.status} ${response.statusText}`);
        
        if (response.ok && data.status === 0) {
          console.log(`      ✅ SUCCESS! Found ${data.services?.length || 0} services`);
          if (data.services && data.services.length > 0) {
            const cheapest = data.services.reduce((min, curr) => curr.price < min.price ? curr : min);
            console.log(`      💰 Cheapest: ${cheapest.carrier} ${cheapest.name} - $${cheapest.price}`);
          }
          
          // If we found a working method, we can stop testing
          console.log('\n🎉 WORKING AUTHENTICATION FOUND!');
          console.log(`   Endpoint: ${endpoint}`);
          console.log(`   Auth Method: ${authMethod.name}`);
          return { success: true, endpoint, authMethod: authMethod.name };
          
        } else {
          console.log(`      ❌ Error: ${data.errorMessage || data.error || 'Unknown'}`);
          console.log(`      Code: ${data.errorCode || 'N/A'}`);
        }

        // Rate limiting delay (12 seconds = 5 requests per minute)
        if (requestCount < maxRequests) {
          console.log('      ⏳ Waiting 15 seconds for rate limiting...');
          await new Promise(resolve => setTimeout(resolve, 15000));
        }

      } catch (error) {
        console.log(`      💥 Request failed: ${error.message}`);
        requestCount++;
      }
    }
  }

  console.log('\n📊 Test Summary:');
  console.log(`   Requests made: ${requestCount}/${maxRequests}`);
  console.log('   No working authentication method found');
  
  if (currentIP && !allowedIPs.includes(currentIP)) {
    console.log('\n💡 Next Steps:');
    console.log('   1. Contact Interparcel to add your IP to allowlist');
    console.log(`   2. Request to add IP: ${currentIP}`);
    console.log('   3. Or ask for dynamic IP support');
  }

  return { success: false };
}

// Run the test
testInterparcelWithRateLimit()
  .then((result) => {
    if (result.success) {
      console.log('\n🎯 Ready to implement shipping integration!');
    } else {
      console.log('\n🔧 Authentication issues need to be resolved first.');
    }
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
