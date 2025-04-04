const puppeteer = require('puppeteer');

// Basic configuration (adjust as needed)
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'; // Assuming the app runs on port 3000
const ADMIN_EMAIL = 'admin@temp.com';
const ADMIN_PASSWORD = 'password123';

describe('Create Tournament E2E Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    // Launch the browser
    browser = await puppeteer.launch({
      headless: true, // Run in headless mode (no UI) set to false for debugging
      // slowMo: 50, // Slow down operations by 50ms (useful for debugging)
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Necessary for some environments
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 }); // Set viewport size
  });

  afterAll(async () => {
    // Close the browser
    await browser.close();
  });

  it('should allow an admin to log in, navigate to create tournament, fill the form, and submit', async () => {
    try {
      // 1. Navigate to Login Page
      console.log(`Navigating to ${BASE_URL}/login...`);
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
      console.log('Login page loaded.');

      // 2. Fill Login Form and Submit
      console.log('Filling login form...');
      // Using potential selectors - adjust if needed
      await page.type('input#email', ADMIN_EMAIL); // Assuming ID 'email'
      await page.type('input#password', ADMIN_PASSWORD); // Assuming ID 'password'
      console.log('Submitting login form...');
      // Assuming the submit button is the first button[type="submit"] on the page
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }), // Wait for navigation after submit
        page.click('button[type="submit"]')
      ]);
      console.log('Login submitted, navigation complete.');
      // Add a small delay or wait for a specific element confirming login if needed
      await page.waitForTimeout(1000); // Wait 1 second just in case

      // 3. Navigate to Create Tournament Page
      console.log('Navigating to Create Tournament page...');
      // Assuming a link in the navbar with href="/create-tournament"
      const createTournamentLinkSelector = 'a[href="/create-tournament"]';
      await page.waitForSelector(createTournamentLinkSelector);
      console.log('Found create tournament link.');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click(createTournamentLinkSelector)
      ]);
      console.log('Navigated to Create Tournament page.');
      expect(page.url()).toContain('/create-tournament');

      // 4. Fill Create Tournament Form
      console.log('Filling create tournament form...');
      const tournamentName = `Test Tournament ${Date.now()}`;
      // Using potential selectors - adjust if needed
      await page.waitForSelector('input#name'); // Wait for form field
      await page.type('input#name', tournamentName); // Assuming ID 'name'
      await page.type('textarea#description', 'This is a test tournament created by Puppeteer.'); // Assuming ID 'description'
      // Dates might need specific format or date picker interaction
      await page.type('input#startDate', '2025-10-01'); // Assuming ID 'startDate' and YYYY-MM-DD format
      await page.type('input#endDate', '2025-10-03'); // Assuming ID 'endDate' and YYYY-MM-DD format
      console.log('Form filled.');

      // 5. Submit Create Tournament Form
      console.log('Submitting create tournament form...');
      // Assuming the submit button within the form context
      const submitButtonSelector = 'form button[type="submit"]'; // More specific selector
      await page.waitForSelector(submitButtonSelector);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }), // Wait for navigation after submit
        page.click(submitButtonSelector)
      ]);
      console.log('Create tournament form submitted.');

      // 6. Verify Success (e.g., redirection to tournaments list or new tournament page)
      console.log('Verifying submission success...');
      // Check if redirected to the main tournaments page or a specific tournament page
      // Adjust the expected URL based on actual application behavior
      expect(page.url()).toMatch(/\/tournaments(\/|$)/); // Matches /tournaments or /tournaments/some-id
      console.log(`Successfully redirected to ${page.url()}. Test passed.`);

    } catch (error) {
      console.error('Test failed:', error);
      // Take a screenshot on failure for debugging
      const screenshotPath = `client/src/e2e/error_screenshot_${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved to ${screenshotPath}`);
      throw error; // Re-throw error to fail the test
    }
  }, 30000); // Increase timeout for E2E tests (30 seconds)
});

// Basic check to allow running standalone with `node client/src/e2e/createTournament.e2e.test.js`
// This won't run the Jest `describe`/`it` blocks directly but shows the structure.
if (require.main === module) {
  console.log("Running test script directly (Jest structure won't execute)...");
  // You could potentially call the test function directly here for standalone execution,
  // but it requires refactoring the describe/it structure.
  // For now, this just indicates the file can be found and parsed.
  console.log("Script parsed successfully. Run with Jest or similar runner to execute tests.");
}