const { chromium } = require('../qa-automation/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '../evidence/theme_screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const baseUrl = 'http://localhost:5173';

  // 1. Test Light Mode
  console.log('Capturing Light Mode...');
  await page.goto(`${baseUrl}/#/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Ensure Light Mode (if html has 'dark', click dark mode toggle)
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (isDark) {
    console.log('Switching to Light Mode...');
    const toggle = page.locator('button:has-text("Chế độ tối"), button:has-text("Chế độ sáng")').first();
    await toggle.click();
    await page.waitForTimeout(400);
  }

  // Snapshots for Light Mode
  const routes = [
    { name: 'light_home', hash: '#/home' },
    { name: 'light_exercises_list', hash: '#/exercises' },
    { name: 'light_green_dot_detail', hash: '#/exercises/green-dot' },
    { name: 'light_learn_academy', hash: '#/learn' },
    { name: 'light_user_profile', hash: '#/user' },
    { name: 'light_settings', hash: '#/settings' }
  ];

  for (const r of routes) {
    await page.goto(`${baseUrl}/${r.hash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const p = path.join(outDir, `${r.name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    console.log(`Saved ${p}`);
  }

  // 2. Switch to Dark Mode
  console.log('Switching to Dark Mode via page.evaluate...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    try {
      localStorage.setItem('brain_pro_dark_mode', 'true');
    } catch (e) {}
  });
  await page.goto(`${baseUrl}/#/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Snapshots for Dark Mode
  const darkRoutes = [
    { name: 'dark_home', hash: '#/home' },
    { name: 'dark_exercises_list', hash: '#/exercises' },
    { name: 'dark_green_dot_detail', hash: '#/exercises/green-dot' },
    { name: 'dark_learn_academy', hash: '#/learn' },
    { name: 'dark_user_profile', hash: '#/user' },
    { name: 'dark_settings', hash: '#/settings' }
  ];

  for (const r of darkRoutes) {
    await page.goto(`${baseUrl}/${r.hash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const p = path.join(outDir, `${r.name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    console.log(`Saved ${p}`);
  }

  await browser.close();
  console.log('Screenshots complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
