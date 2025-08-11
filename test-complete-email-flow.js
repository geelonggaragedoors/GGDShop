// Complete email transaction flow testing script
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test data for comprehensive email testing
const testData = {
  customerEmail: "stevejford1@gmail.com",
  orderData: {
    orderNumber: "GGD-TEST-" + Date.now(),
    customerName: "Stephen Ford",
    total: "125.50",
    paypalTransactionId: "TEST-TXN-" + Math.random().toString(36).substring(7).toUpperCase(),
    paidAt: new Date(),
    items: [
      { name: "Garage Door Remote", quantity: 2, price: 45.50 },
      { name: "Safety Cable", quantity: 1, price: 34.50 }
    ]
  }
};

async function testEmailEndpoint(endpoint, data, description) {
  console.log(`\n=== Testing ${description} ===`);
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'ggd.sid=s%3AHMQcaF7_3O00otX4x4voS2n3dUgB68zv.K47G2WzM7Rec4gVOALRx0ORHmDIQMNBEkiyvA%2FELLRk'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${description} SUCCESS:`, result);
      return { success: true, result };
    } else {
      console.log(`❌ ${description} FAILED:`, result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.log(`💥 ${description} ERROR:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runCompleteEmailTest() {
  console.log('🚀 Starting Complete Email Transaction Flow Test...');
  
  const tests = [
    {
      endpoint: '/api/test-order-confirmation-email',
      data: { 
        customerEmail: testData.customerEmail, 
        orderData: testData.orderData 
      },
      description: 'Order Confirmation Email'
    },
    {
      endpoint: '/api/test-email',
      data: { 
        email: testData.customerEmail 
      },
      description: 'Basic Email Test'
    },
    {
      endpoint: '/api/test-order-status-emails',
      data: {},
      description: 'All Order Status Emails'
    }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testEmailEndpoint(test.endpoint, test.data, test.description);
    results.push({ ...test, ...result });
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 Test Summary:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.description}: ${result.success ? 'PASSED' : 'FAILED'}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${JSON.stringify(result.error)}`);
    }
  });
  
  // Get final email logs status
  console.log('\n📧 Fetching latest email logs...');
  try {
    const logsResponse = await fetch(`${BASE_URL}/api/admin/email-logs`, {
      headers: {
        'Cookie': 'ggd.sid=s%3AHMQcaF7_3O00otX4x4voS2n3dUgB68zv.K47G2WzM7Rec4gVOALRx0ORHmDIQMNBEkiyvA%2FELLRk'
      }
    });
    
    const logsData = await logsResponse.json();
    console.log(`📈 Total email logs: ${logsData.total}`);
    console.log('Recent logs:', logsData.logs.slice(0, 3).map(log => ({
      subject: log.subject,
      status: log.status,
      recipient: log.recipientEmail,
      error: log.errorMessage
    })));
    
  } catch (error) {
    console.log('❌ Failed to fetch email logs:', error.message);
  }
  
  console.log('\n🏁 Email Flow Test Complete!');
}

runCompleteEmailTest().catch(console.error);