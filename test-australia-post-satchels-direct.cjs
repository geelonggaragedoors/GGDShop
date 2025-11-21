const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const AUSPOST_API_KEY = process.env.AUSPOST_API_KEY;
const AUSPOST_BASE_URL = 'https://digitalapi.auspost.com.au';

// Australia Post Satchel Test Scenarios
const SATCHEL_TEST_SCENARIOS = [
  {
    name: "Small Satchel 500g - Remote Control",
    description: "Test small prepaid satchel for garage door remote",
    fromPostcode: "3220", // Geelong
    toPostcode: "3000",   // Melbourne
    weight: 0.5, // 500g
    length: 22,  // Small satchel dimensions
    width: 16,
    height: 7.7,
    serviceCode: "AUS_PARCEL_REGULAR_SATCHEL_500G",
    expectedPrice: { min: 8, max: 15 }
  },
  {
    name: "Medium Satchel 3kg - Door Parts",
    description: "Test medium prepaid satchel for door parts",
    fromPostcode: "3220", // Geelong
    toPostcode: "2000",   // Sydney
    weight: 2.5, // 2.5kg
    length: 31,  // Medium satchel dimensions
    width: 22.5,
    height: 10.2,
    serviceCode: "AUS_PARCEL_REGULAR_SATCHEL_3KG",
    expectedPrice: { min: 12, max: 25 }
  },
  {
    name: "Large Satchel 5kg - Multiple Parts",
    description: "Test large prepaid satchel for multiple small parts",
    fromPostcode: "3220", // Geelong
    toPostcode: "4000",   // Brisbane
    weight: 4.5, // 4.5kg
    length: 40,  // Large satchel dimensions
    width: 30,
    height: 15,
    serviceCode: "AUS_PARCEL_REGULAR_SATCHEL_5KG",
    expectedPrice: { min: 15, max: 35 }
  },
  {
    name: "Express Satchel 500g - Urgent Remote",
    description: "Test express prepaid satchel for urgent delivery",
    fromPostcode: "3220", // Geelong
    toPostcode: "5000",   // Adelaide
    weight: 0.4, // 400g
    length: 22,  // Small satchel dimensions
    width: 16,
    height: 7.7,
    serviceCode: "AUS_PARCEL_EXPRESS_SATCHEL_500G",
    expectedPrice: { min: 12, max: 25 }
  },
  {
    name: "Regular Parcel vs Satchel Comparison",
    description: "Compare regular parcel vs satchel for same item",
    fromPostcode: "3220", // Geelong
    toPostcode: "6000",   // Perth
    weight: 1.5, // 1.5kg
    length: 25,
    width: 20,
    height: 10,
    serviceCode: "AUS_PARCEL_REGULAR", // Regular service for comparison
    expectedPrice: { min: 15, max: 30 }
  }
];

