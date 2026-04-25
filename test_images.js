import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage();

  page.on('requestfailed', request => {
    console.error(`Request failed: ${request.url()} - ${request.failure().errorText}`);
  });

  await page.goto('http://localhost:5173/SpotTest/', { waitUntil: 'networkidle0' });
  
  const tracks = await page.$$('.track-card img');
  console.log(`Found ${tracks.length} track images.`);
  
  for (const img of tracks) {
      const src = await img.evaluate(el => el.src);
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      console.log(`Image src: ${src}, naturalWidth: ${naturalWidth}`);
  }

  await browser.close();
})();
