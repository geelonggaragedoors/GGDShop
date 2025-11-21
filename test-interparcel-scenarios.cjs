const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Specific test scenarios for Geelong Garage Doors
const TEST_SCENARIOS = [
  {
    name: "Remote Control to Melbourne",
    description: "Small lightweight item to metro area",
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
      weight: 0.2,
      length: 15,
      width: 8,
      height: 3
    }],
    expectedPriceRange: { min: 8, max: 25 }
  },
  {
    name: "Door Opener Motor to Sydney", 
    description: "Heavy item interstate",
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
      weight: 18,
      length: 55,
      width: 35,
      height: 30
    }],
    expectedPriceRange: { min: 35, max: 120 }
  },
  {
    name: "Multiple Small Parts to Brisbane",
    description: "Multiple parcels to interstate",
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
    parcels: [
      { weight: 1.2, length: 25, width: 20, height: 15 },
      { weight: 0.8, length: 30, width: 15, height: 10 },
      { weight: 2.1, length: 35, width: 25, height: 18 }
    ],
    expectedPriceRange: { min: 25, max: 80 }
  },
  {
    name: "Large Door Panel to Perth",
    description: "Oversized item to remote state",
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
      weight: 22,
      length: 210,
      width: 60,
      height: 8
    }],
    expectedPriceRange: { min: 80, max: 250 }
  },
  {
    name: "Express Delivery to Local Area",
    description: "Fast delivery within Victoria",
    collection: {
      city: "Geelong",
      state: "VIC",
      postcode: "3220", 
      country: "AU"
    },
    delivery: {
      city: "Ballarat",
      state: "VIC", 
      postcode: "3350",
      country: "AU"
    },
    parcels: [{
      weight: 5,
      length: 40,
      width: 30,
      height: 25
    }],
    filter: {
      serviceLevel: ["express", "timed"]
    },
    expectedPriceRange: { min: 15, max: 50 }
  }
];

async function testScenario(scenario) {
  console.log(`\n🧪 Testing Scenario: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  console.log(`📍 Route: ${scenario.collection.city} → ${scenario.delivery.city}`);
  console.log(`📦 Parcels: ${scenario.parcels.length} parcel(s)`);
  
  scenario.parcels.forEach((parcel, index) => {
    console.log(`   Parcel ${index + 1}: ${parcel.weight}kg, ${parcel.length}×${parcel.width}×${parcel.height}cm`);
  });

  try {
    const requestBody = {
      collection: scenario.collection,
      delivery: scenario.delivery,
      parcels: scenario.parcels
    };

    if (scenario.filter) {
      requestBody.filter = scenario.filter;
      console.log(`🔍 Filters: ${JSON.stringify(scenario.filter)}`);
    }

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
        console.log(`✅ Found ${data.services.length} shipping options:`);
        
        // Sort by price
        const sortedServices = data.services.sort((a, b) => a.price - b.price);
        const cheapest = sortedServices[0];
        const fastest = sortedServices.reduce((min, curr) => 
          curr.delivery.daysFrom < min.delivery.daysFrom ? curr : min
        );

        console.log(`\n💰 Cheapest Option:`);
        console.log(`   ${cheapest.carrier} - ${cheapest.name}: $${cheapest.price} ${cheapest.currency}`);
        console.log(`   Delivery: ${cheapest.delivery.daysFrom}-${cheapest.delivery.daysTo} days`);
        console.log(`   Service Level: ${cheapest.serviceLevel}`);

        if (fastest.id !== cheapest.id) {
          console.log(`\n⚡ Fastest Option:`);
          console.log(`   ${fastest.carrier} - ${fastest.name}: $${fastest.price} ${fastest.currency}`);
          console.log(`   Delivery: ${fastest.delivery.daysFrom}-${fastest.delivery.daysTo} days`);
        }

        // Price range validation
        if (scenario.expectedPriceRange) {
          const { min, max } = scenario.expectedPriceRange;
          if (cheapest.price >= min && cheapest.price <= max) {
            console.log(`✅ Price within expected range ($${min}-$${max})`);
          } else {
            console.log(`⚠️ Price outside expected range ($${min}-$${max}). Actual: $${cheapest.price}`);
          }
        }

        console.log(`\n📋 All Options:`);
        sortedServices.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.carrier} ${service.name} - $${service.price} (${service.delivery.daysFrom}-${service.delivery.daysTo} days)`);
        });

        return {
          success: true,
          serviceCount: data.services.length,
          cheapestPrice: cheapest.price,
          fastestDays: fastest.delivery.daysFrom,
          services: sortedServices,
          priceInRange: scenario.expectedPriceRange ? 
            (cheapest.price >= scenario.expectedPriceRange.min && cheapest.price <= scenario.expectedPriceRange.max) : 
            null
        };

      } else {
        console.log(`❌ No shipping services available for this route`);
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

async function runScenarioTests() {
  console.log('🎯 Interparcel Scenario Tests for Geelong Garage Doors');
  console.log('======================================================');
  
  if (!process.env.INTERPARCEL_API_KEY) {
    console.log('❌ INTERPARCEL_API_KEY not found in environment variables');
    console.log('Please add INTERPARCEL_API_KEY=gZouPfGRNbipC55V024a to your .env file');
    return;
  }

  console.log(`🔑 API Key: Loaded ✅`);
  
  const results = [];

  for (let i = 0; i < TEST_SCENARIOS.length; i++) {
    const scenario = TEST_SCENARIOS[i];
    const result = await testScenario(scenario);
    
    results.push({
      scenario: scenario.name,
      ...result
    });

    // Delay between requests to be respectful to API
    if (i < TEST_SCENARIOS.length - 1) {
      console.log('\n⏳ Waiting 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Final Summary
  console.log('\n📊 SCENARIO TEST SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful scenarios: ${successful.length}/${results.length}`);
  console.log(`❌ Failed scenarios: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log('\n💰 Price Summary:');
    const prices = successful.map(r => r.cheapestPrice).filter(p => p);
    console.log(`   Cheapest quote: $${Math.min(...prices)}`);
    console.log(`   Most expensive: $${Math.max(...prices)}`);
    console.log(`   Average price: $${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`);

    const priceRangeTests = successful.filter(r => r.priceInRange !== null);
    const priceRangePassed = priceRangeTests.filter(r => r.priceInRange);
    console.log(`   Price range accuracy: ${priceRangePassed.length}/${priceRangeTests.length} scenarios`);
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Scenarios:');
    failed.forEach(result => {
      console.log(`   ${result.scenario}: ${result.reason || result.error?.errorMessage || 'Unknown error'}`);
    });
  }

  console.log('\n🎉 Scenario testing completed!');
  
  return {
    totalScenarios: results.length,
    successful: successful.length,
    failed: failed.length,
    results: results
  };
}

// Run the scenario tests
runScenarioTests()
  .then((summary) => {
    console.log(`\n🏁 Test Results: ${summary.successful}/${summary.totalScenarios} scenarios passed`);
    
    if (summary.successful === summary.totalScenarios) {
      console.log('🎯 All tests passed! Interparcel integration is ready for implementation.');
    } else if (summary.successful > 0) {
      console.log('⚠️ Some tests passed. Review failed scenarios before implementation.');
    } else {
      console.log('❌ All tests failed. Check API key and network connectivity.');
    }
    
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  });
