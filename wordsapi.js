'use strict';

const request = require('request');
const config = require('./const');


const pronounceWord = (word, cb) => {
    request({
        url: 'https://wordsapiv1.p.mashape.com/words/' + word + '/pronunciation',
        headers: {
            "X-Mashape-Key": config.WORDS_API,
            "Accept": "application/json"
        },
        method: 'GET'
    }, (err, resp, body) => {
        if (!err && !resp.body.err) {
            let result;
            try {
                result = JSON.parse(body);
                cb(false, result);
            } catch (err) {
                cb(err);
            }
        } else {
            cb(true);
        }
    });
};


module.exports = {
    pronounceWord: pronounceWord
};
