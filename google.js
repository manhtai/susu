'use strict';


const google = require('googleapis');
const customsearch = google.customsearch('v1');

const config = require('./const');


const searchText = (q, t, cb) => {
    let data = {
        cx: config.GOOGLE_CX,
        auth: config.GOOGLE_API_KEY,
        q: q
    };
    if (t) data.searchType = t;
    customsearch.cse.list(data, (err, result) => cb(err, result));
};


module.exports = {
    searchText: searchText
};
