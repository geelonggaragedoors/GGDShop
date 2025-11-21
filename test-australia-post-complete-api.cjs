const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const AUSPOST_API_KEY = process.env.AUSPOST_API_KEY;
const AUSPOST_BASE_URL = 'https://digitalapi.auspost.com.au';

// All Australia Post API endpoints to test
const API_ENDPOINTS = [
  {
    name: "Domestic Postcode Search",
    endpoint: "postcode/search.json?q=3220",
    description: "Search for postcode information"
  },
  {
    name: "Countries List", 
    endpoint: "country.json",
    description: "List of accepted countries"
  },
  {
    name: "Domestic Letter Thickness",
    endpoint: "postage/letter/domestic/thickness.json",
    description: "Available letter thickness values"
  },
  {
    name: "Domestic Letter Weight",
    endpoint: "postage/letter/domestic/weight.json", 
    description: "Available letter weight values"
  },
  {
    name: "Domestic Letter Size",
    endpoint: "postage/letter/domestic/size.json",
    description: "Available envelope types"
  },
  {
    name: "International Letter Weight",
    endpoint: "postage/letter/international/weight.json",
    description: "International letter weight values"
  },
  {
    name: "International Parcel Weight", 
    endpoint: "postage/parcel/international/weight.json",
    description: "International parcel weight values"
  },
  {
    name: "Domestic Parcel Weight",
    endpoint: "postage/parcel/domestic/weight.json",
    description: "Domestic parcel weight values"
  },
  {
    name: "Domestic Parcel Type",
    endpoint: "postage/parcel/domestic/type.json",
    description: "Parcel types (Boxed items or Satchels)"
  },
  {
    name: "Domestic Parcel Size",
    endpoint: "postage/parcel/domestic/size.json", 
    description: "Available parcel box sizes"
  },
  {
    name: "Domestic Letter Services",
    endpoint: "postage/letter/domestic/service.json",
    description: "Available domestic letter services"
  },
  {
    name: "Domestic Parcel Services",
    endpoint: "postage/parcel/domestic/service.json?from_postcode=3220&to_postcode=3000&length=25&width=20&height=10&weight=1",
    description: "Available domestic parcel services"
  },
  {
    name: "International Letter Services",
    endpoint: "postage/letter/international/service.json?country_code=US&weight=0.05",
    description: "Available international letter services"
  },
  {
    name: "International Parcel Services", 
    endpoint: "postage/parcel/international/service.json?country_code=US&weight=1",
    description: "Available international parcel services"
  }
];

// Test calculation endpoints with sample data
const CALCULATION_TESTS = [
  {
    name: "Domestic Parcel Calculation",
    endpoint: "postage/parcel/domestic/calculate.json?from_postcode=3220&to_postcode=3000&length=25&width=20&height=10&weight=1&service_code=AUS_PARCEL_REGULAR",
    description: "Calculate domestic parcel cost"
  },
  {
    name: "Domestic Letter Calculation",
    endpoint: "postage/letter/domestic/calculate.json?service_code=AUS_LETTER_REGULAR_LARGE&weight=0.125&thickness=20",
    description: "Calculate domestic letter cost"
  },
  {
    name: "International Parcel Calculation",
    endpoint: "postage/parcel/international/calculate.json?country_code=US&weight=1&service_code=INT_PARCEL_STD_OWN_PACKAGING",
    description: "Calculate international parcel cost"
  },
  {
    name: "International Letter Calculation", 
    endpoint: "postage/letter/international/calculate.json?country_code=US&weight=0.05&service_code=INT_LETTER_REG_SMALL_ENVELOPE",
    description: "Calculate international letter cost"
  }
];

