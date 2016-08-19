'use strict';

const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN;
if (!SLACK_API_TOKEN) {
    throw new Error('missing SLACK_API_TOKEN');
}

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost/susu_demo';
const mongoStorage = require('botkit-storage-mongo')({mongoUri: mongoUri});
const BOT_BOSS = process.env.BOT_BOSS;

module.exports = {
    mongoStorage: mongoStorage,
    SLACK_API_TOKEN: SLACK_API_TOKEN,
    BOT_BOSS: BOT_BOSS
};
