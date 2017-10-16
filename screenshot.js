const express = require('express');
const util = require('./util');

const router = express.Router();


router.get('/', async (req, res) => {
    const url = req.query.url;
    const timeout = parseInt(req.query.t || 1000);
    const xywh = [req.query.x, req.query.y, req.query.w, req.query.h];
    const [x, y, width, height] = xywh.map(i => !isNaN(i) ? parseInt(i): 0);
    const clip = { x, y, width, height };

    const buffer = await (util.getScreenShot(url, clip, timeout));
    res.type('png');
    res.end(buffer, 'binary');
});


module.exports = router;
