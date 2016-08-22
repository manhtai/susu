'use strict';


const request = require('request');
const config = require('./const');
const parseString = require('xml2js').parseString;


const pronounceWord = (word, cb) => {
    request({
        url: `http://www.dictionaryapi.com/api/v1/references/learners/xml/${word}`,
        qs: {
            key: config.DICTIONARY_API
        },
        method: 'GET'
    }, (err, resp, body) => {
        if (!err && !resp.body.err) {
            parseString(body, (err, result) => cb(err, result));
        } else {
            cb(true);
        }
    });
};


const audioLink = (word) => {
    let base = `http://media.merriam-webster.com/soundc11`;
    let sound;
    if (word.match(/^(gg|bix)/)) {
        let match = word.match(/^(gg|bix)/);
        sound = `${base}/${match[1]}/${word}`;
    } else if (word.match(/^[1-9]/)) {
        sound = `${base}/number/${word}`;
    } else {
        sound = `${base}/${word[0]}/${word}`;
    }
    return sound;
};


module.exports = {
    pronounceWord: pronounceWord,
    audioLink: audioLink
};
