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

const STRAVA_TOKEN = process.env.STRAVA_TOKEN;
const STRAVA_CLUBS = process.env.STRAVA_CLUBS || '';
const STRAVA_CHECK_INTERVAL = 60000;
const STRAVA_CHANNEL = process.env.STRAVA_CHANNEL;

const SLACK_NAME = 'susu';
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK;

const SLACK_API_TOKEN = {};
process.env.SLACK_API_TOKEN && process.env.SLACK_API_TOKEN.split('|').map(
    (tt) => {
        const [team, token] = tt.split(':');
        SLACK_API_TOKEN[team] = token;
    }
);

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const REMINDER_ID = 'REMINDER';


module.exports = {
    clientId,
    clientSecret,
    port,
    api_token,
    verify_token,
    mongoStorage,
    SLACK_WEBHOOK,
    SLACK_API_TOKEN,
    BOT_BOSS,
    GOOGLE_CX,
    GOOGLE_API_KEY,
    WORDS_API,
    DICTIONARY_API,
    STRAVA_TOKEN,
    STRAVA_CLUBS,
    STRAVA_CHANNEL,
    SLACK_NAME,
    STRAVA_CHECK_INTERVAL,
    NEWRELIC_KEY,
    TIME_ZONE,
    REMINDER_ID,
};
