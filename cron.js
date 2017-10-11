const cron = require('cron');
const querystring = require('querystring');
const request = require('request');
const moment = require('moment');

const util = require('./util');
const config = require('./const');


const postToChannel = (team, channel, buffer, name) => {
  const imageUpload = "https://slack.com/api/files.upload";
  const token = config.SLACK_API_TOKEN[team.toLowerCase()];
  const fileName = `${name} ${moment().format("D-M-YYYY_HH.mm")} report.png`;
  request.post({
      url: imageUpload,
      formData: {
        username: config.SLACK_NAME,
        token: token,
        file: {
          value: buffer,
          options: {
            filename: fileName,
            contentType: 'image/png'
          }
        },
        filename: fileName,
        channels: channel
      },
    },
    (error, response, body) => {
      if (error) return console.error(`Error posting message to Slack ${error}`);
    });
};


const sendScreenshot = async(team, channel, url, name) => {
  const [_, query] = url.split('?');
  const params = querystring.parse(query);
  const clip = {
    x: parseInt(params.x),
    y: parseInt(params.y),
    width: parseInt(params.w),
    height: parseInt(params.h)
  };
  let timeout = params.t || 1000;
  timeout = parseInt(timeout);

  const buffer = await (util.getScreenShot(params.url, clip, timeout));
  postToChannel(team, channel, buffer, name);
};


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
            sendScreenshot(team, channel, fileUrl, name);
          },
          start: true,
          timeZone: 'Asia/Ho_Chi_Minh'
        });
        controller.reports.push(myJob);
      });
    }
  });
};
