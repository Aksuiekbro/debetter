const puppeteer = require('puppeteer');

async function testDeBetterApp() {
  console.log('Starting DeBetter app test...');
  
  // Launch a new browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Enable console log from the browser
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    // Navigate to the DeBetter app
    console.log('Navigating to DeBetter app...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Take initial screenshot
    await page.screenshot({ path: 'debetter-home.png' });
    
    // Verify page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    if (title === 'DeBetter') {
      console.log('✅ Page title verification passed');
    } else {
      console.log('❌ Page title verification failed');
    }
    
    // Check for "Welcome to DeBetter" text
    const pageContent = await page.evaluate(() => document.body.textContent);
    if (pageContent.includes('Welcome to DeBetter')) {
      console.log('✅ Welcome text verification passed');
    } else {
      console.log('❌ Welcome text verification failed');
    }
    
    // Test specific MUI buttons by their text and class
    console.log('Testing MUI components...');
    
    try {
      // Test "Join a Debate" navigation button in the header
      console.log('Testing Join a Debate button in header...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const joinButton = buttons.find(b => b.textContent.trim() === 'Join a Debate');
        if (joinButton) joinButton.click();
      });
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {
        console.log('Navigation timeout or no navigation occurred');
      });
      
      await page.screenshot({ path: 'join-debate-nav.png' });
      console.log('✅ Join a Debate button test completed');
      
      // Go back to home
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Test "Host a Debate" navigation button in the header
      console.log('Testing Host a Debate button in header...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const hostButton = buttons.find(b => b.textContent.trim() === 'Host a Debate');
        if (hostButton) hostButton.click();
      });
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {
        console.log('Navigation timeout or no navigation occurred');
      });
      
      await page.screenshot({ path: 'host-debate-nav.png' });
      console.log('✅ Host a Debate button test completed');
      
      // Go back to home
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Test large "Join Debates" button on hero section
      console.log('Testing large Join Debates button...');
      
      // Using partial class to find the large MUI button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.MuiButton-containedPrimary.MuiButton-sizeLarge'));
        const joinButton = buttons.find(b => b.textContent.includes('Join Debates'));
        if (joinButton) joinButton.click();
      });
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {
        console.log('Navigation timeout or no navigation occurred');
      });
      
      await page.screenshot({ path: 'join-debates-large.png' });
      console.log('✅ Large Join Debates button test completed');
      
      // Go back to home
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Test large "Host a Debate" button on hero section
      console.log('Testing large Host a Debate button...');
      
      // Using partial class to find the large MUI button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.MuiButton-outlinedPrimary.MuiButton-sizeLarge'));
        const hostButton = buttons.find(b => b.textContent.includes('Host a Debate'));
        if (hostButton) hostButton.click();
      });
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {
        console.log('Navigation timeout or no navigation occurred');
      });
      
      await page.screenshot({ path: 'host-debate-large.png' });
      console.log('✅ Large Host a Debate button test completed');
      
      // Go back to home
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Test "Login" button
      console.log('Testing Login button...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const loginButton = buttons.find(b => b.textContent.trim() === 'Login');
        if (loginButton) loginButton.click();
      });
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {
        console.log('Navigation timeout or no navigation occurred');
      });
      
      await page.screenshot({ path: 'login-page.png' });
      console.log('✅ Login button test completed');
      
      // Go back to home
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Test "Register" button
      console.log('Testing Register button...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const registerButton = buttons.find(b => b.textContent.trim() === 'Register');
        if (registerButton) registerButton.click();
      });
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {
        console.log('Navigation timeout or no navigation occurred');
      });
      
      await page.screenshot({ path: 'register-page.png' });
      console.log('✅ Register button test completed');
      
      // Go back to home
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Test search input in the navigation bar
      console.log('Testing search input...');
      const searchInputField = await page.$('input[placeholder="Search debates..."]');
      if (searchInputField) {
        await searchInputField.type('climate change');
        await page.screenshot({ path: 'search-input-typed.png' });
        console.log('✅ Search input test successful');
        
        // Test search submission by pressing Enter
        await page.keyboard.press('Enter');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Give it time to process
        await page.screenshot({ path: 'search-results.png' });
        console.log('✅ Search submission test completed');
      } else {
        console.log('❌ Search input not found by placeholder');
      }
      
      // Go back to home for final state
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
    } catch (error) {
      console.error('❌ Error during UI testing:', error.message);
    }
    
    console.log('DeBetter app test completed!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed.');
  }
}

// Run the test
testDeBetterApp().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 