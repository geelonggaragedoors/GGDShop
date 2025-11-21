const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const AUSPOST_API_KEY = process.env.AUSPOST_API_KEY;
const INTERPARCEL_API_KEY = process.env.INTERPARCEL_API_KEY;
const AUSPOST_BASE_URL = 'https://digitalapi.auspost.com.au';

// Test scenarios comparing Australia Post boxes vs Interparcel
const COMPARISON_SCENARIOS = [
  {
    name: "Small Remote Control",
    description: "Garage door remote control",
    weight: 0.3, // 300g
    length: 15,
    width: 8,
    height: 4,
    suggestedBox: "Bx1", // 22×16×7.7cm
    routes: [
      { from: "3220", to: "3000", name: "Geelong → Melbourne" },
      { from: "3220", to: "2000", name: "Geelong → Sydney" }
    ]
  },
  {
    name: "Door Hinges Set",
    description: "Set of 4 door hinges",
    weight: 2.5, // 2.5kg
    length: 25,
    width: 20,
    height: 8,
    suggestedBox: "Bx2", // 31×22.5×10.2cm
    routes: [
      { from: "3220", to: "3000", name: "Geelong → Melbourne" },
      { from: "3220", to: "4000", name: "Geelong → Brisbane" }
    ]
  },
  {
    name: "Door Track Section",
    description: "Long door track piece",
    weight: 3.5, // 3.5kg
    length: 38,
    width: 18,
    height: 15,
    suggestedBox: "Bx3", // 40×20×18cm
    routes: [
      { from: "3220", to: "3000", name: "Geelong → Melbourne" },
      { from: "3220", to: "5000", name: "Geelong → Adelaide" }
    ]
  },
  {
    name: "Door Panel Component",
    description: "Wide door panel section",
    weight: 5.0, // 5kg
    length: 40,
    width: 28,
    height: 12,
    suggestedBox: "Bx4", // 43×30.5×14cm
    routes: [
      { from: "3220", to: "3000", name: "Geelong → Melbourne" },
      { from: "3220", to: "6000", name: "Geelong → Perth" }
    ]
  },
  {
    name: "Heavy Motor Unit",
    description: "Garage door motor",
    weight: 8.0, // 8kg
    length: 35,
    width: 25,
    height: 20,
    suggestedBox: "Bx5", // 40.5×30×25.5cm
    routes: [
      { from: "3220", to: "3000", name: "Geelong → Melbourne" },
      { from: "3220", to: "2000", name: "Geelong → Sydney" }
    ]
  }
];

// Australia Post box dimensions and service codes
const AUSPOST_BOXES = {
  "Bx1": { dimensions: { length: 22, width: 16, height: 7.7 }, name: "Bx1 Small", serviceCode: "AUS_PARCEL_REGULAR" },
  "Bx2": { dimensions: { length: 31, width: 22.5, height: 10.2 }, name: "Bx2 Medium", serviceCode: "AUS_PARCEL_REGULAR" },
  "Bx3": { dimensions: { length: 40, width: 20, height: 18 }, name: "Bx3 Long", serviceCode: "AUS_PARCEL_REGULAR" },
  "Bx4": { dimensions: { length: 43, width: 30.5, height: 14 }, name: "Bx4 Wide", serviceCode: "AUS_PARCEL_REGULAR" },
  "Bx5": { dimensions: { length: 40.5, width: 30, height: 25.5 }, name: "Bx5 Large", serviceCode: "AUS_PARCEL_REGULAR" }
};

