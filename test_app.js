import puppeteer from 'puppeteer';

(async () => {
  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--ignore-certificate-errors']
  });
  const page = await browser.newPage();

  page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
      console.error(`[Page Error]: ${error.message}`);
  });

  console.log("Navigating to http://localhost:5173/SpotTest/");
  try {
    await page.goto('http://localhost:5173/SpotTest/', { waitUntil: 'networkidle0' });
  } catch (e) {
    console.log("Network idle 0 failed, continuing...");
  }

  console.log("Checking page content...");
  const content = await page.content();
  // console.log(content);

  // Check if we bypassed login
  const loginButton = await page.$('button::-p-text(Login with Spotify)');
  if (loginButton) {
      console.error("❌ Test Failed: Still on login screen.");
      await browser.close();
      process.exit(1);
  }

  console.log("Login bypassed. Waiting for game UI...");
  
  try {
      // Look for the "Lives" display which was recently added
      await page.waitForSelector('.lives', { timeout: 10000 });
      const livesText = await page.$eval('.lives', el => el.textContent);
      console.log(`✅ Test Passed: Game UI found. Lives: ${livesText.trim()}`);
      
      const scoreText = await page.$eval('.score', el => el.textContent);
      console.log(`Score visible: ${scoreText.trim()}`);

      const tracks = await page.$$('.track-card');
      console.log(`Number of track cards: ${tracks.length}`);
      
  } catch (e) {
      console.error("❌ Test Failed: Timed out or error waiting for game UI.");
      const isError = await page.$('.login-screen h1');
      if (isError) {
          const errTitle = await page.$eval('.login-screen h1', el => el.textContent);
          const errMsg = await page.$eval('.login-screen p', el => el.textContent);
          console.error(`App Error Screen: ${errTitle} - ${errMsg}`);
      }
  }

  await browser.close();
})();
