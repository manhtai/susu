const cron = require('cron');

const util = require('./util');
const config = require('./const');


const clearBdays = (controller) => {
  controller.bdays = controller.bdays || [];
  controller.bdays.forEach(j => j.stop());
  controller.bdays = [];
};


module.exports = (controller) => {
  clearBdays(controller);

  controller.storage.teams.get(config.BDAY_ID, (err, bdays) => {
    if (!err && bdays && bdays.bdays) {
        const dayList = {};
        for (let m in bdays.bdays) {
            const bday = bdays.bdays[m];
            const time = `0 10 ${bday[0]} ${bday[1]} *`;
            if (!dayList[time]) {
                dayList[time] = [m];
            } else {
                dayList[time].push(m);
            }
        }

        for (let time in dayList) {
            const myBday = new cron.CronJob({
              cronTime: time,
              onTick: () => {
                util.sendHappyBirthday('vicare', 'general', dayList[time]);
              },
              start: true,
              timeZone: config.TIME_ZONE
            });
            controller.bdays.push(myBday);
        }
    }
  });

};
