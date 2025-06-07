const puppeteer = require('puppeteer');

// Basic configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const USER_EMAIL = 'admin@temp.com'; // Using admin for simplicity
const USER_PASSWORD = 'password123';

describe('View Tournaments E2E Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Login before running tests
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.type('input#email', USER_EMAIL);
    await page.type('input#password', USER_PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    // Wait for a moment to ensure login completes and redirects
    await page.waitForTimeout(1000);
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should allow a logged-in user to navigate to tournaments page, view list, and view tournament details', async () => {
    try {
      // 1. Navigate to Tournaments Page
      // Assuming a link in the navbar with href="/tournaments" or similar
      const tournamentsLinkSelector = 'a[href="/tournaments"]';
      await page.waitForSelector(tournamentsLinkSelector, { timeout: 5000 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click(tournamentsLinkSelector)
      ]);
      expect(page.url()).toContain('/tournaments');

      // 2. Verify Tournament List is Visible
      // This selector will depend on how tournaments are rendered.
      // Example: waiting for at least one tournament card/item.
      const tournamentItemSelector = '.tournament-card, .tournament-list-item'; // Adjust selector
      await page.waitForSelector(tournamentItemSelector, { timeout: 10000 }); // Wait up to 10s for list to load

      // 3. Click on the first tournament in the list to view details
      // This assumes the tournament item itself is clickable or contains a link.
      // We'll click the first one found.
      const firstTournament = await page.$(tournamentItemSelector);
      if (!firstTournament) {
        throw new Error('No tournament items found on the page.');
      }

      // Attempt to find a specific link within the card, or click the card itself.
      // This might need adjustment based on actual HTML structure.
      let detailLinkSelector = `${tournamentItemSelector} a[href*="/tournaments/"], ${tournamentItemSelector} button`;
      let detailElement = await page.$(`${tournamentItemSelector} a[href*="/tournaments/"]`);
      if (!detailElement) {
          detailElement = await page.$(`${tournamentItemSelector} button`); // Fallback to a button if no specific link
      }
      if (!detailElement) {
          detailElement = firstTournament; // Fallback to clicking the whole card
      }


      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        detailElement.click()
      ]);

      // 4. Verify Navigation to Tournament Detail Page
      // The URL should now contain /tournaments/some-id
      expect(page.url()).toMatch(/\/tournaments\/[a-zA-Z0-9-]+$/); // Matches /tournaments/some-alphanumeric-id

      // 5. Verify Tournament Detail Content is Visible
      // Example: waiting for an element that typically exists on a tournament detail page.
      const tournamentDetailHeaderSelector = 'h1.tournament-title, .tournament-detail-header'; // Adjust selector
      await page.waitForSelector(tournamentDetailHeaderSelector, { timeout: 5000 });
      const headerText = await page.$eval(tournamentDetailHeaderSelector, el => el.textContent);
      expect(headerText).toBeTruthy(); // Check that header has some text

    } catch (error) {
      const screenshotPath = `client/src/e2e/error_view_tournaments_${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error(`View Tournaments test failed. Screenshot saved to ${screenshotPath}`);
      throw error;
    }
  }, 45000); // 45-second timeout for the test
});