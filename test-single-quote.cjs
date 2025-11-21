const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

/**
 * Quick single quote test utility
 * Usage: node test-single-quote.cjs
 */

async function getSingleQuote() {
  console.log('🚚 Interparcel Single Quote Test');
  console.log('================================');
  
  if (!process.env.INTERPARCEL_API_KEY) {
    console.log('❌ INTERPARCEL_API_KEY not found in environment variables');
    return;
  }

  // Simple test: Small package from Geelong to Melbourne
  const quoteRequest = {
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

  console.log('📦 Quote Request:');
  console.log(`   From: ${quoteRequest.collection.city}, ${quoteRequest.collection.state} ${quoteRequest.collection.postcode}`);
  console.log(`   To: ${quoteRequest.delivery.city}, ${quoteRequest.delivery.state} ${quoteRequest.delivery.postcode}`);
  console.log(`   Package: ${quoteRequest.parcels[0].weight}kg, ${quoteRequest.parcels[0].length}×${quoteRequest.parcels[0].width}×${quoteRequest.parcels[0].height}cm`);
  console.log('');

  try {
    console.log('🔄 Making API request...');
    
    const response = await fetch('https://api.interparcel.com/v2/quote', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.INTERPARCEL_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Geelong-Garage-Doors/1.0'
      },
      body: JSON.stringify(quoteRequest)
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    console.log('📄 Raw Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    if (response.ok && data.status === 0) {
      if (data.services && data.services.length > 0) {
        console.log(`✅ SUCCESS! Found ${data.services.length} shipping options:`);
        console.log('');
        
        data.services.forEach((service, index) => {
          console.log(`${index + 1}. ${service.carrier} - ${service.name}`);
          console.log(`   💰 Price: $${service.price} ${service.currency}`);
          console.log(`   📅 Delivery: ${service.delivery.daysFrom}-${service.delivery.daysTo} days`);
          console.log(`   🏷️ Service Level: ${service.serviceLevel}`);
          console.log(`   📍 Pickup Type: ${service.pickupType}`);
          console.log(`   📏 Max Weight: ${service.restrictions?.maximumWeight || 'N/A'}kg`);
          console.log(`   📐 Max Length: ${service.restrictions?.maximumLength || 'N/A'}cm`);
          console.log(`   🛡️ Cover: $${service.includedCover} included (max $${service.maxCover})`);
          console.log('');
        });

        const cheapest = data.services.reduce((min, curr) => curr.price < min.price ? curr : min);
        console.log(`🏆 CHEAPEST OPTION: ${cheapest.carrier} ${cheapest.name} - $${cheapest.price}`);
        
      } else {
        console.log('⚠️ No shipping services available for this route');
      }
    } else {
      console.log('❌ API ERROR:');
      console.log(`   Status: ${data.status}`);
      console.log(`   Error: ${data.errorMessage || 'Unknown error'}`);
      console.log(`   Code: ${data.errorCode || 'N/A'}`);
    }

  } catch (error) {
    console.log('💥 REQUEST FAILED:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  }
}

// Run the test
getSingleQuote()
  .then(() => {
    console.log('✅ Single quote test completed');
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
