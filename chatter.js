'use strict';

const cowsay     = require('cowsay');
const cool       = require('cool-ascii-faces');
const prettyCron = require('prettycron');
const cron       = require('cron');
const moment     = require('moment-timezone');

const util   = require('./util');
const dict   = require('./dictionary');
const google = require('./google');
const cow    = require('./cow');
const config = require('./const');
const runCron = require('./cron');


module.exports = (controller) => {

    // Start conversation to save quote
    controller.hears(['savequote', 'save quote'],
        'direct_message,direct_mention,mention',
        (bot, message) => {

            controller.storage.users.get(message.user, (err, user) => {
                // Some logs
                if (user && user.quotes) {
                    bot.reply(message, `You've had ${user.quotes.length} quotes so far. Save some more to make the the list longer!`);
                } else {
                    bot.reply(message, 'Yay, start saving awesome quotes now!');
                }

                const askContent = (response, convo) => {
                    convo.ask('What is the new quote content?', (response, convo) => {
                        convo.ask(`So here is your quote? \n\n *"${response.text}"*\n`, [
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
                        convo.ask(`Just for sure, the quote's author is \`${response.text}\`, right?`, [
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
                                    bot.reply(message, `Got it. Now you had ${user.quotes.length} quotes written in my book.`);
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
                            bot.reply(message, `OK, nevermind! ${cool()}`);
                        }
                    });
                };

                // Ask to save new quote
                bot.startConversation(message, askContent);
            });
    });


    // Show your quotes
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


    // Show quotes from your team
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


    // https://github.com/piuccio/cowsay
    controller.hears(
        ['^(\\S+)say (.*)'],
        'direct_message,direct_mention,mention',
        (bot, message) => {
            let animal = message.match[1];
            const text = message.match[2];
            cow.list((err, cows) => {
                if (!err) {
                    let found;
                    for (let cow of cows) {
                        if (cow === animal || cow === `cows/${animal}.cow`) {
                            found = true;
                            animal = cow;
                            break;
                        }
                    }
                    if (!found) {
                        let random = util.randomInt(0, cows.length);
                        animal = cows[random];
                    }
                    const cow = cowsay.say({ text: text, f: animal });
                    bot.reply(
                        message,
                        '```\n' + cow + '\n```'
                    );
                }
            });
        }
    );


    //  https://github.com/google/google-api-nodejs-client
    controller.hears(
        ['^search(i|) (.*)'],
        'direct_message,direct_mention,mention',
        (bot, message) => {
            const t = message.match[1] == 'i' ? 'image' : null;
            const l = t == 'image' ? 'images' : 'things';
            const q = message.match[2];
            google.searchText(
                q, t,
                (err, resp) => {
                    if (err) {
                      return bot.botkit.log('An error occured', err);
                    }
                    if (resp.items && resp.items.length > 0) {
                        let text = `Hey, I found ${resp.items.length} ${l} for you ${cool()}\n\n`;
                        text += resp.items.map((item, i) => {
                            let order = i + 1;
                            return `${order}. *${item.title}* ~> ${item.link}`;
                        }).join('\n');
                        bot.reply(message, text);
                    } else {
                        bot.reply(message, 'Even Google can not find it, awesome!');
                    }
            });
            bot.botkit.log(`User ${message.user} search: ${q}`);
        }
    );


    // http://www.dictionaryapi.com/
    controller.hears(
        ['^say (.*)'],
        'direct_message,direct_mention,mention',
        (bot, message) => {
            let word = message.match[1].trim();
            dict.pronounceWord(word, (err, body) => {
                try {
                    let entry_list = body.entry_list;
                    let result = [];
                    if (entry_list.entry) {
                        entry_list.entry.forEach((entry, index) => {
                            if (util.isSame(entry.$.id, word)) {
                                let r = `*${entry.hw[0]._ || entry.hw[0]}*`;
                                let p = false;
                                if (entry.fl) r += ` [${entry.fl[0]}]`;
                                if (entry.pr) {
                                    r += ` ~> \`${entry.pr[0]._ || entry.pr[0]}\``;
                                    p = true;
                                } else if (entry.altpr) {
                                    r += ` ~> \`${entry.altpr[0]}\``;
                                    p = true;
                                }
                                if (entry.sound) {
                                    r += ` ~> ${dict.audioLink(entry.sound[0].wav[0])}`;
                                }
                                if (p) {
                                    result.push(r);
                                }
                            }
                        });
                        result = result.join('\n');
                    } else if (entry_list.suggestion) {
                        entry_list.suggestion.forEach((suggestion, index) => {
                            result.push(`\`${suggestion}\``);
                        });
                        result = `I can't find your word, but here are some suggestions: ${result.join(', ')}.`;
                    }
                    bot.reply(message, result);
                } catch (e) {
                    bot.reply(message, "I can't even speak it right, sorry!");
                }
            });
        }
    );


    // Start conversation to shotdown me
    controller.hears(['^shutdown$'],
        'direct_message,direct_mention,mention',
        (bot, message) => {

            if (message.user == config.BOT_BOSS) {
                bot.reply(message, "Goodbye, boss!");
                process.exit();
            } else {
                const askAgain = (response, convo) => {
                    convo.ask(`Why do you want me to die, won't you miss me?`, [
                        {
                            pattern: bot.utterances.yes,
                            callback: (response, convo) => {
                                bot.reply(message, `Yay, I know you do, so I won't leave you anytime soon then! ${cool()}`);
                                convo.next();
                            }
                        },
                        {
                            pattern: bot.utterances.no,
                            callback: (response, convo) => {
                                bot.reply(message, `Opps, it's because we don't know much about each other yet, I'll stay so we can become friends! ${cool()}`);
                                convo.next();
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
                };

                bot.startConversation(message, askAgain);
        }
    });


    // Ơ, for Thu Thaor
    controller.hears(
        ['^ơ$'],
        'direct_message,direct_mention,mention,message_received',
        (bot, message) => {
            bot.reply(message, message.text);
    });

    // Save user info
    controller.hears(
        ['update users'],
        'direct_message,direct_mention,mention,message_received',
        (bot, message) => {
            if (message.user != config.BOT_BOSS) return;
            bot.api.users.list({token: config.api_token},
                (err, response) => {
                    if (!err) {
                        response.members.map((member) => {
                            member.uid = member.id;
                            member.id = member.name;
                            controller.storage.users.save(member);
                        });
                        bot.reply(message, 'Update success!');
                    } else {
                        bot.reply(message, 'Update fail!');
                    }
            });
        }
    );

    // Get user info
    controller.hears(
        ['get info (.*)'],
        'direct_message,direct_mention,mention,message_received',
        (bot, message) => {
            let user = message.match[1].trim();
            controller.storage.users.get(user, (err, member) => {
                if (!err && member && member.profile) {
                    bot.reply(message, `\`\`\`${JSON.stringify(member, null, 4)}\`\`\``);
                } else {
                    bot.reply(message, 'I do not know her!');
                }
            });
        }
    );

    // Get user email
    controller.hears(
        ['get email (.*)'],
        'direct_message,direct_mention,mention',
        (bot, message) => {
            let user = message.match[1].trim();
            controller.storage.users.get(user, (err, member) => {
                if (!err && member && member.profile) {
                    bot.reply(message, `${member.profile.real_name || user}'s email address is \`${member.profile.email}\` ${cool()}`);
                } else {
                    bot.reply(message, 'I do not know her!');
                }
            });
        }
    );

    // Start conversation to save report links
    controller.hears(['^report (.*)'],
        'direct_message,direct_mention,mention,message_received',
        (bot, message) => {
            const askForReport = (response, convo) => {
                convo.ask('Add new report following this format: `{team} | {channel} | {time} | {name} | {url}`. I only support ViCare & Xander team for now.', (response, convo) => {

                    if (response.text.split('|').length !== 5) {
                        bot.reply(message, `Please look at the format above again!`);
                        convo.stop();
                        return;
                    }
                    const [team, channel, time, name, url] = response.text.split('|').map(
                        t => t.trim()
                    );

                    if (['xander', 'vicare'].indexOf(team.toLowerCase()) === -1) {
                        bot.reply(message, `I told you I only support ViCare and Xander!`);
                        convo.stop();
                        return;
                    }

                    try {
                        new cron.CronJob(time, () => {});
                    } catch (ex) {
                        bot.reply(message, `Pattern of cron time: ${time} is not valid!`);
                        convo.stop();
                        return;
                    }

                    convo.ask(`So you want to send *${name}* report \`${url}\` to channel *#${channel}* of team *${team}* at ${prettyCron.toString(time)}?`, [
                        {
                            pattern: bot.utterances.yes,
                            callback: (response, convo) => {
                                addReport(response, convo);
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

                }, {'key': 'content'});
            };

            const addReport = (response, convo) => {
                convo.on('end', function(convo) {
                    if (convo.status == 'completed') {
                        // Save to team data
                        controller.storage.teams.get(config.REPORT_ID, (err, reports) => {
                            if (!reports) {
                                reports = {
                                    id: config.REPORT_ID,
                                    list: [],
                                    mod: []
                                };
                            }
                            const content = convo.extractResponse('content');
                            const [team, channel, time, name, url] = content
                                .split('|')
                                .map(t => t.trim());
                            reports.list.push({
                                team, channel, time, name, url, content,
                                owner: message.user
                            });
                            controller.storage.teams.save(reports, (err) => {
                                if (!err) {
                                    bot.reply(message, 'Save success!');
                                    runCron(controller);
                                } else {
                                    bot.reply(message, "Sorry I can't save your report for now :(")
                                }
                            });
                        });

                    } else {
                        // this happens if the conversation ended prematurely for some reason
                        bot.reply(message, `OK, nevermind! ${cool()}`);
                    }
                });
            };

            const [command, ...args] = message.match[1].split(' ').map(i => i.trim());

            switch (command) {
                case 'add':
                    // Ask to add new report
                    bot.startConversation(message, askForReport);
                    break;

                case 'list':
                    controller.storage.teams.get(config.REPORT_ID, (err, reports) => {
                        bot.reply(message, `${reports && reports
                                .list
                                .map((i, idx) => `#${idx+1}: \`${i.content}\``)
                                .join('\n')}`);
                    });
                    break;

                case 'mod':
                    controller.storage.teams.get(config.REPORT_ID, (err, reports) => {
                        if (message.user === config.BOT_BOSS) {
                            reports.mod = args;
                            controller.storage.teams.save(reports, (err) => {
                                if (!err) bot.reply(message, "Update mod success!");
                            });
                        }
                    });
                    break;

                case 'raw':
                    controller.storage.teams.get(config.REPORT_ID, (err, reports) => {
                        bot.reply(message, `\`\`\`${JSON.stringify(reports)}\`\`\``);
                    });
                    break;

                case 'refresh':
                    runCron(controller);
                    bot.reply(message, 'Refresh success!');
                    break;

                case 'delete':
                    const id = args[0];
                    controller.storage.teams.get(config.REPORT_ID, (err, reports) => {
                        // Only owner or boss or mod can delete reports
                        const listCanDelete = reports.list
                            .map((l, idx) => ({ ...l, idx }))
                            .filter((l, idx) => idx == id - 1)
                            .filter(l => l.owner === message.user ||
                                message.user === config.BOT_BOSS ||
                                reports.mod && reports.mod.indexOf(message.user) > -1
                            )
                            .map(l => l.idx);

                        const newList = reports.list.filter((l, idx) => listCanDelete.indexOf(idx) === -1);

                        if (newList.length !== reports.list.length) {
                            reports = {
                                ...reports,
                                list: newList
                            };
                            controller.storage.teams.save(reports, (err) => {
                                runCron(controller);
                                bot.reply(message, `#${id} is deleted!`);
                            });
                        } else {
                            bot.reply(message, `You can't delete #${id}!`);
                        }
                    });
                    break;

                case 'upload':
                    const id = args[0];
                    controller.storage.teams.get(config.REPORT_ID, (err, reports) => {
                        if (!err) {
                            const report = reports.list.filter((r, idx) => idx == id - 1)[0];
                            if (report) {
                                const [team, channel, time, name, url] = [
                                    report.team, report.channel, report.time, report.name, report.url
                                ];
                                const fileUrl = url.substring(1, url.length-1).replace(/&amp;/g, "&");
                                util.sendScreenshot(team, channel, fileUrl, name);
                                bot.reply(message, `I will send report ${name} to channel ${channel}, wait a sec...`);
                            }
                        }
                    });
                    break;

                default:
                    bot.reply(message, 'Use `report add`, `report list`, `report delete` to change report list. And `report refresh` to refresh the list.');
            }
    });

    // Get user username by email
    controller.hears(
        ['get user (.*)'],
        'direct_message,direct_mention,mention',
        (bot, message) => {
            let email = message.match[1].trim();
            controller.storage.users.all((err, allUsers) => {
                if (!err && allUsers) {
                    const users = allUsers.filter(u => u.profile && email.indexOf(u.profile.email) !== -1);
                    if (users.length) {
                        bot.reply(message, `\`\`\`${JSON.stringify(users[0], null, 4)}\`\`\``);
                    } else {
                        bot.reply(message, 'I can\'t find anything!');
                    }
                } else {
                    bot.reply(message, 'I do not know her!');
                }
            });
        }
    );

    controller.hears(
        ['^count love'],
        'direct_message,direct_mention,mention',
        (bot, message) => {
            const toDay = moment().tz(config.TIME_ZONE).format("YYYY-MM-DD");
            bot.reply(message, `It's been ${util.preciseDiff('2016-12-24', toDay)} now ${cool()}`);
        }
    );

    // Help
    controller.hears(
        ['help'],
        'direct_message,direct_mention,mention',
        (bot, message) => {
            bot.reply(
                message,
                cool() + " hi there!\n" +
                "Try command me by `/ahem`, `/meme`, `/tinh` or tag me with `search`, `say`, `cowsay`, `savequote`, `report help`, `shutdown` to see how powerful I am!\n" +
                "My soul is in https://github.com/manhtai/susu, feel free to read through!"
            );
        }
    );

};
