const fs = require('fs');
const path = require('path');

async function testUploadsServer() {
  try {
    console.log('🔍 Testing uploads directory and server configuration...');

    // Check if uploads directory exists
    const uploadsPath = path.join(__dirname, 'uploads');
    console.log(`\n📁 Checking uploads directory: ${uploadsPath}`);
    
    if (fs.existsSync(uploadsPath)) {
      console.log('✅ Uploads directory exists');
      
      // List some files in uploads
      const files = fs.readdirSync(uploadsPath);
      console.log(`📦 Found ${files.length} files in uploads directory`);
      
      // Show first 5 files
      const sampleFiles = files.slice(0, 5);
      console.log('\n📋 Sample files:');
      sampleFiles.forEach(file => {
        const filePath = path.join(uploadsPath, file);
        const stats = fs.statSync(filePath);
        console.log(`- ${file} (${stats.size} bytes, modified: ${stats.mtime.toISOString()})`);
      });
      
      // Test if we can read a specific file
      const testFile = 'qG7Q9rNTscxYnOerqiON8-1763434868215.png';
      const testFilePath = path.join(uploadsPath, testFile);
      
      if (fs.existsSync(testFilePath)) {
        console.log(`\n✅ Test file exists: ${testFile}`);
        const stats = fs.statSync(testFilePath);
        console.log(`   Size: ${stats.size} bytes`);
        console.log(`   Readable: ${fs.constants.R_OK & fs.accessSync(testFilePath, fs.constants.R_OK) ? 'Yes' : 'No'}`);
      } else {
        console.log(`\n❌ Test file not found: ${testFile}`);
      }
      
    } else {
      console.log('❌ Uploads directory does not exist');
      console.log('Creating uploads directory...');
      fs.mkdirSync(uploadsPath, { recursive: true });
      console.log('✅ Uploads directory created');
    }

    // Check server configuration
    console.log('\n🔧 Server Configuration Check:');
    console.log('Expected server setup:');
    console.log('- Express static middleware: app.use("/uploads", express.static("uploads"))');
    console.log('- Server running on: http://localhost:5000');
    console.log('- Vite proxy: /uploads -> http://localhost:5000/uploads');
    
    console.log('\n🌐 URL Test:');
    console.log('Frontend request: http://localhost:5173/uploads/filename.jpg');
    console.log('Should proxy to: http://localhost:5000/uploads/filename.jpg');
    console.log('Server should serve from: ./uploads/filename.jpg');

    // Check if server is running by testing a simple request
    console.log('\n🏃 Testing server connectivity...');
    
    try {
      const response = await fetch('http://localhost:5000/api/site-settings');
      if (response.ok) {
        console.log('✅ Server is running and responding to API requests');
      } else {
        console.log(`⚠️ Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Server is not responding:', error.message);
      console.log('Make sure the server is running with: npm run dev');
    }

    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Ensure server is running: npm run dev');
    console.log('2. Test direct server URL: http://localhost:5000/uploads/filename.jpg');
    console.log('3. Test frontend proxy: http://localhost:5173/uploads/filename.jpg');
    console.log('4. Check browser network tab for actual request URLs');
    console.log('5. Verify file permissions on uploads directory');

    console.log('\n✅ Upload server test completed!');

  } catch (error) {
    console.error('❌ Error testing uploads server:', error);
    throw error;
  }
}

// Run the test
testUploadsServer()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
