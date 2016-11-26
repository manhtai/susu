'use strict';

const request = require('request');

const MEME = "https://memegen.link";

function getMemeTemplates(callback) {
    let baseLink = `${MEME}/api/templates/`;
    request(baseLink, (err, resp, body) => {
        if (!err && !resp.body.err) {
            body = JSON.parse(body);
            let templates = {};
            let list = [];
            for (let name in body) {
                let key = body[name].replace(baseLink, '');
                list.push(key);
                templates[key] = name;
            }
            if (callback) callback(null, list, templates);
        } else {
            if (callback) callback(true);
        }
    });
}


function buildUrl(template, top, bottom, alt) {
    return alt ? `${MEME}/${template}/${top || '_'}/${bottom || '_'}.jpg?alt=${alt}` :
        `${MEME}/${template}/${top || '_'}/${bottom || '_'}.jpg`;
}


module.exports = {
    getMemeTemplates,
    buildUrl
};
