const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Test Australia Post services through Interparcel API after enabling them
const AUSPOST_INTERPARCEL_SCENARIOS = [
  {
    name: "Small Remote - Australia Post via Interparcel",
    description: "Test Australia Post services for garage door remote",
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
      weight: 0.3, // 300g
      length: 15,
      width: 8,
      height: 4
    }],
    filter: {
      carriers: ["Australia Post"]
    }
  },
  {
    name: "Medium Parts - Australia Post Satchel Test",
    description: "Test Australia Post satchel services via Interparcel",
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
      weight: 1.5, // 1.5kg - perfect for satchel
      length: 25,
      width: 20,
      height: 8
    }],
    filter: {
      carriers: ["Australia Post"]
    }
  },
  {
    name: "Heavy Item - Australia Post Box Test",
    description: "Test Australia Post box services via Interparcel",
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
      weight: 5.0, // 5kg - needs box
      length: 35,
      width: 25,
      height: 15
    }],
    filter: {
      carriers: ["Australia Post"]
    }
  },
  {
    name: "All Carriers Comparison",
    description: "Compare all available carriers including Australia Post",
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
      weight: 2.0, // 2kg
      length: 30,
      width: 20,
      height: 10
    }]
    // No filter - get all carriers including Australia Post
  }
];

async function testAustraliaPostViaInterparcel(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log(`📍 Route: ${scenario.collection.city} → ${scenario.delivery.city}`);
  console.log(`📦 Parcel: ${scenario.parcels[0].weight}kg, ${scenario.parcels[0].length}×${scenario.parcels[0].width}×${scenario.parcels[0].height}cm`);
  
  if (scenario.filter && scenario.filter.carriers) {
    console.log(`🔍 Filter: ${scenario.filter.carriers.join(', ')}`);
  } else {
    console.log(`🔍 Filter: All carriers`);
  }

  try {
    const requestBody = {
      collection: scenario.collection,
      delivery: scenario.delivery,
      parcels: scenario.parcels
    };

    if (scenario.filter) {
      requestBody.filter = scenario.filter;
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
        // Look for Australia Post services
        const ausPostServices = data.services.filter(service => 
          service.carrier.toLowerCase().includes('australia post') ||
          service.carrier.toLowerCase().includes('auspost') ||
          service.carrier.toLowerCase().includes('australia') ||
          service.carrier.toLowerCase().includes('post')
        );

        console.log(`✅ Found ${data.services.length} total services`);
        console.log(`📮 Australia Post services: ${ausPostServices.length}`);

        if (ausPostServices.length > 0) {
          console.log(`\n🇦🇺 AUSTRALIA POST SERVICES FOUND:`);
          ausPostServices.sort((a, b) => a.price - b.price).forEach((service, index) => {
            console.log(`   ${index + 1}. ${service.name}`);
            console.log(`      Carrier: ${service.carrier}`);
            console.log(`      Price: $${service.price} ${service.currency}`);
            console.log(`      Delivery: ${service.delivery.daysFrom}-${service.delivery.daysTo} days`);
            console.log(`      Service Level: ${service.serviceLevel}`);
            console.log(`      Pickup Type: ${service.pickupType}`);
            
            // Check if it's a satchel service
            const isSatchel = service.name.toLowerCase().includes('satchel') || 
                             service.name.toLowerCase().includes('prepaid');
            console.log(`      📮 Type: ${isSatchel ? 'Satchel' : 'Box/Parcel'}`);
            console.log('');
          });

          // Compare with other carriers
          const otherServices = data.services.filter(service => 
            !service.carrier.toLowerCase().includes('australia post') &&
            !service.carrier.toLowerCase().includes('auspost')
          );

          if (otherServices.length > 0) {
            const cheapestOther = otherServices.sort((a, b) => a.price - b.price)[0];
            const cheapestAusPost = ausPostServices.sort((a, b) => a.price - b.price)[0];
            
            console.log(`💰 PRICE COMPARISON:`);
            console.log(`   Cheapest Australia Post: $${cheapestAusPost.price} (${cheapestAusPost.name})`);
            console.log(`   Cheapest Other Carrier: $${cheapestOther.price} (${cheapestOther.carrier} ${cheapestOther.name})`);
            
            const difference = Math.abs(cheapestAusPost.price - cheapestOther.price);
            const winner = cheapestAusPost.price < cheapestOther.price ? 'Australia Post' : cheapestOther.carrier;
            console.log(`   🏆 Winner: ${winner} (saves $${difference.toFixed(2)})`);
          }

          return {
            success: true,
            totalServices: data.services.length,
            ausPostServices: ausPostServices.length,
            ausPostOptions: ausPostServices,
            cheapestAusPost: ausPostServices.sort((a, b) => a.price - b.price)[0],
            allServices: data.services
          };

        } else {
          console.log(`⚠️ No Australia Post services found`);
          console.log(`Available carriers: ${[...new Set(data.services.map(s => s.carrier))].join(', ')}`);
          
          return {
            success: true,
            totalServices: data.services.length,
            ausPostServices: 0,
            availableCarriers: [...new Set(data.services.map(s => s.carrier))],
            allServices: data.services
          };
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

async function testAllCarriersWithAusPost() {
  console.log(`\n🔍 COMPREHENSIVE CARRIER TEST - Including Australia Post`);
  console.log(`📍 Route: Geelong → Melbourne`);
  console.log(`📦 Sample: 1kg, 25×20×10cm\n`);

  try {
    const requestBody = {
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
        weight: 1.0,
        length: 25,
        width: 20,
        height: 10
      }]
      // No filter - get ALL carriers
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

    if (response.ok && data.status === 0 && data.services && data.services.length > 0) {
      console.log(`✅ Found ${data.services.length} total services\n`);
      
      // Group by carrier
      const carrierMap = {};
      data.services.forEach(service => {
        if (!carrierMap[service.carrier]) {
          carrierMap[service.carrier] = [];
        }
        carrierMap[service.carrier].push(service);
      });

      console.log('📋 ALL AVAILABLE CARRIERS:');
      console.log('='.repeat(40));
      
      // Sort carriers alphabetically, but put Australia Post first if it exists
      const sortedCarriers = Object.keys(carrierMap).sort((a, b) => {
        if (a.toLowerCase().includes('australia')) return -1;
        if (b.toLowerCase().includes('australia')) return 1;
        return a.localeCompare(b);
      });

      sortedCarriers.forEach(carrier => {
        const services = carrierMap[carrier];
        const isAusPost = carrier.toLowerCase().includes('australia') || carrier.toLowerCase().includes('post');
        
        console.log(`\n${isAusPost ? '🇦🇺' : '🚚'} ${carrier} (${services.length} services):`);
        
        services.sort((a, b) => a.price - b.price).forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name}`);
          console.log(`      Price: $${service.price} ${service.currency}`);
          console.log(`      Delivery: ${service.delivery.daysFrom}-${service.delivery.daysTo} days`);
          console.log(`      Service Level: ${service.serviceLevel}`);
          
          if (isAusPost) {
            const isSatchel = service.name.toLowerCase().includes('satchel');
            console.log(`      📮 Type: ${isSatchel ? 'Satchel' : 'Box/Parcel'}`);
          }
          console.log('');
        });
      });

      // Australia Post analysis
      const ausPostCarriers = sortedCarriers.filter(carrier => 
        carrier.toLowerCase().includes('australia') || carrier.toLowerCase().includes('post')
      );

      console.log('\n🇦🇺 AUSTRALIA POST ANALYSIS:');
      console.log('='.repeat(35));
      
      if (ausPostCarriers.length > 0) {
        console.log(`✅ Australia Post is NOW AVAILABLE!`);
        console.log(`📮 Carriers found: ${ausPostCarriers.join(', ')}`);
        
        let totalAusPostServices = 0;
        let allAusPostServices = [];
        
        ausPostCarriers.forEach(carrier => {
          const services = carrierMap[carrier];
          totalAusPostServices += services.length;
          allAusPostServices = [...allAusPostServices, ...services];
        });
        
        console.log(`📊 Total Australia Post services: ${totalAusPostServices}`);
        
        // Find satchel services
        const satchelServices = allAusPostServices.filter(s => 
          s.name.toLowerCase().includes('satchel')
        );
        
        console.log(`📮 Satchel services: ${satchelServices.length}`);
        if (satchelServices.length > 0) {
          satchelServices.forEach(service => {
            console.log(`   - ${service.name}: $${service.price}`);
          });
        }
        
        // Price comparison
        const cheapestAusPost = allAusPostServices.sort((a, b) => a.price - b.price)[0];
        const allOtherServices = data.services.filter(s => 
          !ausPostCarriers.some(carrier => s.carrier === carrier)
        );
        const cheapestOther = allOtherServices.sort((a, b) => a.price - b.price)[0];
        
        console.log(`\n💰 PRICE COMPARISON:`);
        console.log(`   Cheapest Australia Post: $${cheapestAusPost.price} (${cheapestAusPost.name})`);
        console.log(`   Cheapest Other: $${cheapestOther.price} (${cheapestOther.carrier} ${cheapestOther.name})`);
        
        return {
          success: true,
          hasAustraliaPost: true,
          ausPostCarriers: ausPostCarriers,
          totalAusPostServices: totalAusPostServices,
          satchelServices: satchelServices.length,
          cheapestAusPost: cheapestAusPost,
          cheapestOther: cheapestOther
        };
        
      } else {
        console.log(`❌ Australia Post still not available`);
        console.log(`Available carriers: ${sortedCarriers.join(', ')}`);
        
        return {
          success: true,
          hasAustraliaPost: false,
          availableCarriers: sortedCarriers
        };
      }

    } else {
      console.log(`❌ No services available`);
      return { success: false, reason: 'No services available' };
    }

  } catch (error) {
    console.log(`❌ Request failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runAustraliaPostInterparcelTest() {
  console.log('🇦🇺 Australia Post via Interparcel API Test');
  console.log('============================================');
  
  if (!process.env.INTERPARCEL_API_KEY) {
    console.log('❌ INTERPARCEL_API_KEY not found in environment variables');
    return;
  }

  console.log(`🔑 API Key: Loaded ✅`);
  console.log(`🏢 Business: Geelong Garage Doors`);
  console.log(`📍 Base Location: Geelong, VIC 3220`);
  console.log(`🎯 Testing: Australia Post services via Interparcel\n`);

  // First, test comprehensive carrier list
  const carrierTest = await testAllCarriersWithAusPost();
  
  if (!carrierTest.hasAustraliaPost) {
    console.log('\n❌ Australia Post services are still not available through Interparcel');
    console.log('💡 Please check with Interparcel support to ensure Australia Post is enabled for your account');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('🧪 AUSTRALIA POST SPECIFIC TESTS');
  console.log('='.repeat(60));

  const results = [];

  for (let i = 0; i < AUSPOST_INTERPARCEL_SCENARIOS.length; i++) {
    const scenario = AUSPOST_INTERPARCEL_SCENARIOS[i];
    const result = await testAustraliaPostViaInterparcel(scenario);
    
    results.push({
      scenario: scenario.name,
      ...result
    });

    if (i < AUSPOST_INTERPARCEL_SCENARIOS.length - 1) {
      console.log('\n⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary Report
  console.log('\n📊 AUSTRALIA POST VIA INTERPARCEL SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const withAusPost = successful.filter(r => r.ausPostServices > 0);
  
  console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
  console.log(`🇦🇺 Tests with Australia Post: ${withAusPost.length}/${successful.length}`);

  if (withAusPost.length > 0) {
    console.log('\n📮 AUSTRALIA POST SERVICE ANALYSIS:');
    
    const totalAusPostServices = withAusPost.reduce((sum, r) => sum + r.ausPostServices, 0);
    console.log(`   Total Australia Post services found: ${totalAusPostServices}`);
    
    // Collect all Australia Post services
    let allAusPostServices = [];
    withAusPost.forEach(result => {
      if (result.ausPostOptions) {
        allAusPostServices = [...allAusPostServices, ...result.ausPostOptions];
      }
    });
    
    // Find unique service types
    const uniqueServices = [...new Map(allAusPostServices.map(s => [s.name, s])).values()];
    console.log(`   Unique service types: ${uniqueServices.length}`);
    
    console.log('\n🏆 AVAILABLE AUSTRALIA POST SERVICES:');
    uniqueServices.sort((a, b) => a.price - b.price).forEach((service, index) => {
      const isSatchel = service.name.toLowerCase().includes('satchel');
      console.log(`   ${index + 1}. ${service.name}`);
      console.log(`      Price: $${service.price} ${service.currency}`);
      console.log(`      Type: ${isSatchel ? '📮 Satchel' : '📦 Box/Parcel'}`);
      console.log(`      Delivery: ${service.delivery.daysFrom}-${service.delivery.daysTo} days`);
    });

    console.log('\n🎯 BUSINESS IMPACT:');
    console.log('✅ Australia Post is now available through Interparcel!');
    console.log('📮 You can offer both Interparcel couriers AND Australia Post');
    console.log('💰 Customers can choose between speed (couriers) and familiarity (Australia Post)');
    console.log('🏆 Best of both worlds - competitive pricing with trusted Australia Post option');

  } else {
    console.log('\n⚠️ Australia Post services were not found in the test scenarios');
    console.log('💡 This might be due to specific route or parcel restrictions');
  }

  console.log('\n🎉 Australia Post via Interparcel testing completed!');
  
  return {
    totalTests: results.length,
    successful: successful.length,
    withAustraliaPost: withAusPost.length,
    carrierTest: carrierTest,
    results: results
  };
}

// Run the Australia Post via Interparcel test
runAustraliaPostInterparcelTest()
  .then((summary) => {
    console.log(`\n🏁 Final Results: ${summary.successful}/${summary.totalTests} tests successful`);
    console.log(`🇦🇺 Australia Post available: ${summary.withAustraliaPost > 0 ? 'YES ✅' : 'NO ❌'}`);
    
    if (summary.withAustraliaPost > 0) {
      console.log('🎯 SUCCESS! Australia Post services are now integrated via Interparcel');
    } else {
      console.log('⚠️ Australia Post services may need additional configuration');
    }
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
  });
