const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

async function testAvailableCarriers() {
  console.log('🔍 Testing Available Carriers through Interparcel API');
  console.log('===================================================');
  
  if (!process.env.INTERPARCEL_API_KEY) {
    console.log('❌ INTERPARCEL_API_KEY not found in environment variables');
    return;
  }

  console.log(`🔑 API Key: Loaded ✅\n`);

  // Test with a simple request to see all available carriers
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
      weight: 1.0, // 1kg
      length: 20,
      width: 15,
      height: 10
    }]
    // No filter - get all carriers
  };

  console.log('🧪 Testing route: Geelong → Melbourne');
  console.log('📦 Parcel: 1kg, 20×15×10cm');
  console.log('🔍 Filter: None (all carriers)\n');

  try {
    const response = await fetch('https://api.interparcel.com/quote', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Interparcel-Auth': process.env.INTERPARCEL_API_KEY,
        'X-Interparcel-API-Version': '3'
      },
      body: JSON.stringify(testRequest)
    });

    const data = await response.json();

    if (response.ok && data.status === 0) {
      if (data.services && data.services.length > 0) {
        console.log(`✅ Found ${data.services.length} total services\n`);
        
        // Analyze all carriers
        const carrierMap = {};
        data.services.forEach(service => {
          if (!carrierMap[service.carrier]) {
            carrierMap[service.carrier] = [];
          }
          carrierMap[service.carrier].push(service);
        });

        console.log('📋 Available Carriers:');
        console.log('='.repeat(30));
        Object.keys(carrierMap).sort().forEach(carrier => {
          const services = carrierMap[carrier];
          console.log(`\n🚚 ${carrier} (${services.length} services):`);
          
          services.sort((a, b) => a.price - b.price).forEach((service, index) => {
            console.log(`   ${index + 1}. ${service.name}`);
            console.log(`      Price: $${service.price} ${service.currency}`);
            console.log(`      Delivery: ${service.delivery.daysFrom}-${service.delivery.daysTo} days`);
            console.log(`      Service Level: ${service.serviceLevel}`);
            console.log(`      Pickup Type: ${service.pickupType}`);
            
            // Check for satchel-like services
            const isSatchelLike = service.name.toLowerCase().includes('satchel') || 
                                 service.name.toLowerCase().includes('prepaid') ||
                                 service.name.toLowerCase().includes('envelope') ||
                                 service.name.toLowerCase().includes('bag');
            if (isSatchelLike) {
              console.log(`      📮 Satchel-like: Yes`);
            }
            console.log('');
          });
        });

        // Look specifically for Australia Post or similar
        console.log('\n🇦🇺 Australia Post Analysis:');
        console.log('='.repeat(30));
        
        const ausPostVariations = [
          'Australia Post', 'AusPost', 'Australian Post', 'AP', 'Post'
        ];
        
        let foundAusPost = false;
        ausPostVariations.forEach(variation => {
          const matches = Object.keys(carrierMap).filter(carrier => 
            carrier.toLowerCase().includes(variation.toLowerCase())
          );
          if (matches.length > 0) {
            foundAusPost = true;
            console.log(`✅ Found: ${matches.join(', ')}`);
          }
        });

        if (!foundAusPost) {
          console.log('❌ Australia Post not found in available carriers');
          console.log('💡 Available carriers:');
          Object.keys(carrierMap).forEach(carrier => {
            console.log(`   - ${carrier}`);
          });
        }

        // Look for satchel-like services across all carriers
        console.log('\n📮 Satchel-like Services Analysis:');
        console.log('='.repeat(35));
        
        const satchelServices = data.services.filter(service => {
          const name = service.name.toLowerCase();
          return name.includes('satchel') || 
                 name.includes('prepaid') ||
                 name.includes('envelope') ||
                 name.includes('bag') ||
                 name.includes('pouch');
        });

        if (satchelServices.length > 0) {
          console.log(`✅ Found ${satchelServices.length} satchel-like services:`);
          satchelServices.forEach(service => {
            console.log(`   - ${service.carrier}: ${service.name} ($${service.price})`);
          });
        } else {
          console.log('❌ No satchel-like services found');
        }

        return {
          success: true,
          totalServices: data.services.length,
          carriers: Object.keys(carrierMap),
          carrierCount: Object.keys(carrierMap).length,
          satchelServices: satchelServices.length,
          hasAustraliaPost: foundAusPost
        };

      } else {
        console.log('❌ No services available for this route');
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

// Run the test
testAvailableCarriers()
  .then((result) => {
    if (result.success) {
      console.log('\n🎯 SUMMARY:');
      console.log(`   Total Services: ${result.totalServices}`);
      console.log(`   Total Carriers: ${result.carrierCount}`);
      console.log(`   Satchel Services: ${result.satchelServices}`);
      console.log(`   Australia Post: ${result.hasAustraliaPost ? '✅ Available' : '❌ Not Available'}`);
      
      if (!result.hasAustraliaPost) {
        console.log('\n💡 Recommendation:');
        console.log('   Australia Post may not be available through Interparcel API.');
        console.log('   Consider using direct Australia Post API integration instead.');
      }
    } else {
      console.log('\n❌ Test failed:', result.reason || result.error);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
  });
