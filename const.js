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
const STRAVA_SLACK_WEBHOOK = process.env.STRAVA_SLACK_WEBHOOK;

const SLACK_NAME = 'susu';

let slack_api_token = {};
process.env.SLACK_API_TOKEN && process.env.SLACK_API_TOKEN.split('|').map(
    (tt) => {
        const [team, token] = tt.split(':');
        slack_api_token[team] = token;
    }
);
const SLACK_API_TOKEN = slack_api_token;

const FACEBOOK_PAGE_TOKEN = process.env.FACEBOOK_PAGE_TOKEN;

const REPORT_ID = 'report';

const BDAY_ID = 'birthday';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';


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
    STRAVA_TOKEN,
    STRAVA_CLUBS,
    SLACK_NAME,
    STRAVA_CHECK_INTERVAL,
    STRAVA_SLACK_WEBHOOK,
    NEWRELIC_KEY,
    FACEBOOK_PAGE_TOKEN,
    SLACK_API_TOKEN,
    REPORT_ID,
    BDAY_ID,
    TIME_ZONE
};
