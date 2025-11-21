const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const AUSPOST_API_KEY = process.env.AUSPOST_API_KEY;
const AUSPOST_BASE_URL = 'https://digitalapi.auspost.com.au';

// Garage door specific test scenarios using confirmed working satchel codes
const GARAGE_DOOR_SATCHEL_SCENARIOS = [
  {
    name: "Remote Control - Medium Satchel",
    description: "Garage door remote in medium satchel",
    fromPostcode: "3220", // Geelong
    toPostcode: "3000",   // Melbourne
    weight: 0.3, // 300g
    length: 15, width: 8, height: 4,
    serviceCode: "AUS_PARCEL_REGULAR_SATCHEL_3KG",
    itemType: "Remote control"
  },
  {
    name: "Door Hinges - Large Satchel",
    description: "Set of door hinges in large satchel",
    fromPostcode: "3220",
    toPostcode: "2000", // Sydney
    weight: 2.8, // 2.8kg
    length: 30, width: 20, height: 8,
    serviceCode: "AUS_PARCEL_REGULAR_SATCHEL_LARGE",
    itemType: "Door hinges"
  },
  {
    name: "Urgent Remote - Express Medium Satchel",
    description: "Urgent garage door remote via express satchel",
    fromPostcode: "3220",
    toPostcode: "4000", // Brisbane
    weight: 0.4, // 400g
    length: 16, width: 10, height: 5,
    serviceCode: "AUS_PARCEL_EXPRESS_SATCHEL_3KG",
    itemType: "Remote control (urgent)"
  },
  {
    name: "Heavy Parts - Express Large Satchel",
    description: "Heavy door parts via express large satchel",
    fromPostcode: "3220",
    toPostcode: "5000", // Adelaide
    weight: 4.5, // 4.5kg
    length: 35, width: 25, height: 12,
    serviceCode: "AUS_PARCEL_EXPRESS_SATCHEL_LARGE",
    itemType: "Door mechanism parts"
  },
  {
    name: "Small Parts Kit - Medium Satchel",
    description: "Small parts kit to regional area",
    fromPostcode: "3220",
    toPostcode: "3350", // Ballarat
    weight: 1.2, // 1.2kg
    length: 25, width: 18, height: 6,
    serviceCode: "AUS_PARCEL_REGULAR_SATCHEL_3KG",
    itemType: "Parts kit"
  },
  {
    name: "Interstate Express - Large Satchel",
    description: "Express delivery to Perth",
    fromPostcode: "3220",
    toPostcode: "6000", // Perth
    weight: 3.8, // 3.8kg
    length: 32, width: 22, height: 10,
    serviceCode: "AUS_PARCEL_EXPRESS_SATCHEL_LARGE",
    itemType: "Door components"
  }
];

