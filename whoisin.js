'use strict';
// Forked from Slapp version: https://github.com/BeepBoopHQ/in-or-out

const request = require('request');
const config  = require('./const');
const meme    = require('./meme');
const util    = require('./util');


// I want to call back on all (err, resp, body) so I rewrite it
function myReplyPublicDelayed(src, resp, cb) {
    if (!src.response_url) {
        if (cb) cb('No response_url found');
    } else {
        var msg = {};

        if (typeof(resp) == 'string') {
            msg.text = resp;
        } else {
            msg = resp;
        }

        msg.channel = src.channel;

        msg.response_type = 'in_channel';
        var requestOptions = {
            uri: src.response_url,
            method: 'POST',
            json: msg
        };
        request(requestOptions, cb);
    }
}


module.exports = (controller) => {
    controller.on('slash_command', function(bot, message) {
        if (message.token !== config.verify_token) return; // Verify it

        switch (message.command) {

            case '/ahem':
                console.log("test");
                if (message.text === '' || message.text === 'help') {
                    // Display invisible help
                    bot.replyPrivate(message, 'Usage: "Will you marry me? <3 | Yes | No | What?"');
                } else if (message.text === 'restore') {
                    // Restore latest saved message from storage
                    controller.storage.channels.get(message.channel, (err, channelData) => {
                        if (!err && channelData && channelData.original_message &&
                            message.user === config.BOT_BOSS)
                            bot.replyPublic(message, channelData.original_message);
                        else
                            bot.replyPrivate(message, 'What are you doing, kid?');
                    });
                } else {
                    // Create new message
                    var lines = message.text.split('|').map(it => it.trim());
                    var text = lines[0];

                    // max 15 answers (3 for buttons, 1 for move to bottom, 15 for each answer)
                    if (lines.length > 16) {
                        bot.replyPublic(message, `:sob: Sorry, you may only enter 15 options. Here is what you entered: ahem ${message.text}`);
                        return;
                    }

                    // default actions incase the user doesn't specify one
                    var actions = [{
                        name: 'answer',
                        text: 'Có',
                        type: 'button',
                        value: 'Có',
                        style: 'primary'
                    }, {
                        name: 'answer',
                        text: 'Không',
                        type: 'button',
                        value: 'Không',
                        style: 'default'
                    }];

                    if (lines.length > 1) {
                        actions = [];
                        for (var i = 1; i < lines.length; i++) {
                            var answer = lines[i];
                            actions.push({
                                name: 'answer',
                                text: answer,
                                type: 'button',
                                value: answer,
                                style: 'default'
                            });
                        }
                    }

                    // split the buttons into blocks of five if there are that many different
                    // questions
                    let attachments = [];
                    actions.forEach((action, num) => {
                        let idx = Math.floor(num / 5);
                        if (!attachments[idx]) {
                            attachments[idx] = {
                                text: '',
                                fallback: message.text,
                                callback_id: 'yes_or_no_callback',
                                color: '#FF749C',
                                actions: []
                            };
                        }
                        attachments[idx].actions.push(action);
                    });

                    let bottomActions = [{
                        name: 'recycle',
                        text: ':arrow_down:',
                        type: 'button'
                    }, {
                        name: 'delete',
                        text: ':arrows_counterclockwise:',
                        type: 'button'
                    }];

                    // move to the bottom button
                    attachments.push({
                        text: '',
                        fallback: 'move to the bottom',
                        callback_id: 'yes_or_no_callback',
                        actions: bottomActions
                    });

                    bot.replyPublic(message, {
                        text: text,
                        attachments: attachments
                    }, (err) => {
                        if (err && err.message === 'channel_not_found') {
                            bot.replyPrivate(message, 'Sorry, I can not write to a channel or group I am not a part of!');
                        }
                    });

                }

                break;

            case '/meme':
                if (message.text === '' || message.text === 'help') {
                    bot.replyPrivate(message, 'Post a meme: /meme template_name | top_row | bottom_row\nList meme templates: /meme list'
                    );
                } else if (message.text === 'list') {
                    meme.getMemeTemplates((err, list, templates) => {
                        let helpText = [];
                        for (let key in templates) {
                            helpText.push(`\`${key}\`: ${templates[key]}`);
                        }
                        helpText.sort();
                        bot.replyPrivate(message, helpText.join('\n'));
                    });
                } else {
                    let lines = message.text.split('|').map(it => it.trim());
                    let [template, top, bottom] = lines;
                    [top, bottom] = [top, bottom].map(x => x && encodeURIComponent(x.split(' ').join('_')));
                    let alt;
                    const templatePromise = new Promise(function(resolve, reject) {
                        meme.getMemeTemplates((err, list) => {
                            if (!err && list) {
                                if (list.indexOf(template) === -1) {
                                    if (template.indexOf('http') === 0) {
                                        alt = template;
                                        template = "custom";
                                        resolve(template);
                                        return;
                                    } else if (template.indexOf('@') === 0) {
                                        let member = template.slice(1);
                                        return Promise.resolve(
                                            controller.storage.users.get(member, (err, user) => {
                                                if (!err && user && user.profile) {
                                                    alt = user.profile.image_512;
                                                    template = "custom";
                                                    resolve(template);
                                                    return;
                                                }
                                            })
                                        );
                                    } else {
                                        let random = util.randomInt(0, list.length);
                                        if (lines.length === 1) top = template;
                                        template = list[random];
                                        resolve(template);
                                        return;
                                    }
                                } else {
                                    resolve(template);
                                    return;
                                }
                            }
                            reject();
                        });
                    });
                    templatePromise.then((template) => {
                        let meme_url = meme.buildUrl(template, top, bottom, alt);
                        let attachments = [{
                            image_url: meme_url,
                            fallback: [top, bottom].join(' | ')
                        }];
                        bot.replyPublic(message, {
                            attachments: attachments
                        });
                    }).catch(() => {
                        bot.replyPrivate(message, 'Something went wrong!');
                    });
                }

                break;

            default:
                bot.replyPublic(message, 'I\'m afraid I don\'t know how to ' + message.command + ' yet.');

        }
    });

    controller.on('interactive_message_callback', function(bot, message) {
        if (message.callback_id == 'yes_or_no_callback') {
            var orig = message.original_message;
            if (!orig) return;
            var lassMessage = {id: message.channel, original_message: orig};
            var update = {
                text: 'Moved to bottom: ' + orig.text,
                delete_original: true
            };
            var del = {
                text: 'Deleted: ' + orig.text,
                delete_original: true
            };
            switch (message.actions[0].name) {

                case 'answer':
                    var payload = JSON.parse(message.payload);
                    var value = message.actions[0].value;
                    var infoMsg = message.user + ' is ' + value;
                    var username = payload.user.name;
                    var foundExistingLine = false;
                    orig.attachments = orig.attachments || [];

                    var newAttachments = [];
                    var lines = [];

                    // look for an existing line/attachment and update it if found
                    for (var i = 0; i < orig.attachments.length; i++) {
                        var attachment = orig.attachments[i];

                        if (attachment.actions) {
                            newAttachments.push(attachment);
                            continue;
                        }

                        // parse the attachment text and represent as an object
                        var line = new AttachmentLine(attachment.text);
                        if (line.answer === value) {
                            foundExistingLine = true;
                            line.add(username);
                            lines.push(line);
                        } else {
                            line.remove(username);
                            if (line.count() > 0) {
                                lines.push(line);
                            }
                        }
                    }

                    // create a new line if next existing
                    if (!foundExistingLine) {
                        let line = new AttachmentLine();
                        line.answer = value;
                        line.add(username);
                        lines.push(line);
                    }

                    // sort lines by most votes
                    lines = lines.sort((a, b) => {
                        return a.count() > b.count() ? -1 : 1;
                    });

                    // render and replace the updated attachments list
                    orig.attachments = newAttachments.concat(lines.map((l) => {
                        return {
                            text: l.string(),
                            mrkdwn_in: ["text"],
                            color: '#00BABE'
                        };
                    }));
                    bot.replyInteractive(message, orig);
                    break;

                case 'recycle':
                    let myMessage = {
                        text: orig.text,
                        attachments: orig.attachments,
                        channel: message.channel,
                        username: 'susu' // FIXME: Should set as_user = false
                    };
                    controller.storage.users.get(config.BOT_BOSS, (err, user) => {
                        if (!err && user && user.access_token) {
                            bot.config.token = user.access_token;
                            bot.send(myMessage, (err, res) => {
                                if (!err) {
                                    bot.replyInteractive(message, update, (err) => {
                                        if (err) {
                                            handleError(err, bot, message);
                                        }
                                    });
                                } else {
                                    handleError(err, bot, message);
                                }
                            });
                        }
                    });
                    break;

                case 'delete':
                    if (message.user === config.BOT_BOSS) {
                        bot.replyInteractive(message, del, (err) => {
                            controller.storage.channels.save(lassMessage);
                            if (err) {
                                handleError(err, bot, message);
                            }
                        });
                    }
                    break;

                default:
                    return;
            }
        }
    });
};


