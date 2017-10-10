const cron = require('cron');
const querystring = require('querystring');
const request = require('request');
const moment = require('moment');

const util = require('./util');
const config = require('./const');


const postToChannel = (buffer, channels, name = 'screenshot.png') => {
  const imageUpload = "https://slack.com/api/files.upload";
  request.post({
      url: imageUpload,
      formData: {
        username: config.SLACK_NAME,
        token: config.api_token,
        file: {
          value: buffer,
          options: {
            filename: name,
            contentType: 'image/png'
          }
        },
        filename: name,
        channels: channels
      },
    },
    function(error, response, body) {
      if (error) return console.error(`Error posting message to Slack ${error}`);
    });
};


const sendScreenshot = async(url, channels, name) => {
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
  postToChannel(buffer, channels, name);
};


module.exports = () => {
  const jobs = config.SCREENSHOT_STRING.split('|');
  jobs.map((job) => {
    const [url, channels, cronTime, name] = job.split(';');
    const fileName = `${name} ${moment().format("D-M")} report.png`;
    const myJob = new cron.CronJob({
      cronTime: cronTime,
      onTick: () => {
        sendScreenshot(url, channels, fileName);
      },
      start: true,
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  });
};
