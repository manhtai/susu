const express = require('express');
const request = require('request');

const config = require('./const');

const router = express.Router();


router.get('/:username', function (req, res) {
    const username = req.params.username;
    const fields = req.query.fields || 'name,id';
    const cookie = req.query.cookie || '';

    const facebook_url = `https://www.facebook.com/${username}`;
    request({
        url: facebook_url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
            'Cookie': cookie
        }
    }, (error, response, body) => {
        if (error) {
            return res.send(error);
        }

        const profile = body.match(/"fb:\/\/profile\/(\d+)"/);
        const fid = profile && profile[1];
        if (!fid) {
            return res.send({'error': 'Can not find facebook id'});
        }

        const facebook_api = `https://graph.facebook.com/v2.10/${fid}?fields=${fields}&access_token=${config.FACEBOOK_PAGE_TOKEN}`;
        request(facebook_api, (error, response, body) => {
            if (error) {
                return res.send(error);
            }
            return res.send(body);
        });
    });
});


module.exports = router;
