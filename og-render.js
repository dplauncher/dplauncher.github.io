'use strict';
/**
 * Puppeteer-based OG image renderer.
 *
 * Loads og-template.html in headless Chromium at exactly 1200×630
 * (deviceScaleFactor=1) and writes og-image.jpg / og-image.png next to it.
 *
 * Why Puppeteer instead of the prior Electron script: Electron switches to
 * Node mode when stdio is piped (which happens whenever this is launched
 * from anything but a real interactive console). Puppeteer manages its own
 * Chromium and works reliably under any stdio setup.
 *
 * Run from this directory:
 *   node og-render.js
 */

const path = require('path');
const fs   = require('fs');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

const TEMPLATE_PATH = path.join(__dirname, 'og-template.html');
const OUT_JPG = path.join(__dirname, 'og-image.jpg');
const OUT_PNG = path.join(__dirname, 'og-image.png');
const WIDTH  = 1200;
const HEIGHT = 630;

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
  });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(TEMPLATE_PATH).href, { waitUntil: 'networkidle0', timeout: 30000 });
    // Give CSS/fonts/bg.jpg one extra paint
    await new Promise(r => setTimeout(r, 800));

    const pngBuffer = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
      omitBackground: false,
    });
    const jpgBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 92,
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
      omitBackground: false,
    });

    fs.writeFileSync(OUT_PNG, pngBuffer);
    fs.writeFileSync(OUT_JPG, jpgBuffer);
    console.log(`OK PNG ${(pngBuffer.length / 1024).toFixed(1)} KB → ${OUT_PNG}`);
    console.log(`OK JPG ${(jpgBuffer.length / 1024).toFixed(1)} KB → ${OUT_JPG}`);
  } catch (err) {
    console.error('FAIL:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
