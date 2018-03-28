'use strict';

const cron     = require('cron');

const config   = require('./const');
const util     = require('./util');
const whoisin  = require('./whoisin');


const parseAhemCommand = (re) => {
  // An ahem command meta will have this format
  // channel ; text
  // ie. general ; What do you want to eat? | Rice | Pizza
  const [channel, text] = re.meta.split(';').map(i => i.trim());
  return { channel, text, command: re.command };
};


const sendReminderToChannel = (re) => {
  switch (re.command) {
    case 'ahem':
    case 'ahemm':

      const ahem = parseAhemCommand(re);
      const message = whoisin.getAhemResponse(ahem);
      util.hookMessageToSlack(ahem.channel, message);

      break;
    }
};


// Cron part, for sending reminders in a specific time
const clearReminders = (controller) => {
  controller.reminders = controller.reminders || [];
  controller.reminders.forEach(j => j.stop());
  controller.reminders = [];
};


const reminderJob = (controller) => {
  clearReminders(controller);
  controller.storage.teams.get(config.REMINDER_ID, (err, reminders) => {
    if (!err) {
      reminders && reminders.list && reminders.list.map((re) => {
        const myJob = new cron.CronJob({
          cronTime: re.time,
          onTick: () => {
            sendReminderToChannel(re);
          },
          start: true,
          timeZone: config.TIME_ZONE
        });
        controller.reminders.push(myJob);
      });
    }
  });
};

module.exports = {
    sendReminderToChannel,
    reminderJob,
};
