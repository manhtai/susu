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
    const link = `/screenshot/${filename}`;
    res.render('screenshot', { link });

    // Create /temp folder
    if (!fs.existsSync(temp_dir))
        fs.mkdirSync(temp_dir);

    // Only write file to local if file does not exist
    const filepath = path.resolve(temp_dir, filename);
    if (fs.existsSync(filepath)) return;

    const buffer = await (util.getScreenShot(url, clip, timeout));
    fs.writeFile(filepath, buffer, (err) => {
        if (err) console.log(`Error while writing file for url ${url}`, err);
    });
});


router.get('/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filepath = path.resolve(temp_dir, filename);
    if (fs.existsSync(filepath)) res.sendFile(filepath);
    else res.sendFile(path.resolve('spin.gif'));
});


module.exports = router;
