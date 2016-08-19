'use strict';

// Set our bot up
const Botkit = require('botkit');
const cowsay = require('cowsay');
const cool = require('cool-ascii-faces');
const config = require('./const');
const util = require('./util');

const controller = Botkit.slackbot({
    storage: config.mongoStorage,
    debug: true
});


const bot = controller.spawn({
    token: config.SLACK_API_TOKEN
});

// start bot
bot.startRTM((err) => {
    if (err) {
        process.exit(1);
    }
});


// restart bot
controller.on('rtm_close', () => {
    bot.startRTM((err) => {
        if (err) {
            process.exit(1);
        }
    });
});


controller.hears(['savequote', 'save quote'],
    'direct_message,direct_mention,mention',
    (bot, message) => {

        controller.storage.users.get(message.user, (err, user) => {
            // Some logs
            if (user && user.quotes) {
                bot.reply(message, 'You\'ve had ' + user.quotes.length + ' quotes so far. Save some more to make the the list longer!');
            } else {
                bot.reply(message, 'Yay, start saving awesome quotes now!');
            }

            const askContent = (response, convo) => {
                convo.ask('What is the new quote content?', (response, convo) => {
                    convo.ask('So here is your quote?\n```\n' + response.text + '\n```\n I know who you are, so please don\'t give me shit here.', [
                        {
                            pattern: bot.utterances.yes,
                            callback: (response, convo) => {
                                askAuthor(response, convo);
                                convo.next();
                            }
                        },
                        {
                            pattern: bot.utterances.no,
                            callback: (response, convo) => {
                                convo.stop();
                            }
                        },
                        {
                            default: true,
                            callback: (response, convo) => {
                                convo.repeat();
                                convo.next();
                            }
                        }
                    ]);

                    notifyComplete(response, convo);
                    convo.next();

                }, {'key': 'content'});
            };

            const askAuthor = (response, convo) => {
                convo.ask('Okay now, who is the author then?', (response, convo) => {
                    convo.ask('Just for sure, the quote\'s author is `' + response.text + '`, right?', [
                        {
                            pattern: bot.utterances.yes,
                            callback: (response, convo) => {
                                convo.next();
                            }
                        },
                        {
                            pattern: bot.utterances.no,
                            callback: (response, convo) => {
                                convo.stop();
                            }
                        },
                        {
                            default: true,
                            callback: (response, convo) => {
                                convo.repeat();
                                convo.next();
                            }
                        }
                    ]);

                    convo.next();

                }, {'key': 'author'});
            };

            const notifyComplete = (response, convo) => {
                convo.on('end', function(convo) {
                    if (convo.status == 'completed') {
                        bot.reply(message, 'OK! I will save your quote to my book...');

                        // Save to user data
                        controller.storage.users.get(message.user, (err, user) => {
                            if (!user) {
                                user = {
                                    id: message.user,
                                    quotes: []
                                };
                            }
                            user.quotes.push({
                                'content': convo.extractResponse('content'),
                                'author': convo.extractResponse('author')
                            });
                            controller.storage.users.save(user, (err, id) => {
                                bot.reply(message, 'Got it. Now you had ' + user.quotes.length + ' quotes written in my book.');
                            });
                        });

                        // Save to team data
                        controller.storage.teams.get(message.team, (err, team_data) => {
                            if (!team_data) {
                                team_data = {
                                    id: message.team,
                                    quotes: []
                                };
                            }
                            team_data.quotes.push({
                                'content': convo.extractResponse('content'),
                                'author': convo.extractResponse('author'),
                                'user': message.user
                            });
                            controller.storage.teams.save(team_data);
                        });

                    } else {
                        // this happens if the conversation ended prematurely for some reason
                        bot.reply(message, 'OK, nevermind!');
                    }
                });
            };

            // Ask to save new quote
            bot.startConversation(message, askContent);
        });
});

controller.hears(
    ['showmyquote', 'show my quote'],
    'direct_message,direct_mention,mention',
    (bot, message) => {
        controller.storage.users.get(message.user, (err, user) => {
            if (user && user.quotes) {
                let random = util.randomInt(0, user.quotes.length);
                bot.reply(message, util.formatQuote(user.quotes[random]));
            } else {
                bot.reply(message, 'Hey there, you had no quotes to show!');
            }
        });
});

controller.hears(
    ['showaquote', 'show a quote'],
    'direct_message,direct_mention,mention,message_received',
    (bot, message) => {
        controller.storage.teams.get(message.team, (err, team_data) => {
            if (team_data && team_data.quotes) {
                let random = util.randomInt(0, team_data.quotes.length);
                bot.reply(message, util.formatQuote(team_data.quotes[random]));
            } else {
                bot.reply(message, 'Sorry there, I had no quotes to show!');
            }
        });
});


controller.hears(
    ['^(\\S+)say (.*)'],
    'direct_message,direct_mention,mention',
    (bot, message) => {
        let animal = message.match[1];
        const text = message.match[2];
        console.log(animal, text);
        cowsay.list((_, cows) => {
            if (cows.indexOf(animal) === -1) {
                animal = 'default';
            }
            const cow = cowsay.say({ text: text, f: animal });
            bot.reply(
                message,
                '```\n' + cow + '\n```'
            );
        });
    }
);


controller.hears(
    ['help'],
    'direct_message,direct_mention,mention',
    (bot, message) => {
        bot.api.reactions.add({
            timestamp: message.ts,
            channel: message.channel,
            name: 'triumph',
        }, (err, res) => {
            if (err) {
                bot.botkit.log('Failed to add emoji reaction :(', err);
            }
        });
        bot.reply(message, "Type `save quote` so save your own quote, and `show a quote` to show a quote from our team member, or `show my quote` to just show your quote.");
    }
);


controller.hears(
    ['.*'],
    'direct_message,direct_mention,mention',
    (bot, message) => {
        bot.api.reactions.add({
            timestamp: message.ts,
            channel: message.channel,
            name: 'heart',
        }, (err, res) => {
            if (err) {
                bot.botkit.log('Failed to add emoji reaction :(', err);
            }
        });
        if (message.user == config.BOT_BOSS) {
            bot.reply(message, "Hello, boss!");
        } else {
            bot.reply(message, "Type `help` so I know you really need me " + cool());
        }
    }
);
