// Drive the UI in headless Chromium, report overflow and console errors, save screenshots.
// Playwright is not a dependency of this project. Point PLAYWRIGHT_PATH at an existing install:
//   PLAYWRIGHT_PATH=/path/to/node_modules/playwright node scripts/ui-check.cjs http://localhost:3000 docs/screenshots
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const [base, out] = process.argv.slice(2);

const CASES = [
  ['desktop-light-en', { width: 1280, height: 900 }, 'light', 'en', 'Jakarta', ['older_adult', 'respiratory_condition']],
  ['mobile-dark-id', { width: 375, height: 800 }, 'dark', 'id', 'Jakarta', ['outdoor_worker']],
  ['desktop-quiet', { width: 1440, height: 900 }, 'light', 'en', 'Madrid', []],
];

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  for (const [name, viewport, scheme, lang, city, profiles] of CASES) {
    const page = await browser.newPage({ viewport, colorScheme: scheme });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
    await page.goto(base);
    await page.screenshot({ path: `${out}/${name}-0-empty.png` });
    if (lang !== 'en') await page.click(`[data-lang="${lang}"]`);
    await page.fill('#q', city);
    await page.waitForSelector('#sugg[data-live] button', { timeout: 15000 });
    await page.click('#sugg button');
    for (const p of profiles) await page.check(`#profile input[value="${p}"]`, { force: true });
    await page.click('#go');
    await page.waitForSelector('#out details', { timeout: 90000 });
    await page.screenshot({ path: `${out}/${name}-1-result.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    // Audit link: focusing a briefing item must light up at least one strip cell.
    let lit = 'n/a (no items)';
    if (await page.locator('.item').count()) {
      await page.locator('.item').first().hover();
      lit = await page.locator('.cell.lit').count();
      await page.screenshot({ path: `${out}/${name}-2-audit-link.png`, fullPage: true });
    }
    await page.click('#out summary');
    await page.screenshot({ path: `${out}/${name}-3-audit-open.png`, fullPage: true });
    const n = (sel) => page.locator(sel).count();
    console.log(`${name}: overflow=${overflow} lang=${htmlLang} cells=${await n('.cell')} items=${await n('.item')} litCellsOnHover=${lit} processSegments=${await n('.pline .seg')} peakLines=${await n('.cell .pk')} shareButtons=${await n('.tools .btn')}`);
    await page.close();
  }
  console.log('console errors:', errors.length ? errors : 'none');
  await browser.close();
  if (errors.length) process.exit(1);
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
