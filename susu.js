'use strict';

// Set our bot up
const Botkit = require('botkit');
const Wit = require('node-wit').Wit;
const config = require('./const');

const controller = Botkit.slackbot({
    storage: config.mongoStorage,
    debug: true
});

const bot = controller.spawn({
    token: config.SLACK_API_TOKEN
}).startRTM();

const wit = new Wit({accessToken: config.WIT_TOKEN});

controller.hears(
    ['wit (.*)'],
    'direct_message,direct_mention,mention',
    (bot, message) => {
        let text = message.match[1];
        let context = {};
        controller.storage.users.get(message.user, (err, user) => {
            if (!user) {
                user = {
                    id: message.user,
                    context: context
                };
            } else {
                context = user.context;
            }
        });
        wit.message(text, context)
        .then((data) => {
            bot.reply(message, "Các entities nhận được từ Wit.ai");
            let entities = data.entities;
            Object.keys(entities).forEach(function (entity) {
              let arr = entities[entity];
              bot.reply(message, `${entity}: ${JSON.stringify(arr)}`);
            });
        })
        .catch(console.error);
    }
);

controller.hears(
    ['.*'],
    'direct_message,direct_mention,mention',
    (bot, message) => {
        bot.reply(message, "Èo, tôi chả hiểu bạn nói gì. Để tôi học thêm đã ~~");
    }
);
