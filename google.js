'use strict';


const google = require('googleapis');
const customsearch = google.customsearch('v1');

const config = require('./const');


const searchText = (q, cb) => {
    customsearch.cse.list(
        {
            cx: config.GOOGLE_CX,
            auth: config.GOOGLE_API_KEY,
            q: q
        }, (err, result) => cb(err, result)
    );
};


module.exports = {
    searchText: searchText
};