async function testAustraliaPostBox(scenario, route) {
  console.log(`\n📦 Testing Australia Post Box: ${scenario.name}`);
  console.log(`📍 Route: ${route.name}`);
  console.log(`📦 Item: ${scenario.description}`);
  console.log(`📏 Dimensions: ${scenario.length}×${scenario.width}×${scenario.height}cm, ${scenario.weight}kg`);
  
  const suggestedBox = AUSPOST_BOXES[scenario.suggestedBox];
  console.log(`📮 Suggested Box: ${suggestedBox.name} (${suggestedBox.dimensions.length}×${suggestedBox.dimensions.width}×${suggestedBox.dimensions.height}cm)`);

  try {
    // Test both regular and express
    const services = [
      { code: "AUS_PARCEL_REGULAR", name: "Regular Parcel" },
      { code: "AUS_PARCEL_EXPRESS", name: "Express Parcel" }
    ];

    const results = [];

    for (const service of services) {
      const url = `${AUSPOST_BASE_URL}/postage/parcel/domestic/calculate.json` +
        `?from_postcode=${route.from}` +
        `&to_postcode=${route.to}` +
        `&length=${scenario.length}` +
        `&width=${scenario.width}` +
        `&height=${scenario.height}` +
        `&weight=${scenario.weight}` +
        `&service_code=${service.code}`;

      const response = await fetch(url, {
        headers: { 'AUTH-KEY': AUSPOST_API_KEY }
      });

      const data = await response.json();

      if (response.ok && data.postage_result) {
        const cost = parseFloat(data.postage_result.total_cost);
        console.log(`   ✅ ${service.name}: $${cost} - ${data.postage_result.delivery_time}`);
        
        results.push({
          service: service.name,
          cost: cost,
          deliveryTime: data.postage_result.delivery_time,
          carrier: "Australia Post"
        });
      } else {
        console.log(`   ❌ ${service.name}: Failed`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return {
      success: results.length > 0,
      services: results,
      cheapest: results.length > 0 ? results.reduce((min, curr) => curr.cost < min.cost ? curr : min) : null
    };

  } catch (error) {
    console.log(`❌ Australia Post Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testInterparcel(scenario, route) {
  console.log(`\n🚚 Testing Interparcel: ${scenario.name}`);
  console.log(`📍 Route: ${route.name}`);

  try {
    const requestBody = {
      collection: {
        city: "Geelong",
        state: "VIC",
        postcode: route.from,
        country: "AU"
      },
      delivery: {
        city: route.name.split(' → ')[1],
        state: getStateFromCity(route.name.split(' → ')[1]),
        postcode: route.to,
        country: "AU"
      },
      parcels: [{
        weight: scenario.weight,
        length: scenario.length,
        width: scenario.width,
        height: scenario.height
      }]
    };

    const response = await fetch('https://api.interparcel.com/quote', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Interparcel-Auth': INTERPARCEL_API_KEY,
        'X-Interparcel-API-Version': '3'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (response.ok && data.status === 0 && data.services && data.services.length > 0) {
      // Sort by price and show top 3
      const sortedServices = data.services.sort((a, b) => a.price - b.price);
      const topServices = sortedServices.slice(0, 3);

      console.log(`   ✅ Found ${data.services.length} services (showing top 3):`);
      topServices.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.carrier} ${service.name}: $${service.price} (${service.delivery.daysFrom}-${service.delivery.daysTo} days)`);
      });

      return {
        success: true,
        totalServices: data.services.length,
        services: topServices,
        cheapest: sortedServices[0],
        allServices: sortedServices
      };

    } else {
      console.log(`   ❌ No services available or API error`);
      return { success: false, error: 'No services available' };
    }

  } catch (error) {
    console.log(`❌ Interparcel Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function getStateFromCity(city) {
  const cityStateMap = {
    "Melbourne": "VIC",
    "Sydney": "NSW", 
    "Brisbane": "QLD",
    "Adelaide": "SA",
    "Perth": "WA"
  };
  return cityStateMap[city] || "VIC";
}

async function compareServices(scenario, route) {
  console.log(`\n🔍 COMPARISON: ${scenario.name} - ${route.name}`);
  console.log('='.repeat(60));

  const auspostResult = await testAustraliaPostBox(scenario, route);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const interparcelResult = await testInterparcel(scenario, route);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Compare results
  console.log(`\n📊 COMPARISON SUMMARY:`);
  
  if (auspostResult.success && interparcelResult.success) {
    const auspostCheapest = auspostResult.cheapest;
    const interparcelCheapest = interparcelResult.cheapest;
    
    console.log(`   Australia Post (Cheapest): $${auspostCheapest.cost} - ${auspostCheapest.service}`);
    console.log(`   Interparcel (Cheapest): $${interparcelCheapest.price} - ${interparcelCheapest.carrier} ${interparcelCheapest.name}`);
    
    const difference = Math.abs(auspostCheapest.cost - interparcelCheapest.price);
    const winner = auspostCheapest.cost < interparcelCheapest.price ? 'Australia Post' : 'Interparcel';
    const savings = auspostCheapest.cost < interparcelCheapest.price ? 
      interparcelCheapest.price - auspostCheapest.cost : 
      auspostCheapest.cost - interparcelCheapest.price;
    
    console.log(`   🏆 Winner: ${winner} (saves $${savings.toFixed(2)})`);
    
    return {
      success: true,
      auspost: auspostResult,
      interparcel: interparcelResult,
      winner: winner,
      savings: savings,
      auspostPrice: auspostCheapest.cost,
      interparcelPrice: interparcelCheapest.price
    };
  } else {
    console.log(`   ⚠️ Comparison incomplete - some services failed`);
    return {
      success: false,
      auspost: auspostResult,
      interparcel: interparcelResult
    };
  }
}

async function runBoxVsInterparcelComparison() {
  console.log('📦 Australia Post Boxes vs 🚚 Interparcel Comparison');
  console.log('=====================================================');
  console.log('🏢 Business: Geelong Garage Doors');
  console.log('📍 Base: Geelong, VIC 3220\n');

  if (!AUSPOST_API_KEY || !INTERPARCEL_API_KEY) {
    console.log('❌ Missing API keys');
    return;
  }

  console.log(`🔑 Australia Post API: ${AUSPOST_API_KEY.substring(0, 8)}...`);
  console.log(`🔑 Interparcel API: ${INTERPARCEL_API_KEY.substring(0, 8)}...\n`);

  const allResults = [];

  for (const scenario of COMPARISON_SCENARIOS) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TESTING SCENARIO: ${scenario.name.toUpperCase()}`);
    console.log(`${'='.repeat(80)}`);

    for (const route of scenario.routes) {
      const result = await compareServices(scenario, route);
      
      allResults.push({
        scenario: scenario.name,
        route: route.name,
        item: scenario.description,
        weight: scenario.weight,
        ...result
      });

      console.log('\n⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Overall Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 OVERALL COMPARISON SUMMARY');
  console.log(`${'='.repeat(80)}`);

  const successfulComparisons = allResults.filter(r => r.success);
  const auspostWins = successfulComparisons.filter(r => r.winner === 'Australia Post');
  const interparcelWins = successfulComparisons.filter(r => r.winner === 'Interparcel');

  console.log(`\n🏆 WINNER ANALYSIS:`);
  console.log(`   Australia Post wins: ${auspostWins.length}/${successfulComparisons.length} comparisons`);
  console.log(`   Interparcel wins: ${interparcelWins.length}/${successfulComparisons.length} comparisons`);

  if (successfulComparisons.length > 0) {
    const avgAuspostPrice = successfulComparisons.reduce((sum, r) => sum + r.auspostPrice, 0) / successfulComparisons.length;
    const avgInterparcelPrice = successfulComparisons.reduce((sum, r) => sum + r.interparcelPrice, 0) / successfulComparisons.length;
    const totalSavings = successfulComparisons.reduce((sum, r) => sum + r.savings, 0);

    console.log(`\n💰 PRICING ANALYSIS:`);
    console.log(`   Average Australia Post: $${avgAuspostPrice.toFixed(2)}`);
    console.log(`   Average Interparcel: $${avgInterparcelPrice.toFixed(2)}`);
    console.log(`   Total potential savings: $${totalSavings.toFixed(2)}`);
    console.log(`   Average savings per shipment: $${(totalSavings / successfulComparisons.length).toFixed(2)}`);

    console.log(`\n📦 BY ITEM TYPE:`);
    const itemTypes = [...new Set(successfulComparisons.map(r => r.scenario))];
    itemTypes.forEach(itemType => {
      const itemResults = successfulComparisons.filter(r => r.scenario === itemType);
      const itemAuspostWins = itemResults.filter(r => r.winner === 'Australia Post').length;
      const itemInterparcelWins = itemResults.filter(r => r.winner === 'Interparcel').length;
      console.log(`   ${itemType}: Australia Post ${itemAuspostWins}/${itemResults.length}, Interparcel ${itemInterparcelWins}/${itemResults.length}`);
    });

    console.log(`\n🎯 RECOMMENDATIONS:`);
    if (auspostWins.length > interparcelWins.length) {
      console.log(`   ✅ Australia Post boxes are generally more cost-effective`);
      console.log(`   📦 Use Australia Post for most garage door parts`);
      console.log(`   🚚 Consider Interparcel for specific routes where it's cheaper`);
    } else if (interparcelWins.length > auspostWins.length) {
      console.log(`   ✅ Interparcel is generally more cost-effective`);
      console.log(`   🚚 Use Interparcel as primary shipping option`);
      console.log(`   📦 Use Australia Post boxes for specific items where it's cheaper`);
    } else {
      console.log(`   ⚖️ Both services are competitive`);
      console.log(`   💡 Offer both options to customers for flexibility`);
    }
  }

  console.log('\n🎉 Box vs Interparcel comparison completed!');
  
  return {
    totalComparisons: allResults.length,
    successful: successfulComparisons.length,
    auspostWins: auspostWins.length,
    interparcelWins: interparcelWins.length,
    results: allResults
  };
}

// Run the comparison
runBoxVsInterparcelComparison()
  .then((summary) => {
    console.log(`\n🏁 Final Results: ${summary.successful}/${summary.totalComparisons} comparisons completed`);
    console.log(`📦 Australia Post: ${summary.auspostWins} wins`);
    console.log(`🚚 Interparcel: ${summary.interparcelWins} wins`);
  })
  .catch((error) => {
    console.error('\n💥 Comparison failed:', error);
  });
