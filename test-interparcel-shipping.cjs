const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Test configuration for Geelong Garage Doors
const COLLECTION_ADDRESS = {
  city: "Geelong",
  state: "VIC", 
  postcode: "3220",
  country: "AU"
};

// Test delivery addresses across Australia
const TEST_DELIVERY_ADDRESSES = [
  {
    name: "Melbourne Metro",
    city: "Melbourne",
    state: "VIC",
    postcode: "3000",
    country: "AU"
  },
  {
    name: "Sydney Metro", 
    city: "Sydney",
    state: "NSW",
    postcode: "2000",
    country: "AU"
  },
  {
    name: "Brisbane Metro",
    city: "Brisbane", 
    state: "QLD",
    postcode: "4000",
    country: "AU"
  },
  {
    name: "Perth Metro",
    city: "Perth",
    state: "WA", 
    postcode: "6000",
    country: "AU"
  },
  {
    name: "Adelaide Metro",
    city: "Adelaide",
    state: "SA",
    postcode: "5000", 
    country: "AU"
  },
  {
    name: "Regional Victoria",
    city: "Ballarat",
    state: "VIC",
    postcode: "3350",
    country: "AU"
  }
];

// Test parcel configurations for garage door parts
const TEST_PARCELS = [
  {
    name: "Small Parts (Remote, Hinges)",
    weight: 0.5,
    length: 20,
    width: 15, 
    height: 10
  },
  {
    name: "Medium Parts (Motor Components)",
    weight: 2.5,
    length: 40,
    width: 30,
    height: 20
  },
  {
    name: "Large Parts (Door Panels)",
    weight: 15,
    length: 200,
    width: 50,
    height: 30
  },
  {
    name: "Heavy Parts (Motors)",
    weight: 25,
    length: 60,
    width: 40,
    height: 35
  },
  {
    name: "Multiple Small Items",
    parcels: [
      { weight: 1, length: 25, width: 20, height: 15 },
      { weight: 0.8, length: 30, width: 15, height: 10 },
      { weight: 1.2, length: 20, width: 25, height: 12 }
    ]
  }
];

async function testInterparcelQuote(delivery, parcelConfig) {
  try {
    const requestBody = {
      collection: COLLECTION_ADDRESS,
      delivery: delivery,
      parcels: parcelConfig.parcels || [parcelConfig]
    };

    console.log(`\n🧪 Testing: ${parcelConfig.name} → ${delivery.name}`);
    console.log(`📦 Parcel details:`, parcelConfig.parcels || parcelConfig);
    
    const response = await fetch('https://api.interparcel.com/quote', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.INTERPARCEL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (response.ok && data.status === 0) {
      console.log(`✅ Success! Found ${data.services?.length || 0} shipping options:`);
      
      if (data.services && data.services.length > 0) {
        // Sort by price
        const sortedServices = data.services.sort((a, b) => a.price - b.price);
        
        sortedServices.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.carrier} - ${service.name}`);
          console.log(`      Price: $${service.price} ${service.currency}`);
          console.log(`      Delivery: ${service.delivery.daysFrom}-${service.delivery.daysTo} days`);
          console.log(`      Service Level: ${service.serviceLevel}`);
          console.log(`      Pickup Type: ${service.pickupType}`);
          console.log(`      Max Weight: ${service.restrictions?.maximumWeight || 'N/A'}kg`);
          console.log(`      Max Length: ${service.restrictions?.maximumLength || 'N/A'}cm`);
          console.log('');
        });
        
        return {
          success: true,
          serviceCount: data.services.length,
          cheapestPrice: sortedServices[0].price,
          cheapestService: sortedServices[0],
          services: sortedServices
        };
      } else {
        console.log(`⚠️ No services available for this route`);
        return { success: false, reason: 'No services available' };
      }
    } else {
      console.log(`❌ API Error:`, data);
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.log(`❌ Request Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runShippingTests() {
  console.log('🚚 Interparcel Shipping Calculator Tests');
  console.log('==========================================');
  console.log(`📍 Collection Address: ${COLLECTION_ADDRESS.city}, ${COLLECTION_ADDRESS.state} ${COLLECTION_ADDRESS.postcode}`);
  console.log(`🔑 API Key: ${process.env.INTERPARCEL_API_KEY ? 'Loaded ✅' : 'Missing ❌'}`);
  
  if (!process.env.INTERPARCEL_API_KEY) {
    console.log('❌ INTERPARCEL_API_KEY not found in environment variables');
    return;
  }

  const results = [];
  
  // Test each parcel type with each delivery address
  for (const parcelConfig of TEST_PARCELS) {
    console.log(`\n📦 Testing Parcel Type: ${parcelConfig.name}`);
    console.log('='.repeat(50));
    
    for (const delivery of TEST_DELIVERY_ADDRESSES) {
      const result = await testInterparcelQuote(delivery, parcelConfig);
      results.push({
        parcel: parcelConfig.name,
        delivery: delivery.name,
        ...result
      });
      
      // Small delay to be respectful to API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Summary Report
  console.log('\n📊 TEST SUMMARY REPORT');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed tests: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n💰 Price Analysis:');
    const prices = successful.map(r => r.cheapestPrice).filter(p => p);
    if (prices.length > 0) {
      console.log(`   Cheapest shipping: $${Math.min(...prices)}`);
      console.log(`   Most expensive: $${Math.max(...prices)}`);
      console.log(`   Average price: $${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`);
    }
    
    console.log('\n🏆 Best Options by Destination:');
    const byDestination = {};
    successful.forEach(result => {
      if (!byDestination[result.delivery]) {
        byDestination[result.delivery] = [];
      }
      if (result.cheapestService) {
        byDestination[result.delivery].push(result);
      }
    });
    
    Object.keys(byDestination).forEach(destination => {
      const destResults = byDestination[destination];
      const cheapest = destResults.reduce((min, curr) => 
        curr.cheapestPrice < min.cheapestPrice ? curr : min
      );
      console.log(`   ${destination}: $${cheapest.cheapestPrice} (${cheapest.cheapestService.carrier} - ${cheapest.cheapestService.name})`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(result => {
      console.log(`   ${result.parcel} → ${result.delivery}: ${result.reason || result.error?.errorMessage || 'Unknown error'}`);
    });
  }
  
  console.log('\n✅ Shipping tests completed!');
  
  return {
    totalTests: results.length,
    successful: successful.length,
    failed: failed.length,
    results: results
  };
}

// Run the tests
runShippingTests()
  .then((summary) => {
    console.log(`\n🎯 Final Summary: ${summary.successful}/${summary.totalTests} tests passed`);
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
