// Australia Post API Test - Step by Step Verification
// This file tests the Australia Post API integration independently

import { config } from 'dotenv';

// Load environment variables
config();

const AUSPOST_API_KEY = process.env.AUSPOST_API_KEY;
const AUSPOST_BASE_URL = 'https://digitalapi.auspost.com.au';

console.log('=== AUSTRALIA POST API TEST ===\n');

// Test 1: Basic API connectivity
async function testApiConnectivity() {
  console.log('TEST 1: API Connectivity');
  console.log('API Key available:', !!AUSPOST_API_KEY);
  console.log('API Key length:', AUSPOST_API_KEY ? AUSPOST_API_KEY.length : 0);
  console.log('API Key first 8 chars:', AUSPOST_API_KEY ? AUSPOST_API_KEY.substring(0, 8) + '...' : 'None');
  console.log('');
}

// Test 2: Test postcode validation
async function testPostcodeValidation() {
  console.log('TEST 2: Postcode Validation');
  
  const testPostcode = '3216'; // Geelong West
  const url = `${AUSPOST_BASE_URL}/postcode/search.json?q=${testPostcode}`;
  
  console.log('Testing postcode:', testPostcode);
  console.log('URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'AUTH-KEY': AUSPOST_API_KEY
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.log('Network error:', error.message);
  }
  console.log('');
}

// Test 3: Test service discovery (what services are available)
async function testServiceDiscovery() {
  console.log('TEST 3: Service Discovery');
  
  const url = `${AUSPOST_BASE_URL}/postage/parcel/domestic/service.json`;
  
  console.log('URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'AUTH-KEY': AUSPOST_API_KEY
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Available services:');
      if (data.services && data.services.service) {
        data.services.service.forEach(service => {
          console.log(`- ${service.code}: ${service.name}`);
        });
      } else {
        console.log('Full response:', JSON.stringify(data, null, 2));
      }
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.log('Network error:', error.message);
  }
  console.log('');
}

// Test 4: Test basic shipping calculation (Small Satchel)
async function testBasicShippingCalculation() {
  console.log('TEST 4: Basic Shipping Calculation (Small Satchel)');
  
  const fromPostcode = '3220'; // Geelong
  const toPostcode = '3216';   // Geelong West
  const serviceCode = 'AUS_PARCEL_REGULAR_SATCHEL_500G';
  const weight = 0.5; // 500g
  
  const url = `${AUSPOST_BASE_URL}/postage/parcel/domestic/calculate.json` +
    `?from_postcode=${fromPostcode}` +
    `&to_postcode=${toPostcode}` +
    `&length=22` +
    `&width=16` +
    `&height=7.7` +
    `&weight=${weight}` +
    `&service_code=${serviceCode}`;
  
  console.log('From postcode:', fromPostcode);
  console.log('To postcode:', toPostcode);
  console.log('Service code:', serviceCode);
  console.log('Weight:', weight + 'kg');
  console.log('URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'AUTH-KEY': AUSPOST_API_KEY
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data.postage_result && data.postage_result.total_cost) {
        console.log('✓ Total cost:', data.postage_result.total_cost);
        console.log('✓ Service:', data.postage_result.service);
      }
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.log('Network error:', error.message);
  }
  console.log('');
}

// Test 5: Test box shipping calculation
async function testBoxShippingCalculation() {
  console.log('TEST 5: Box Shipping Calculation');
  
  const fromPostcode = '3220'; // Geelong
  const toPostcode = '3216';   // Geelong West
  const serviceCode = 'AUS_PARCEL_REGULAR';
  const weight = 2.5; // 2.5kg
  
  const url = `${AUSPOST_BASE_URL}/postage/parcel/domestic/calculate.json` +
    `?from_postcode=${fromPostcode}` +
    `&to_postcode=${toPostcode}` +
    `&length=30` +
    `&width=25` +
    `&height=15` +
    `&weight=${weight}` +
    `&service_code=${serviceCode}`;
  
  console.log('From postcode:', fromPostcode);
  console.log('To postcode:', toPostcode);
  console.log('Service code:', serviceCode);
  console.log('Weight:', weight + 'kg');
  console.log('Dimensions: 30x25x15cm');
  console.log('URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'AUTH-KEY': AUSPOST_API_KEY
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data.postage_result && data.postage_result.total_cost) {
        console.log('✓ Total cost:', data.postage_result.total_cost);
        console.log('✓ Service:', data.postage_result.service);
      }
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.log('Network error:', error.message);
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  try {
    await testApiConnectivity();
    await testPostcodeValidation();
    await testServiceDiscovery();
    await testBasicShippingCalculation();
    await testBoxShippingCalculation();
    
    console.log('=== TEST COMPLETE ===');
    console.log('Review the results above to identify any issues.');
    
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

// Run the tests
runAllTests();