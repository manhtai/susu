'use strict';


const request = require('request');
const config = require('./const');
const parseString = require('xml2js').parseString;


const pronounceWord = (word, cb) => {
    let sound = `http://media.merriam-webster.com/soundc11`;
    request({
        url: `http://www.dictionaryapi.com/api/v1/references/learners/xml/${word}`,
        qs: {
            key: config.DICTIONARY_API
        },
        method: 'GET'
    }, (err, resp, body) => {
        if (!err && !resp.body.err) {
            parseString(body, (err, result) => cb(err, result, sound));
        } else {
            cb(true);
        }
    });
};


module.exports = {
    pronounceWord: pronounceWord
};

