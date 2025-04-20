// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Tournament Feed Functionality', () => {
  let tournamentId;

  test.beforeEach(async ({ page }) => {
    // Login to the application
    await page.goto('http://localhost:3002/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/dashboard');
    
    // Navigate to the first tournament or create one if none exists
    const hasTournaments = await page.isVisible('.tournament-card');
    
    if (hasTournaments) {
      // Click on the first tournament
      await page.click('.tournament-card');
    } else {
      // Create a new tournament
      await page.click('text=Create Tournament');
      await page.fill('input[name="title"]', 'Test Tournament');
      await page.fill('textarea[name="description"]', 'Test Description');
      await page.selectOption('select[name="category"]', 'technology');
      await page.selectOption('select[name="difficulty"]', 'beginner');
      
      // Set dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      await page.fill('input[name="startDate"]', tomorrowStr);
      await page.fill('input[name="registrationDeadline"]', tomorrowStr);
      
      await page.click('button:has-text("Create")');
      
      // Wait for tournament creation
      await page.waitForURL('**/tournament/*');
    }
    
    // Extract tournament ID from URL
    const url = page.url();
    tournamentId = url.split('/').pop();
    console.log(`Testing with tournament ID: ${tournamentId}`);
  });

  test('should display the create post button and allow posting', async ({ page }) => {
    // Navigate to the Announcements tab
    await page.click('text=Announcements');
    
    // Wait for the feed tab to be active
    await page.waitForSelector('div[role="tabpanel"]:not([hidden]) >> text=Feed');
    
    // Check if the "+" button is visible
    const createButton = page.locator('button[aria-label="add"]');
    await expect(createButton).toBeVisible();
    
    // Click the create button
    await createButton.click();
    
    // Fill in the post form
    await page.fill('input[placeholder="Title"]', 'Test Announcement');
    await page.fill('textarea[placeholder="Write your post here..."]', 'This is a test announcement content.');
    
    // Submit the form
    await page.click('button:has-text("Post")');
    
    // Wait for the post to appear
    await page.waitForSelector('text=Test Announcement');
    
    // Verify the post content
    await expect(page.locator('text=This is a test announcement content.')).toBeVisible();
  });

  test('should allow commenting on posts', async ({ page }) => {
    // Navigate to the Announcements tab
    await page.click('text=Announcements');
    
    // Wait for the feed tab to be active
    await page.waitForSelector('div[role="tabpanel"]:not([hidden]) >> text=Feed');
    
    // Check if there's a post to comment on, if not create one
    const hasPost = await page.isVisible('text=Test Announcement');
    
    if (!hasPost) {
      // Create a post first
      const createButton = page.locator('button[aria-label="add"]');
      await createButton.click();
      
      await page.fill('input[placeholder="Title"]', 'Test Announcement');
      await page.fill('textarea[placeholder="Write your post here..."]', 'This is a test announcement content.');
      
      await page.click('button:has-text("Post")');
      await page.waitForSelector('text=Test Announcement');
    }
    
    // Click on the comment button
    await page.click('text=Comment');
    
    // Type a comment
    await page.fill('textarea[placeholder="Write a comment..."]', 'This is a test comment');
    
    // Submit the comment
    await page.click('button:has-text("Post")');
    
    // Verify the comment appears
    await page.waitForSelector('text=This is a test comment');
    await expect(page.locator('text=This is a test comment')).toBeVisible();
  });

  test('should allow editing and deleting posts', async ({ page }) => {
    // Navigate to the Announcements tab
    await page.click('text=Announcements');
    
    // Wait for the feed tab to be active
    await page.waitForSelector('div[role="tabpanel"]:not([hidden]) >> text=Feed');
    
    // Check if there's a post to edit, if not create one
    const hasPost = await page.isVisible('text=Test Announcement');
    
    if (!hasPost) {
      // Create a post first
      const createButton = page.locator('button[aria-label="add"]');
      await createButton.click();
      
      await page.fill('input[placeholder="Title"]', 'Test Announcement');
      await page.fill('textarea[placeholder="Write your post here..."]', 'This is a test announcement content.');
      
      await page.click('button:has-text("Post")');
      await page.waitForSelector('text=Test Announcement');
    }
    
    // Click the menu button on the post
    await page.click('button[aria-label="more"]');
    
    // Click the delete option
    await page.click('text=Delete');
    
    // Confirm deletion if there's a confirmation dialog
    const hasConfirmation = await page.isVisible('text=Are you sure');
    if (hasConfirmation) {
      await page.click('button:has-text("Confirm")');
    }
    
    // Verify the post is removed
    await expect(page.locator('text=Test Announcement')).not.toBeVisible({ timeout: 5000 });
  });
});
