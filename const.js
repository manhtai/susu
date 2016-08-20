'use strict';

const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN;
if (!SLACK_API_TOKEN) {
    throw new Error('missing SLACK_API_TOKEN');
}

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost/susu_demo';
const mongoStorage = require('botkit-storage-mongo')({mongoUri: mongoUri});
const BOT_BOSS = process.env.BOT_BOSS;

const GOOGLE_CX = process.env.GOOGLE_CX;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const WORDS_API = process.env.WORDS_API;

module.exports = {
    mongoStorage: mongoStorage,
    SLACK_API_TOKEN: SLACK_API_TOKEN,
    BOT_BOSS: BOT_BOSS,
    GOOGLE_CX: GOOGLE_CX,
    GOOGLE_API_KEY: GOOGLE_API_KEY,
    WORDS_API: WORDS_API
};
