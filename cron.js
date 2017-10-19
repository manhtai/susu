const cron = require('cron');

const util = require('./util');
const config = require('./const');


const clearReports = (controller) => {
  controller.reports = controller.reports || [];
  controller.reports.forEach(j => j.stop());
  controller.reports = [];
};


module.exports = (controller) => {
  clearReports(controller);
  controller.storage.teams.get(config.REPORT_ID, (err, reports) => {
    if (!err) {
      reports && reports.list && reports.list.map((report) => {
        const [team, channel, time, name, url] = [
          report.team, report.channel, report.time, report.name, report.url
        ];
        const fileUrl = url.substring(1, url.length-1).replace(/&amp;/g, "&");
        const myJob = new cron.CronJob({
          cronTime: time,
          onTick: () => {
            util.sendScreenshot(team, channel, fileUrl, name);
          },
          start: true,
          timeZone: config.TIME_ZONE
        });
        controller.reports.push(myJob);
      });
    }
  });
};
