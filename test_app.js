import puppeteer from 'puppeteer';

(async () => {
  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  console.log("Navigating to http://localhost:5173/SpotTest/");
  await page.goto('http://localhost:5173/SpotTest/', { waitUntil: 'networkidle0' });

  console.log("Waiting for app to load...");
  
  // Check if we bypassed login
  const loginButton = await page.$('button::-p-text(Login with Spotify)');
  if (loginButton) {
      console.error("❌ Test Failed: Still on login screen. VITE_TEMP_SPOTIFY_TOKEN bypass didn't work.");
      await browser.close();
      process.exit(1);
  }

  console.log("Login bypassed successfully. Waiting for tracks to fetch...");
  
  try {
      // Wait for either the timeline (game started) or an error message
      await page.waitForSelector('.timeline, .login-screen h1::-p-text(Error)', { timeout: 10000 });
      
      const errorScreen = await page.$('.login-screen h1::-p-text(Error)');
      if (errorScreen) {
          const errorText = await page.$eval('.login-screen p', el => el.textContent);
          console.error(`❌ Test Failed: App hit an error state: ${errorText}`);
      } else {
          const tracks = await page.$$('.track-card');
          if (tracks.length >= 2) {
             console.log(`✅ Test Passed: Game loaded successfully with ${tracks.length} track cards visible.`);
          } else {
             console.error(`❌ Test Failed: Game loaded, but only ${tracks.length} track cards found.`);
          }
      }
  } catch (e) {
      console.error("❌ Test Failed: Timed out waiting for tracks to load.");
  }

  await browser.close();
})();
