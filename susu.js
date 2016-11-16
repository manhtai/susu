'use strict';

require('newrelic');

const Botkit = require('botkit');
const config = require('./const');
const express = require('express');
const bodyParser = require('body-parser');

const controller = Botkit.slackbot({
    storage: config.mongoStorage,
    debug: true
});


// Config app for just using commands
controller.configureSlackApp(
    {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        scopes: ['users:read','emoji:read','chat:write:bot','commands']
    }
);

const bot = controller.spawn({
    token: config.api_token
});


bot.startRTM((err) => {
    if (err) {
        process.exit(1);
    }
});

controller.on('rtm_close', () => {
    bot.startRTM((err) => {
        if (err) {
            process.exit(1);
        }
    });
});

require('./chatter')(controller);
require('./whoisin')(controller);


// Setup server
var static_dir =  __dirname + '/public';
var webserver = express();
webserver.use(bodyParser.json());
webserver.use(bodyParser.urlencoded({ extended: true }));
webserver.use(express.static(static_dir));

webserver.get('/', (req, res) => { res.send('Hi, I am a bot!'); });

controller.webserver = webserver;
controller.config.port = config.port;

controller.createWebhookEndpoints(webserver);

controller.createOauthEndpoints(webserver, function (err, req, res) {
    if (err) {
        res.status(500).send('ERROR: ' + err);
    } else {
        res.send('Success!');
    }
});

webserver.listen(config.port);
