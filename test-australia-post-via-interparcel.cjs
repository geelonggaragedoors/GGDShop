const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Test scenarios specifically for Australia Post services via Interparcel
const AUSTRALIA_POST_TEST_SCENARIOS = [
  {
    name: "Small Satchel - Remote Control",
    description: "Test Australia Post satchel for small garage door remote",
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
      weight: 0.2, // 200g - fits in small satchel
      length: 15,
      width: 8,
      height: 3
    }],
    filter: {
      carriers: ["Australia Post"]
    },
    expectedServices: ["satchel", "regular"]
  },
  {
    name: "Medium Satchel - Door Parts",
    description: "Test Australia Post medium satchel for door parts",
    collection: {
      city: "Geelong",
      state: "VIC",
      postcode: "3220", 
      country: "AU"
    },
    delivery: {
      city: "Sydney",
      state: "NSW",
      postcode: "2000",
      country: "AU"
    },
    parcels: [{
      weight: 1.5, // 1.5kg - medium satchel range
      length: 25,
      width: 20,
      height: 8
    }],
    filter: {
      carriers: ["Australia Post"]
    },
    expectedServices: ["satchel", "regular"]
  },
  {
    name: "Large Satchel - Multiple Small Parts",
    description: "Test Australia Post large satchel for multiple small parts",
    collection: {
      city: "Geelong",
      state: "VIC",
      postcode: "3220",
      country: "AU"
    },
    delivery: {
      city: "Brisbane",
      state: "QLD", 
      postcode: "4000",
      country: "AU"
    },
    parcels: [{
      weight: 3.0, // 3kg - large satchel range
      length: 35,
      width: 25,
      height: 10
    }],
    filter: {
      carriers: ["Australia Post"]
    },
    expectedServices: ["satchel", "regular"]
  },
  {
    name: "Express Satchel - Urgent Parts",
    description: "Test Australia Post express satchel services",
    collection: {
      city: "Geelong",
      state: "VIC",
      postcode: "3220",
      country: "AU"
    },
    delivery: {
      city: "Adelaide",
      state: "SA",
      postcode: "5000", 
      country: "AU"
    },
    parcels: [{
      weight: 0.8, // 800g
      length: 20,
      width: 15,
      height: 5
    }],
    filter: {
      carriers: ["Australia Post"],
      serviceLevel: ["express"]
    },
    expectedServices: ["express", "satchel"]
  },
  {
    name: "Standard Box vs Satchel Comparison",
    description: "Compare Australia Post box vs satchel pricing for same item",
    collection: {
      city: "Geelong",
      state: "VIC",
      postcode: "3220",
      country: "AU"
    },
    delivery: {
      city: "Perth",
      state: "WA",
      postcode: "6000",
      country: "AU"
    },
    parcels: [{
      weight: 2.0, // 2kg - could fit in large satchel or small box
      length: 30,
      width: 20,
      height: 12
    }],
    filter: {
      carriers: ["Australia Post"]
    },
    expectedServices: ["satchel", "regular", "box"]
  }
];