function handleError(err, bot, message) {

    console.error(err);

    if (!message.response_url) return;

    bot.replyPublicDelayed(message, {
        text: `:scream: Uh Oh: ${err.message || err}`,
        response_type: 'ephemeral',
        replace_original: false
    }, (err) => {
        if (err) console.error('Error handling error:', err);
    });
}


class AttachmentLine {

    constructor(text) {
        this.entries = [];
        this.answer = '';
        if (text) {
            var parts = text.substring(text.indexOf(' ')).split(/»/);
            parts = parts.map((it) => {
                return it.trim();
            });
            this.answer = parts[0];
            this.entries = parts[1].split(',').map((val) => {
                return val.trim();
            });
        }
    }

    add(entry) {
        if (this.entries.indexOf(entry) > -1) {
            this.remove(entry);
        } else {
            this.remove(entry);
            this.entries.push(entry);
        }
        return this;
    }

    remove(entry) {
        this.entries = this.entries.filter((val) => {
            return val !== entry;
        });
        return this;
    }

    contains(entry) {
        return this.entries.indexOf(entry) > -1;
    }

    count() {
        return this.entries.length;
    }

    string() {
        let dots = '';
        return '*' + this.count() + '*' + ' ' + this.answer + ' » ' + this.entries.join(', ');
    }
}