async function testSatchelScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log(`📍 Route: ${scenario.fromPostcode} → ${scenario.toPostcode}`);
  console.log(`📦 Parcel: ${scenario.weight}kg, ${scenario.length}×${scenario.width}×${scenario.height}cm`);
  console.log(`📮 Service: ${scenario.serviceCode}`);

  try {
    const url = `${AUSPOST_BASE_URL}/postage/parcel/domestic/calculate.json` +
      `?from_postcode=${scenario.fromPostcode}` +
      `&to_postcode=${scenario.toPostcode}` +
      `&length=${scenario.length}` +
      `&width=${scenario.width}` +
      `&height=${scenario.height}` +
      `&weight=${scenario.weight}` +
      `&service_code=${scenario.serviceCode}`;

    const response = await fetch(url, {
      headers: {
        'AUTH-KEY': AUSPOST_API_KEY
      }
    });

    const data = await response.json();

    if (response.ok && data.postage_result) {
      const cost = parseFloat(data.postage_result.total_cost);
      console.log(`✅ SUCCESS!`);
      console.log(`   Service: ${data.postage_result.service}`);
      console.log(`   Total Cost: $${cost} AUD`);
      console.log(`   Delivery Time: ${data.postage_result.delivery_time}`);

      // Price range validation
      if (scenario.expectedPrice) {
        const { min, max } = scenario.expectedPrice;
        if (cost >= min && cost <= max) {
          console.log(`✅ Price within expected range ($${min}-$${max})`);
        } else {
          console.log(`⚠️ Price outside expected range ($${min}-$${max}). Actual: $${cost}`);
        }
      }

      return {
        success: true,
        cost: cost,
        service: data.postage_result.service,
        deliveryTime: data.postage_result.delivery_time,
        priceInRange: scenario.expectedPrice ? 
          (cost >= scenario.expectedPrice.min && cost <= scenario.expectedPrice.max) : null
      };

    } else {
      console.log(`❌ API Error:`, data.error || data);
      return { 
        success: false, 
        error: data.error?.errorMessage || 'Unknown error',
        serviceCode: scenario.serviceCode
      };
    }

  } catch (error) {
    console.log(`❌ Request Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testAllAvailableServices() {
  console.log(`\n🔍 Testing Available Services for Sample Route`);
  console.log(`📍 Route: 3220 (Geelong) → 3000 (Melbourne)`);
  console.log(`📦 Sample: 1kg, 25×20×10cm\n`);

  try {
    const params = new URLSearchParams({
      from_postcode: "3220",
      to_postcode: "3000",
      length: "25",
      width: "20", 
      height: "10",
      weight: "1"
    });

    const url = `${AUSPOST_BASE_URL}/postage/parcel/domestic/service.json?${params}`;
    
    const response = await fetch(url, {
      headers: {
        'AUTH-KEY': AUSPOST_API_KEY
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.services && data.services.service) {
        console.log(`✅ Found ${data.services.service.length} available services:`);
        
        data.services.service.forEach((service, index) => {
          const isSatchel = service.code.toLowerCase().includes('satchel');
          console.log(`   ${index + 1}. ${service.name} (${service.code})`);
          console.log(`      Price: $${service.price} AUD`);
          console.log(`      Type: ${isSatchel ? '📮 Satchel' : '📦 Regular'}`);
          console.log('');
        });

        // Analyze satchel services
        const satchelServices = data.services.service.filter(s => 
          s.code.toLowerCase().includes('satchel')
        );
        
        console.log(`📮 Satchel Services Found: ${satchelServices.length}`);
        if (satchelServices.length > 0) {
          console.log(`Available satchel codes:`);
          satchelServices.forEach(service => {
            console.log(`   - ${service.code}: ${service.name} ($${service.price})`);
          });
        }

        return {
          success: true,
          totalServices: data.services.service.length,
          satchelServices: satchelServices.length,
          services: data.services.service
        };
      }
    } else {
      const errorData = await response.json();
      console.log(`❌ API Error:`, errorData);
      return { success: false, error: errorData };
    }

  } catch (error) {
    console.log(`❌ Request Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runSatchelTests() {
  console.log('📮 Australia Post Satchel Tests (Direct API)');
  console.log('=============================================');
  
  if (!AUSPOST_API_KEY) {
    console.log('❌ AUSPOST_API_KEY not found in environment variables');
    return;
  }

  console.log(`🔑 API Key: ${AUSPOST_API_KEY.substring(0, 8)}...${AUSPOST_API_KEY.substring(AUSPOST_API_KEY.length - 4)}`);
  console.log(`📏 API Key Length: ${AUSPOST_API_KEY.length} characters\n`);

  // First, discover available services
  const serviceDiscovery = await testAllAvailableServices();
  
  console.log('\n' + '='.repeat(50));
  console.log('🧪 SATCHEL SCENARIO TESTS');
  console.log('='.repeat(50));

  const results = [];

  for (let i = 0; i < SATCHEL_TEST_SCENARIOS.length; i++) {
    const scenario = SATCHEL_TEST_SCENARIOS[i];
    const result = await testSatchelScenario(scenario);
    
    results.push({
      scenario: scenario.name,
      serviceCode: scenario.serviceCode,
      ...result
    });

    // Delay between requests
    if (i < SATCHEL_TEST_SCENARIOS.length - 1) {
      console.log('\n⏳ Waiting 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary Report
  console.log('\n📊 SATCHEL TEST SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed tests: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log('\n💰 Satchel Pricing:');
    const costs = successful.map(r => r.cost).filter(c => c);
    if (costs.length > 0) {
      console.log(`   Cheapest satchel: $${Math.min(...costs)}`);
      console.log(`   Most expensive: $${Math.max(...costs)}`);
      console.log(`   Average cost: $${(costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(2)}`);
    }

    console.log('\n🎯 Working Satchel Services:');
    successful.forEach(result => {
      console.log(`   ✅ ${result.scenario}`);
      console.log(`      Service: ${result.service}`);
      console.log(`      Cost: $${result.cost}`);
      console.log(`      Delivery: ${result.deliveryTime}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(result => {
      console.log(`   ${result.scenario}:`);
      console.log(`      Service Code: ${result.serviceCode}`);
      console.log(`      Error: ${result.error}`);
    });

    console.log('\n💡 Troubleshooting:');
    console.log('   - Some service codes may be outdated');
    console.log('   - Check Australia Post documentation for current codes');
    console.log('   - Verify API key has access to satchel services');
  }

  console.log('\n🎉 Australia Post satchel testing completed!');
  
  return {
    totalTests: results.length,
    successful: successful.length,
    failed: failed.length,
    serviceDiscovery: serviceDiscovery,
    results: results
  };
}

// Run the satchel tests
runSatchelTests()
  .then((summary) => {
    console.log(`\n🏁 Final Results: ${summary.successful}/${summary.totalTests} satchel tests passed`);
    
    if (summary.successful > 0) {
      console.log('🎯 Australia Post satchel integration is working!');
    } else {
      console.log('⚠️ Satchel service codes may need updating. Check service discovery results above.');
    }
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
  });
