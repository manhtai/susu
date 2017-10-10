'use strict';

const puppeteer = require('puppeteer');


const getScreenShot = async (url, clip, timeout=1000) => {
    console.log("Start getting screenshot...", url, clip, timeout);
    const browser = await puppeteer.launch(
        {args: ['--no-sandbox', '--disable-setuid-sandbox']}
    );
    const page = await browser.newPage();

    page.setViewport({ width: 2048, height: 1536 });
    await page.goto(url, {
        waitUntil: "networkidle", networkIdleTimeout: timeout
    });
    const buffer = await page.screenshot({ clip });
    await browser.close();
    console.log("End getting screenshot...");
    return buffer;
};


const randomInt = (low, high) => Math.floor(Math.random() * (high - low) + low);


const formatQuote = (quote) => '*' + quote.content + '*\n  _~ ' + quote.author + '_';


const isSame = (w1, w2) => {
    if (!(typeof(w1) == 'string' && typeof(w2) == 'string')) return false;
    return w1.toLowerCase().indexOf(w2.toLowerCase()) === 0;
};


// a and b are javascript Date objects
const dateDiffInDays = (a, b) => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
};


module.exports = {
  randomInt,
  formatQuote,
  isSame,
  getScreenShot,
  dateDiffInDays
};
