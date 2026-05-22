const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5175/user-dashboard');
  
  // wait for react to mount
  await new Promise(r => setTimeout(r, 2000));
  
  // try to click the upload tab
  try {
    await page.evaluate(() => {
      // Find the tab button for upload
      const buttons = Array.from(document.querySelectorAll('button'));
      const uploadTab = buttons.find(b => b.textContent && b.textContent.includes('Batch Customer Validation & Upload'));
      if (uploadTab) uploadTab.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {}
  
  await browser.close();
})();