async function testAustraliaPostScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log(`📍 Route: ${scenario.collection.city} → ${scenario.delivery.city}`);
  console.log(`📦 Parcel: ${scenario.parcels[0].weight}kg, ${scenario.parcels[0].length}×${scenario.parcels[0].width}×${scenario.parcels[0].height}cm`);
  
  if (scenario.filter.serviceLevel) {
    console.log(`⚡ Service Level: ${scenario.filter.serviceLevel.join(', ')}`);
  }

  try {
    const requestBody = {
      collection: scenario.collection,
      delivery: scenario.delivery,
      parcels: scenario.parcels,
      filter: scenario.filter
    };

    const response = await fetch('https://api.interparcel.com/quote', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Interparcel-Auth': process.env.INTERPARCEL_API_KEY,
        'X-Interparcel-API-Version': '3'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (response.ok && data.status === 0) {
      if (data.services && data.services.length > 0) {
        // Filter for Australia Post services only
        const ausPostServices = data.services.filter(service => 
          service.carrier.toLowerCase().includes('australia post') ||
          service.carrier.toLowerCase().includes('auspost')
        );

        if (ausPostServices.length > 0) {
          console.log(`✅ Found ${ausPostServices.length} Australia Post services:`);
          
          // Sort by price
          const sortedServices = ausPostServices.sort((a, b) => a.price - b.price);
          
          sortedServices.forEach((service, index) => {
            console.log(`   ${index + 1}. ${service.name}`);
            console.log(`      Price: $${service.price} ${service.currency}`);
            console.log(`      Delivery: ${service.delivery.daysFrom}-${service.delivery.daysTo} days`);
            console.log(`      Service Level: ${service.serviceLevel}`);
            console.log(`      Pickup Type: ${service.pickupType}`);
            
            // Check if it's a satchel service
            const isSatchel = service.name.toLowerCase().includes('satchel') || 
                             service.name.toLowerCase().includes('prepaid');
            console.log(`      📮 Satchel Service: ${isSatchel ? 'Yes' : 'No'}`);
            console.log('');
          });

          // Analyze service types
          const satchelServices = sortedServices.filter(s => 
            s.name.toLowerCase().includes('satchel') || 
            s.name.toLowerCase().includes('prepaid')
          );
          const regularServices = sortedServices.filter(s => 
            !s.name.toLowerCase().includes('satchel') && 
            !s.name.toLowerCase().includes('prepaid')
          );

          console.log(`📮 Satchel Services: ${satchelServices.length}`);
          console.log(`📦 Regular Services: ${regularServices.length}`);

          if (satchelServices.length > 0) {
            const cheapestSatchel = satchelServices[0];
            console.log(`💰 Cheapest Satchel: ${cheapestSatchel.name} - $${cheapestSatchel.price}`);
          }

          if (regularServices.length > 0) {
            const cheapestRegular = regularServices[0];
            console.log(`📦 Cheapest Regular: ${cheapestRegular.name} - $${cheapestRegular.price}`);
          }

          return {
            success: true,
            totalServices: ausPostServices.length,
            satchelServices: satchelServices.length,
            regularServices: regularServices.length,
            cheapestPrice: sortedServices[0].price,
            cheapestService: sortedServices[0],
            services: sortedServices
          };

        } else {
          console.log(`⚠️ No Australia Post services found (${data.services.length} total services available)`);
          console.log(`Available carriers: ${[...new Set(data.services.map(s => s.carrier))].join(', ')}`);
          return { success: false, reason: 'No Australia Post services available' };
        }

      } else {
        console.log(`❌ No services available for this route`);
        return { success: false, reason: 'No services available' };
      }
    } else {
      console.log(`❌ API Error (Status: ${data.status}):`, data.errorMessage || data);
      return { success: false, error: data };
    }

  } catch (error) {
    console.log(`❌ Request failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runAustraliaPostTests() {
  console.log('🇦🇺 Australia Post Satchel Tests via Interparcel API');
  console.log('====================================================');
  
  if (!process.env.INTERPARCEL_API_KEY) {
    console.log('❌ INTERPARCEL_API_KEY not found in environment variables');
    return;
  }

  console.log(`🔑 API Key: Loaded ✅`);
  console.log(`📮 Focus: Australia Post satchel services\n`);
  
  const results = [];

  for (let i = 0; i < AUSTRALIA_POST_TEST_SCENARIOS.length; i++) {
    const scenario = AUSTRALIA_POST_TEST_SCENARIOS[i];
    const result = await testAustraliaPostScenario(scenario);
    
    results.push({
      scenario: scenario.name,
      ...result
    });

    // Delay between requests
    if (i < AUSTRALIA_POST_TEST_SCENARIOS.length - 1) {
      console.log('\n⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary Report
  console.log('\n📊 AUSTRALIA POST TEST SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful scenarios: ${successful.length}/${results.length}`);
  console.log(`❌ Failed scenarios: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log('\n📮 Satchel Service Analysis:');
    const totalSatchelServices = successful.reduce((sum, r) => sum + (r.satchelServices || 0), 0);
    const totalRegularServices = successful.reduce((sum, r) => sum + (r.regularServices || 0), 0);
    
    console.log(`   Total satchel services found: ${totalSatchelServices}`);
    console.log(`   Total regular services found: ${totalRegularServices}`);
    console.log(`   Satchel availability: ${totalSatchelServices > 0 ? '✅ Available' : '❌ Not available'}`);

    console.log('\n💰 Price Analysis:');
    const prices = successful.map(r => r.cheapestPrice).filter(p => p);
    if (prices.length > 0) {
      console.log(`   Cheapest Australia Post service: $${Math.min(...prices)}`);
      console.log(`   Most expensive: $${Math.max(...prices)}`);
      console.log(`   Average price: $${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`);
    }

    console.log('\n🏆 Best Australia Post Options by Route:');
    successful.forEach(result => {
      if (result.cheapestService) {
        const isSatchel = result.cheapestService.name.toLowerCase().includes('satchel');
        console.log(`   ${result.scenario}:`);
        console.log(`     Service: ${result.cheapestService.name}`);
        console.log(`     Price: $${result.cheapestService.price}`);
        console.log(`     Type: ${isSatchel ? '📮 Satchel' : '📦 Regular'}`);
        console.log(`     Delivery: ${result.cheapestService.delivery.daysFrom}-${result.cheapestService.delivery.daysTo} days`);
      }
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Scenarios:');
    failed.forEach(result => {
      console.log(`   ${result.scenario}: ${result.reason || result.error?.errorMessage || 'Unknown error'}`);
    });
  }

  console.log('\n🎉 Australia Post testing completed!');
  
  return {
    totalScenarios: results.length,
    successful: successful.length,
    failed: failed.length,
    results: results
  };
}

// Run the Australia Post tests
runAustraliaPostTests()
  .then((summary) => {
    console.log(`\n🏁 Final Results: ${summary.successful}/${summary.totalScenarios} scenarios passed`);
    
    if (summary.successful === summary.totalScenarios) {
      console.log('🎯 All tests passed! Australia Post satchel integration via Interparcel is working.');
    } else if (summary.successful > 0) {
      console.log('⚠️ Some tests passed. Australia Post services are partially available.');
    } else {
      console.log('❌ All tests failed. Check Australia Post availability through Interparcel.');
    }
    
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  });
