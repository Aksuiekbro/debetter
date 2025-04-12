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
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

      // 2. Fill Login Form and Submit
      // Using potential selectors - adjust if needed
      await page.type('input#email', ADMIN_EMAIL); // Assuming ID 'email'
      await page.type('input#password', ADMIN_PASSWORD); // Assuming ID 'password'
      // Assuming the submit button is the first button[type="submit"] on the page
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }), // Wait for navigation after submit
        page.click('button[type="submit"]')
      ]);
      // Add a small delay or wait for a specific element confirming login if needed
      await page.waitForTimeout(1000); // Wait 1 second just in case

      // 3. Navigate to Create Tournament Page
      // Assuming a link in the navbar with href="/create-tournament"
      const createTournamentLinkSelector = 'a[href="/create-tournament"]';
      await page.waitForSelector(createTournamentLinkSelector);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click(createTournamentLinkSelector)
      ]);
      expect(page.url()).toContain('/create-tournament');

      // 4. Fill Create Tournament Form
      const tournamentName = `Test Tournament ${Date.now()}`;
      // Using potential selectors - adjust if needed
      await page.waitForSelector('input#name'); // Wait for form field
      await page.type('input#name', tournamentName); // Assuming ID 'name'
      await page.type('textarea#description', 'This is a test tournament created by Puppeteer.'); // Assuming ID 'description'
      // Dates might need specific format or date picker interaction
      await page.type('input#startDate', '2025-10-01'); // Assuming ID 'startDate' and YYYY-MM-DD format
      await page.type('input#endDate', '2025-10-03'); // Assuming ID 'endDate' and YYYY-MM-DD format

      // 5. Submit Create Tournament Form
      // Assuming the submit button within the form context
      const submitButtonSelector = 'form button[type="submit"]'; // More specific selector
      await page.waitForSelector(submitButtonSelector);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }), // Wait for navigation after submit
        page.click(submitButtonSelector)
      ]);

      // 6. Verify Success (e.g., redirection to tournaments list or new tournament page)
      // Check if redirected to the main tournaments page or a specific tournament page
      // Adjust the expected URL based on actual application behavior
      expect(page.url()).toMatch(/\/tournaments(\/|$)/); // Matches /tournaments or /tournaments/some-id

    } catch (error) {
      // Take a screenshot on failure for debugging
      const screenshotPath = `client/src/e2e/error_screenshot_${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      throw error; // Re-throw error to fail the test
    }
  }, 30000); // Increase timeout for E2E tests (30 seconds)
});

// Basic check to allow running standalone with `node client/src/e2e/createTournament.e2e.test.js`
// This won't run the Jest `describe`/`it` blocks directly but shows the structure.
if (require.main === module) {
  // You could potentially call the test function directly here for standalone execution,
  // but it requires refactoring the describe/it structure.
  // For now, this just indicates the file can be found and parsed.
}