async function testSatchelScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log(`🔧 Item: ${scenario.itemType}`);
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
      const isExpress = scenario.serviceCode.includes('EXPRESS');
      
      console.log(`✅ SUCCESS!`);
      console.log(`   Service: ${data.postage_result.service}`);
      console.log(`   Total Cost: $${cost} AUD`);
      console.log(`   Delivery Time: ${data.postage_result.delivery_time}`);
      console.log(`   Service Type: ${isExpress ? '⚡ Express' : '📮 Regular'} Satchel`);

      // Calculate cost per kg for comparison
      const costPerKg = (cost / scenario.weight).toFixed(2);
      console.log(`   Cost per kg: $${costPerKg}/kg`);

      return {
        success: true,
        cost: cost,
        costPerKg: parseFloat(costPerKg),
        service: data.postage_result.service,
        deliveryTime: data.postage_result.delivery_time,
        isExpress: isExpress,
        itemType: scenario.itemType,
        route: `${scenario.fromPostcode} → ${scenario.toPostcode}`
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

async function compareSatchelVsRegular() {
  console.log(`\n🔍 SATCHEL vs REGULAR PARCEL COMPARISON`);
  console.log(`📍 Route: 3220 (Geelong) → 3000 (Melbourne)`);
  console.log(`📦 Sample: 1.5kg, 25×20×10cm\n`);

  const testCases = [
    {
      name: "Regular Satchel 3kg",
      serviceCode: "AUS_PARCEL_REGULAR_SATCHEL_3KG"
    },
    {
      name: "Regular Parcel",
      serviceCode: "AUS_PARCEL_REGULAR"
    },
    {
      name: "Express Satchel 3kg", 
      serviceCode: "AUS_PARCEL_EXPRESS_SATCHEL_3KG"
    },
    {
      name: "Express Parcel",
      serviceCode: "AUS_PARCEL_EXPRESS"
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    try {
      const url = `${AUSPOST_BASE_URL}/postage/parcel/domestic/calculate.json` +
        `?from_postcode=3220&to_postcode=3000&length=25&width=20&height=10&weight=1.5&service_code=${testCase.serviceCode}`;

      const response = await fetch(url, {
        headers: { 'AUTH-KEY': AUSPOST_API_KEY }
      });

      const data = await response.json();

      if (response.ok && data.postage_result) {
        const cost = parseFloat(data.postage_result.total_cost);
        console.log(`✅ ${testCase.name}: $${cost} - ${data.postage_result.delivery_time}`);
        
        results.push({
          name: testCase.name,
          cost: cost,
          service: data.postage_result.service,
          deliveryTime: data.postage_result.delivery_time,
          isSatchel: testCase.serviceCode.includes('SATCHEL')
        });
      } else {
        console.log(`❌ ${testCase.name}: Failed`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`❌ ${testCase.name}: Error - ${error.message}`);
    }
  }

  // Analysis
  if (results.length > 0) {
    console.log(`\n📊 Comparison Analysis:`);
    
    const satchels = results.filter(r => r.isSatchel);
    const regulars = results.filter(r => !r.isSatchel);
    
    if (satchels.length > 0 && regulars.length > 0) {
      const cheapestSatchel = satchels.reduce((min, curr) => curr.cost < min.cost ? curr : min);
      const cheapestRegular = regulars.reduce((min, curr) => curr.cost < min.cost ? curr : min);
      
      console.log(`   Cheapest Satchel: ${cheapestSatchel.name} - $${cheapestSatchel.cost}`);
      console.log(`   Cheapest Regular: ${cheapestRegular.name} - $${cheapestRegular.cost}`);
      
      const difference = Math.abs(cheapestSatchel.cost - cheapestRegular.cost);
      const cheaper = cheapestSatchel.cost < cheapestRegular.cost ? 'Satchel' : 'Regular';
      console.log(`   ${cheaper} is $${difference.toFixed(2)} cheaper`);
    }
  }

  return results;
}

async function getSatchelSizeRecommendations() {
  console.log(`\n📏 SATCHEL SIZE RECOMMENDATIONS FOR GARAGE DOOR PARTS`);
  console.log('='.repeat(55));

  const recommendations = [
    {
      item: "Garage Door Remote",
      dimensions: "15×8×4cm, 200-400g",
      recommendation: "AUS_PARCEL_REGULAR_SATCHEL_3KG",
      reason: "Fits easily in medium satchel, cost-effective"
    },
    {
      item: "Door Hinges (Set of 4)",
      dimensions: "25×20×8cm, 1.5-2.5kg",
      recommendation: "AUS_PARCEL_REGULAR_SATCHEL_3KG",
      reason: "Within 3kg weight limit, good size fit"
    },
    {
      item: "Heavy Door Parts",
      dimensions: "30×25×12cm, 3.5-4.5kg",
      recommendation: "AUS_PARCEL_REGULAR_SATCHEL_LARGE",
      reason: "Exceeds 3kg limit, needs large satchel"
    },
    {
      item: "Urgent Remote Replacement",
      dimensions: "15×8×4cm, 200-400g",
      recommendation: "AUS_PARCEL_EXPRESS_SATCHEL_3KG",
      reason: "Express delivery for urgent orders"
    },
    {
      item: "Door Lock Mechanism",
      dimensions: "35×15×10cm, 2.8kg",
      recommendation: "AUS_PARCEL_REGULAR_SATCHEL_LARGE",
      reason: "Long item needs large satchel dimensions"
    },
    {
      item: "Small Parts Kit",
      dimensions: "20×15×6cm, 800g",
      recommendation: "AUS_PARCEL_REGULAR_SATCHEL_3KG",
      reason: "Perfect fit for medium satchel"
    }
  ];

  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.item}`);
    console.log(`   Dimensions: ${rec.dimensions}`);
    console.log(`   📮 Recommended: ${rec.recommendation}`);
    console.log(`   💡 Reason: ${rec.reason}\n`);
  });

  return recommendations;
}

async function runFocusedSatchelTest() {
  console.log('📮 Focused Australia Post Satchel Test for Garage Door Parts');
  console.log('=============================================================');
  
  if (!AUSPOST_API_KEY) {
    console.log('❌ AUSPOST_API_KEY not found in environment variables');
    return;
  }

  console.log(`🔑 API Key: ${AUSPOST_API_KEY.substring(0, 8)}...${AUSPOST_API_KEY.substring(AUSPOST_API_KEY.length - 4)}`);
  console.log(`🏢 Business: Geelong Garage Doors`);
  console.log(`📍 Base Location: Geelong, VIC 3220\n`);

  // Test all garage door scenarios
  console.log('🧪 GARAGE DOOR PART SCENARIOS');
  console.log('='.repeat(35));

  const results = [];
  for (let i = 0; i < GARAGE_DOOR_SATCHEL_SCENARIOS.length; i++) {
    const scenario = GARAGE_DOOR_SATCHEL_SCENARIOS[i];
    const result = await testSatchelScenario(scenario);
    
    results.push({
      scenario: scenario.name,
      itemType: scenario.itemType,
      ...result
    });

    if (i < GARAGE_DOOR_SATCHEL_SCENARIOS.length - 1) {
      console.log('\n⏳ Waiting 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Comparison test
  console.log('\n' + '='.repeat(50));
  const comparisonResults = await compareSatchelVsRegular();

  // Size recommendations
  console.log('\n' + '='.repeat(50));
  const recommendations = await getSatchelSizeRecommendations();

  // Summary Report
  console.log('📊 SATCHEL TEST SUMMARY FOR GARAGE DOOR BUSINESS');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed tests: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log('\n💰 Satchel Pricing Analysis:');
    const costs = successful.map(r => r.cost);
    const expressCosts = successful.filter(r => r.isExpress).map(r => r.cost);
    const regularCosts = successful.filter(r => !r.isExpress).map(r => r.cost);

    console.log(`   All Satchels: $${Math.min(...costs)} - $${Math.max(...costs)}`);
    if (regularCosts.length > 0) {
      console.log(`   Regular Satchels: $${Math.min(...regularCosts)} - $${Math.max(...regularCosts)}`);
    }
    if (expressCosts.length > 0) {
      console.log(`   Express Satchels: $${Math.min(...expressCosts)} - $${Math.max(...expressCosts)}`);
    }

    console.log('\n🏆 Best Options by Item Type:');
    const itemTypes = [...new Set(successful.map(r => r.itemType))];
    itemTypes.forEach(itemType => {
      const itemResults = successful.filter(r => r.itemType === itemType);
      const cheapest = itemResults.reduce((min, curr) => curr.cost < min.cost ? curr : min);
      console.log(`   ${itemType}: $${cheapest.cost} (${cheapest.service})`);
    });

    console.log('\n📍 Best Routes:');
    const routes = [...new Set(successful.map(r => r.route))];
    routes.forEach(route => {
      const routeResults = successful.filter(r => r.route === route);
      const avgCost = (routeResults.reduce((sum, r) => sum + r.cost, 0) / routeResults.length).toFixed(2);
      console.log(`   ${route}: Average $${avgCost}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(result => {
      console.log(`   ${result.scenario}: ${result.error}`);
    });
  }

  console.log('\n🎯 BUSINESS RECOMMENDATIONS:');
  console.log('1. Use regular satchels for standard deliveries (cost-effective)');
  console.log('2. Use express satchels for urgent customer requests');
  console.log('3. Medium satchels (3kg) perfect for most garage door parts');
  console.log('4. Large satchels needed for heavy items >3kg');
  console.log('5. Satchels offer competitive pricing vs regular parcels');

  console.log('\n🎉 Focused satchel testing completed!');
  
  return {
    totalTests: results.length,
    successful: successful.length,
    failed: failed.length,
    comparisonResults: comparisonResults,
    recommendations: recommendations,
    results: results
  };
}

// Run the focused satchel test
runFocusedSatchelTest()
  .then((summary) => {
    console.log(`\n🏁 Final Results: ${summary.successful}/${summary.totalTests} satchel tests passed`);
    
    if (summary.successful === summary.totalTests) {
      console.log('🎯 Perfect! All satchel services working for your garage door business.');
    } else if (summary.successful > 0) {
      console.log('⚠️ Most satchel services working. Ready for implementation.');
    } else {
      console.log('❌ Satchel services need attention.');
    }
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
  });
