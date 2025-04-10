const puppeteer = require('puppeteer');

async function runTest() {
  console.log('Starting simplified Puppeteer test...');
  
  // Launch a new browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Enable console log from the browser
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    // Navigate to your React app
    console.log('Navigating to client app only...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 // 30 seconds timeout
    });
    
    // Take screenshot
    await page.screenshot({ path: 'react-app-screenshot.png' });
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    console.log('Simple test completed!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed.');
  }
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 