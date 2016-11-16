'use strict';
// Forked from Slapp version: https://github.com/BeepBoopHQ/in-or-out

const config = require('./const');


module.exports = (controller) => {
    var myMessage;
    var count = {};
    controller.on('slash_command', function(bot, message) {
        myMessage = message;  // replyPublicDelayed can't post to interactive message url so we have to hack this
        switch (message.command) {
            case '/ahem':

                // Verify it
                if (message.token !== config.verify_token) return; //just ignore it.

                if (message.text === '' || message.text === 'help') {
                    bot.replyPrivate(message, 'You know what to do, man!');
                    return;
                }

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
                    style: 'default'
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
                var attachments = [];
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

                break;

            default:
                bot.replyPublic(message, 'I\'m afraid I don\'t know how to ' + message.command + ' yet.');

        }
    });

    controller.on('interactive_message_callback', function(bot, message) {
        if (message.callback_id == 'yes_or_no_callback') {
            var orig = message.original_message;
            if (!orig) return;
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
                    count[message.user] = count[message.user] || 0;
                    if (count[message.user] > 2) return;

                    bot.replyPublicDelayed(myMessage, orig, (err) => {
                        count[message.user] += 1;
                        if (!err) {
                            bot.replyInteractive(message, update, (err) => {
                                if (err) {
                                    handleError(err, bot, message);
                                    return;
                                }
                            });
                        }
                    });
                    break;

                case 'delete':
                    if (message.user == config.BOT_BOSS)
                        bot.replyInteractive(message, del, (err) => {
                            if (err) {
                                handleError(err, bot, message);
                            }
                        });
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

    bot.reply({
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
        this.remove(entry);
        this.entries.push(entry);
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
