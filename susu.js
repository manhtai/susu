'use strict';

const Botkit = require('botkit');
const config = require('./const');

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


controller.setupWebserver(config.port, function (err, webserver) {
    controller.createWebhookEndpoints(controller.webserver);

    controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            res.send('Success!');
        }
    });
});


//const bot = controller.spawn({
//    token: config.api_token
//});
//
//
//bot.startRTM((err) => {
//    if (err) {
//        process.exit(1);
//    }
//});
//
//controller.on('rtm_close', () => {
//    bot.startRTM((err) => {
//        if (err) {
//            process.exit(1);
//        }
//    });
//});
//
//require('./chatter')(controller);
require('./whoisin')(controller);
