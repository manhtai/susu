const express  = require('express');
const fs       = require("fs");
const path     = require("path");
const crypto = require('crypto');

const util     = require('./util');

const temp_dir = path.join(process.cwd(), 'temp/');
const router = express.Router();


router.get('/', async (req, res) => {
    const url = req.query.url;
    const timeout = parseInt(req.query.t || 1000);
    const xywh = [req.query.x, req.query.y, req.query.w, req.query.h];
    const [x, y, width, height] = xywh.map(i => !isNaN(i) ? parseInt(i): 0);
    const clip = { x, y, width, height };

    const filename = `${crypto.createHash('md5').update(req.url).digest("hex")}.png`;

    // Send link to file
    res.send(`Visit ${req.headers.host}/screenshot/${filename} to get the file later...`);

    const buffer = await (util.getScreenShot(url, clip, timeout));

    if (!fs.existsSync(temp_dir))
        fs.mkdirSync(temp_dir);

    // Write file to local
    const filepath = path.resolve(temp_dir, filename);
    fs.writeFile(filepath, buffer, (err) => {
        if (err) console.log(`Error while writing file for url ${url}`, err);
    });
});


router.get('/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filepath = path.resolve(temp_dir, filename);
    if (fs.existsSync(filepath)) res.sendFile(filepath);
    else res.send('File not found! Please wait a little more or get the screenshot again.');
});


module.exports = router;
