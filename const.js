'use strict';

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const port = process.env.PORT || 8445;
const verify_token = process.env.VERIFICATION_TOKEN;
const api_token = process.env.API_TOKEN;

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost/susu_demo';
const mongoStorage = require('botkit-storage-mongo')({mongoUri: mongoUri});
const BOT_BOSS = process.env.BOT_BOSS;

const GOOGLE_CX = process.env.GOOGLE_CX;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const WORDS_API = process.env.WORDS_API;
const DICTIONARY_API = process.env.DICTIONARY_API;

const NEWRELIC_KEY = process.env.NEWRELIC_KEY;


module.exports = {
    clientId,
    clientSecret,
    port,
    api_token,
    verify_token,
    mongoStorage,
    BOT_BOSS,
    GOOGLE_CX,
    GOOGLE_API_KEY,
    WORDS_API,
    DICTIONARY_API,
    NEWRELIC_KEY
};
