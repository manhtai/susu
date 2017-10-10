const express = require('express');
const puppeteer = require('puppeteer');

const config = require('./const');

const router = express.Router();


const getScreenShot = async (url, clip, timeout) => {
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
    return buffer;
};


router.get('/', async (req, res) => {
    const url = req.query.url;
    const timeout = req.query.t || 5000;
    const xywh = [req.query.x, req.query.y, req.query.w, req.query.h];
    const [x, y, width, height] = xywh.map(i => !isNaN(i) ? parseInt(i): 0);
    const clip = { x, y, width, height };

    const buffer = await getScreenShot(url, clip, timeout);
    res.type('png');
    res.end(buffer, 'binary');
});


module.exports = router;
