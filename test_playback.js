import puppeteer from 'puppeteer';

(async () => {
  console.log("Launching Puppeteer for playback test...");
  // Note: Standard headless Chrome does not support Widevine DRM by default, 
  // which Spotify Web Playback SDK requires. We will look for SDK errors in the console.
  const browser = await puppeteer.launch({ 
      headless: "new", 
      args: ['--ignore-certificate-errors', '--autoplay-policy=no-user-gesture-required'] 
  });
  const page = await browser.newPage();

  page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
      console.error(`[Page Error]: ${error.message}`);
  });

  console.log("Navigating to http://localhost:5173/SpotTest/");
  await page.goto('http://localhost:5173/SpotTest/', { waitUntil: 'networkidle0' });

  console.log("Waiting for player controls to appear...");
  try {
      // Wait for the button to appear (meaning player is ready)
      await page.waitForSelector('.player-controls button', { timeout: 15000 });
      console.log("Player button appeared! Clicking play...");
      
      const buttonTextBefore = await page.$eval('.player-controls button', el => el.textContent);
      console.log(`Button text before click: ${buttonTextBefore}`);

      await page.click('.player-controls button');
      
      // Wait a moment to see if the state changes
      await new Promise(r => setTimeout(r, 2000));
      
      const buttonTextAfter = await page.$eval('.player-controls button', el => el.textContent);
      console.log(`Button text after click: ${buttonTextAfter}`);

      if (buttonTextBefore === buttonTextAfter) {
          console.error("❌ Test Failed: Play button state did not change after clicking.");
      } else {
          console.log("✅ Test Passed: Play button toggled successfully.");
      }

  } catch (e) {
      console.error("❌ Test Failed: Player button never appeared or an error occurred.", e.message);
  }

  await browser.close();
})();
