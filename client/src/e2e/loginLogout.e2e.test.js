const puppeteer = require('puppeteer');

// Basic configuration (adjust as needed)
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const USER_EMAIL = 'admin@temp.com'; // Using admin for simplicity, can be any test user
const USER_PASSWORD = 'password123';

describe('Login and Logout E2E Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should allow a user to log in and then log out', async () => {
    try {
      // 1. Navigate to Login Page
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

      // 2. Fill Login Form and Submit
      await page.type('input#email', USER_EMAIL);
      await page.type('input#password', USER_PASSWORD);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"]')
      ]);

      // 3. Verify Login Success (e.g., redirected to dashboard or home)
      //    A common check is to see if a "Logout" button/link is now visible.
      const logoutLinkSelector = 'a[href="/logout"], button#logout-button'; // Adjust selector as needed
      await page.waitForSelector(logoutLinkSelector, { timeout: 5000 });
      expect(page.url()).not.toContain('/login'); // Should not be on login page

      // 4. Click Logout
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click(logoutLinkSelector)
      ]);

      // 5. Verify Logout Success (e.g., redirected to login page or home page for guests)
      //    A common check is to see if the "Login" link/button is visible again.
      const loginLinkSelector = 'a[href="/login"]'; // Adjust selector as needed
      await page.waitForSelector(loginLinkSelector, { timeout: 5000 });
      expect(page.url()).toContain('/login'); // Or whatever the post-logout page is

    } catch (error) {
      const screenshotPath = `client/src/e2e/error_login_logout_${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error(`Login/Logout test failed. Screenshot saved to ${screenshotPath}`);
      throw error;
    }
  }, 30000); // 30-second timeout for the test
});