const express = require('express');
const puppeteer = require('puppeteer');
const crypto = require('crypto');

const config = require('./const');

const router = express.Router();

const sha256 = x => crypto.createHash('sha256').update(x, 'utf8').digest('hex');


const getScreenShot = async (url, clip) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.setViewport({ width: 1024, height: 768 });
    await page.goto(url);
    const buffer = await page.screenshot({ clip });
    await browser.close();
    return buffer;
};


router.get('/', async (req, res) => {
    const url = req.query.url;
    const xywh = [req.query.x, req.query.y, req.query.w, req.query.h];
    const [x, y, width, height] = xywh.map(i => !isNaN(i) ? parseInt(i): 0);
    const clip = { x, y, width, height };

    const buffer = await getScreenShot(url, clip);
    res.type('png');
    res.end(buffer, 'binary');
});


module.exports = router;
