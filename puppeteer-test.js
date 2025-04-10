const puppeteer = require('puppeteer');

async function runTest() {
  console.log('Starting Puppeteer test...');
  
  // Launch a new browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Enable console log from the browser
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    // Navigate to your React app
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 60000 // 60 seconds timeout for navigation
    });
    
    // Take initial screenshot
    await page.screenshot({ path: 'initial-page.png' });
    
    // Get and log the page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Basic assertions (customize based on your app)
    console.log('Performing basic checks...');
    
    // Example: Check if certain elements exist
    const bodyText = await page.evaluate(() => document.body.textContent);
    if (bodyText.includes('Welcome')) {
      console.log('✅ Welcome text found on page');
    } else {
      console.log('❌ Welcome text not found');
    }
    
    // Example: Test navigation (modify selectors based on your app)
    try {
      console.log('Testing navigation...');
      // Look for navigation links
      const navLinks = await page.$$('nav a');
      
      if (navLinks.length > 0) {
        console.log(`Found ${navLinks.length} navigation links`);
        // Click the first link
        await navLinks[0].click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('✅ Navigation successful');
        await page.screenshot({ path: 'after-navigation.png' });
      } else {
        console.log('No navigation links found to test');
      }
    } catch (navError) {
      console.error('Navigation test failed:', navError.message);
    }
    
    // Example: Test form interaction (modify selectors based on your app)
    try {
      console.log('Testing form interaction...');
      // Check if there's a form
      const formExists = await page.$('form') !== null;
      
      if (formExists) {
        // Find an input field and button
        await page.type('input[type="text"]', 'Test Input');
        await page.screenshot({ path: 'form-filled.png' });
        
        // Submit form or click button
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000); // Wait for response
        await page.screenshot({ path: 'form-submitted.png' });
        console.log('✅ Form interaction test completed');
      } else {
        console.log('No form found to test');
      }
    } catch (formError) {
      console.error('Form test failed:', formError.message);
    }
    
    console.log('Test completed successfully!');
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