async function testEndpoint(test) {
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`📝 ${test.description}`);
  console.log(`🔗 Endpoint: ${test.endpoint}`);

  try {
    const url = `${AUSPOST_BASE_URL}/${test.endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'AUTH-KEY': AUSPOST_API_KEY
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      
      // Special handling for different endpoint types
      if (test.name.includes("Services")) {
        return handleServicesResponse(data, test.name);
      } else if (test.name.includes("Type")) {
        return handleTypeResponse(data, test.name);
      } else if (test.name.includes("Size")) {
        return handleSizeResponse(data, test.name);
      } else if (test.name.includes("Weight")) {
        return handleWeightResponse(data, test.name);
      } else if (test.name.includes("Calculation")) {
        return handleCalculationResponse(data, test.name);
      } else {
        return handleGenericResponse(data, test.name);
      }

    } else {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
      return { success: false, error: errorText };
    }

  } catch (error) {
    console.log(`❌ Request Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function handleServicesResponse(data, testName) {
  if (data.services && data.services.service) {
    const services = data.services.service;
    console.log(`✅ Found ${services.length} services:`);
    
    // Group by service type
    const satchelServices = services.filter(s => 
      s.code.toLowerCase().includes('satchel') || 
      s.name.toLowerCase().includes('satchel')
    );
    const regularServices = services.filter(s => 
      !s.code.toLowerCase().includes('satchel') && 
      !s.name.toLowerCase().includes('satchel')
    );

    console.log(`📮 Satchel Services: ${satchelServices.length}`);
    console.log(`📦 Regular Services: ${regularServices.length}`);

    // Show all services
    services.forEach((service, index) => {
      const isSatchel = service.code.toLowerCase().includes('satchel');
      console.log(`   ${index + 1}. ${service.name} (${service.code})`);
      if (service.price) console.log(`      Price: $${service.price}`);
      console.log(`      Type: ${isSatchel ? '📮 Satchel' : '📦 Regular'}`);
      if (service.max_extra_cover) console.log(`      Max Cover: $${service.max_extra_cover}`);
    });

    return {
      success: true,
      totalServices: services.length,
      satchelServices: satchelServices.length,
      regularServices: regularServices.length,
      services: services
    };
  } else {
    console.log(`⚠️ Unexpected response format:`, JSON.stringify(data, null, 2));
    return { success: false, error: 'Unexpected response format' };
  }
}

function handleTypeResponse(data, testName) {
  if (data.types && data.types.type) {
    const types = data.types.type;
    console.log(`✅ Found ${types.length} parcel types:`);
    
    types.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type.name} (${type.code})`);
    });

    // Look for satchel types
    const satchelTypes = types.filter(t => 
      t.name.toLowerCase().includes('satchel') || 
      t.code.toLowerCase().includes('satchel')
    );
    
    console.log(`📮 Satchel Types: ${satchelTypes.length}`);
    if (satchelTypes.length > 0) {
      satchelTypes.forEach(type => {
        console.log(`   📮 ${type.name} (${type.code})`);
      });
    }

    return {
      success: true,
      totalTypes: types.length,
      satchelTypes: satchelTypes.length,
      types: types
    };
  } else {
    console.log(`⚠️ Response:`, JSON.stringify(data, null, 2));
    return { success: true, data: data };
  }
}

function handleSizeResponse(data, testName) {
  if (data.sizes && data.sizes.size) {
    const sizes = data.sizes.size;
    console.log(`✅ Found ${sizes.length} sizes:`);
    
    sizes.forEach((size, index) => {
      console.log(`   ${index + 1}. ${size.name} (${size.code})`);
      if (size.value) console.log(`      Value: ${size.value}`);
    });

    return {
      success: true,
      totalSizes: sizes.length,
      sizes: sizes
    };
  } else {
    console.log(`⚠️ Response:`, JSON.stringify(data, null, 2));
    return { success: true, data: data };
  }
}

function handleWeightResponse(data, testName) {
  if (data.weights && data.weights.weight) {
    const weights = data.weights.weight;
    console.log(`✅ Found ${weights.length} weight options:`);
    
    weights.slice(0, 10).forEach((weight, index) => {
      console.log(`   ${index + 1}. ${weight.value}${weight.name ? ` (${weight.name})` : ''}`);
    });
    
    if (weights.length > 10) {
      console.log(`   ... and ${weights.length - 10} more`);
    }

    return {
      success: true,
      totalWeights: weights.length,
      weights: weights
    };
  } else {
    console.log(`⚠️ Response:`, JSON.stringify(data, null, 2));
    return { success: true, data: data };
  }
}

function handleCalculationResponse(data, testName) {
  if (data.postage_result) {
    console.log(`✅ Calculation successful:`);
    console.log(`   Service: ${data.postage_result.service}`);
    console.log(`   Total Cost: $${data.postage_result.total_cost}`);
    console.log(`   Delivery Time: ${data.postage_result.delivery_time}`);
    
    if (data.postage_result.costs && data.postage_result.costs.cost) {
      console.log(`   Cost Breakdown:`);
      const costs = Array.isArray(data.postage_result.costs.cost) ? 
        data.postage_result.costs.cost : [data.postage_result.costs.cost];
      
      costs.forEach(cost => {
        console.log(`     ${cost.item}: $${cost.cost}`);
      });
    }

    return {
      success: true,
      totalCost: parseFloat(data.postage_result.total_cost),
      service: data.postage_result.service,
      deliveryTime: data.postage_result.delivery_time
    };
  } else {
    console.log(`⚠️ Response:`, JSON.stringify(data, null, 2));
    return { success: false, error: 'No postage result' };
  }
}

function handleGenericResponse(data, testName) {
  console.log(`✅ Response received:`);
  
  // Try to find the main data array
  const keys = Object.keys(data);
  let mainData = null;
  let dataKey = null;

  for (const key of keys) {
    if (Array.isArray(data[key]) || (data[key] && typeof data[key] === 'object')) {
      mainData = data[key];
      dataKey = key;
      break;
    }
  }

  if (mainData && Array.isArray(mainData)) {
    console.log(`   Found ${mainData.length} items in ${dataKey}:`);
    mainData.slice(0, 5).forEach((item, index) => {
      console.log(`   ${index + 1}. ${JSON.stringify(item)}`);
    });
    if (mainData.length > 5) {
      console.log(`   ... and ${mainData.length - 5} more`);
    }
  } else if (mainData && mainData.locality) {
    // Handle postcode search results
    const localities = Array.isArray(mainData.locality) ? mainData.locality : [mainData.locality];
    console.log(`   Found ${localities.length} localities:`);
    localities.forEach((locality, index) => {
      console.log(`   ${index + 1}. ${locality.location}, ${locality.state} ${locality.postcode}`);
    });
  } else {
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }

  return { success: true, data: data };
}

async function runCompleteAPITest() {
  console.log('🇦🇺 Complete Australia Post API Test Suite');
  console.log('===========================================');
  
  if (!AUSPOST_API_KEY) {
    console.log('❌ AUSPOST_API_KEY not found in environment variables');
    return;
  }

  console.log(`🔑 API Key: ${AUSPOST_API_KEY.substring(0, 8)}...${AUSPOST_API_KEY.substring(AUSPOST_API_KEY.length - 4)}`);
  console.log(`📏 API Key Length: ${AUSPOST_API_KEY.length} characters\n`);

  console.log('📋 TESTING INFORMATION ENDPOINTS');
  console.log('='.repeat(50));

  const infoResults = [];
  for (let i = 0; i < API_ENDPOINTS.length; i++) {
    const test = API_ENDPOINTS[i];
    const result = await testEndpoint(test);
    infoResults.push({ name: test.name, ...result });
    
    if (i < API_ENDPOINTS.length - 1) {
      console.log('\n⏳ Waiting 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n💰 TESTING CALCULATION ENDPOINTS');
  console.log('='.repeat(50));

  const calcResults = [];
  for (let i = 0; i < CALCULATION_TESTS.length; i++) {
    const test = CALCULATION_TESTS[i];
    const result = await testEndpoint(test);
    calcResults.push({ name: test.name, ...result });
    
    if (i < CALCULATION_TESTS.length - 1) {
      console.log('\n⏳ Waiting 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary Report
  console.log('\n📊 COMPLETE API TEST SUMMARY');
  console.log('='.repeat(50));
  
  const allResults = [...infoResults, ...calcResults];
  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);
  
  console.log(`✅ Successful endpoints: ${successful.length}/${allResults.length}`);
  console.log(`❌ Failed endpoints: ${failed.length}/${allResults.length}`);

  // Satchel Analysis
  console.log('\n📮 SATCHEL SERVICES ANALYSIS');
  console.log('='.repeat(30));
  
  const serviceResults = successful.filter(r => r.services);
  let totalSatchelServices = 0;
  let allSatchelServices = [];

  serviceResults.forEach(result => {
    if (result.services) {
      const satchels = result.services.filter(s => 
        s.code.toLowerCase().includes('satchel') || 
        s.name.toLowerCase().includes('satchel')
      );
      totalSatchelServices += satchels.length;
      allSatchelServices = [...allSatchelServices, ...satchels];
    }
  });

  console.log(`Total satchel services found: ${totalSatchelServices}`);
  if (totalSatchelServices > 0) {
    console.log(`Available satchel service codes:`);
    const uniqueSatchels = [...new Map(allSatchelServices.map(s => [s.code, s])).values()];
    uniqueSatchels.forEach(satchel => {
      console.log(`   - ${satchel.code}: ${satchel.name}${satchel.price ? ` ($${satchel.price})` : ''}`);
    });
  }

  // Calculation Results
  console.log('\n💰 CALCULATION RESULTS');
  console.log('='.repeat(25));
  
  const calcSuccessful = calcResults.filter(r => r.success);
  if (calcSuccessful.length > 0) {
    calcSuccessful.forEach(result => {
      console.log(`✅ ${result.name}:`);
      console.log(`   Service: ${result.service}`);
      console.log(`   Cost: $${result.totalCost}`);
      console.log(`   Delivery: ${result.deliveryTime}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    failed.forEach(result => {
      console.log(`   ${result.name}: ${result.error}`);
    });
  }

  console.log('\n🎉 Complete Australia Post API testing finished!');
  
  return {
    totalEndpoints: allResults.length,
    successful: successful.length,
    failed: failed.length,
    satchelServices: totalSatchelServices,
    results: allResults
  };
}

// Run the complete API test
runCompleteAPITest()
  .then((summary) => {
    console.log(`\n🏁 Final Summary: ${summary.successful}/${summary.totalEndpoints} endpoints working`);
    console.log(`📮 Satchel services discovered: ${summary.satchelServices}`);
    
    if (summary.successful === summary.totalEndpoints) {
      console.log('🎯 All Australia Post API endpoints are working perfectly!');
    } else if (summary.successful > 0) {
      console.log('⚠️ Most endpoints working. Check failed endpoints above.');
    } else {
      console.log('❌ API integration needs attention.');
    }
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
  });
