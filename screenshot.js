const express = require('express');
const puppeteer = require('puppeteer');
const crypto = require('crypto');
const Jimp = require("jimp");


const config = require('./const');

const router = express.Router();

const sha256 = x => crypto.createHash('sha256').update(x, 'utf8').digest('hex');


const getScreenShot = async (url) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const path = `susu-screenshot-${sha256(url)}.png`;

    await page.goto(url);
    await page.screenshot({ path });
    await browser.close();
    return path;
};


router.get('/', async (req, res) => {
    const url = req.query.url;
    const xywh = [req.query.x, req.query.y, req.query.w, req.query.h];
    const [x, y, w, h] = xywh.map(i => !isNaN(i) ? parseInt(i): 0);

    const path = await getScreenShot(url);
    const image = await Jimp.read(path);

    console.log(x, y, w, h);

    image.crop(x, y, w, h).getBuffer(Jimp.MIME_PNG, (err, buffer) => {
        if (err) return res.send(err);
        res.type('png');
        res.end(buffer, 'binary');
    });
});


module.exports = router;
