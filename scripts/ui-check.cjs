// Drive the UI in headless Chromium, report overflow and console errors, save screenshots.
// Playwright is not a dependency of this project. Point PLAYWRIGHT_PATH at an existing install:
//   PLAYWRIGHT_PATH=/path/to/node_modules/playwright node scripts/ui-check.cjs http://localhost:3000 docs/screenshots
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const [base, out] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  for (const [name, viewport, scheme, lang, city, profiles] of [
    ['desktop-light-en', { width: 1280, height: 900 }, 'light', 'en', 'Jakarta', ['older_adult', 'respiratory_condition']],
    ['mobile-dark-id', { width: 375, height: 800 }, 'dark', 'id', 'Jakarta', ['outdoor_worker']],
    ['desktop-quiet', { width: 1280, height: 900 }, 'light', 'en', 'Madrid', []],
  ]) {
    const page = await browser.newPage({ viewport, colorScheme: scheme });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
    await page.goto(base);
    await page.screenshot({ path: `${out}/${name}-0-empty.png` });
    await page.fill('#q', city);
    await page.waitForSelector('#sugg button', { timeout: 15000 });
    await page.click('#sugg button');
    await page.selectOption('#lang', lang);
    for (const p of profiles) await page.check(`#profile input[value="${p}"]`);
    await page.click('#go');
    await page.waitForSelector('#out .card', { timeout: 60000 });
    await page.waitForFunction(() => !document.getElementById('go').disabled, null, { timeout: 60000 });
    await page.screenshot({ path: `${out}/${name}-1-result.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(name, 'horizontal overflow:', overflow, '| text:', (await page.innerText('#out')).replace(/\s+/g, ' ').slice(0, 260));
    await page.close();
  }
  console.log('console errors:', errors.length ? errors : 'none');
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
