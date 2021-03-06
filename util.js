'use strict';

const request = require('request');
const moment  = require('moment-timezone');

const config  = require('./const');


const randomInt = (low, high) => Math.floor(Math.random() * (high - low) + low);

const formatQuote = (quote) => '*' + quote.content + '*\n  _~ ' + quote.author + '_';


const isSame = (w1, w2) => {
  if (!(typeof(w1) == 'string' && typeof(w2) == 'string')) return false;
  return w1.toLowerCase().indexOf(w2.toLowerCase()) === 0;
};


// a and b are javascript Date objects
const dateDiff = (a, b) => {
  const diff = moment.preciseDiff(a, b, true);
  const strings = [];
  if (diff.years) {}
  if (diff.months) {
    strings.push(`${diff.months} tháng`);
  }
  if (diff.days) {
    strings.push(`${diff.days} ngày`);
  }
  return ' '.join(strings);
};


// Copy from https://github.com/codebox/moment-precise-range/ becasue I can't use the package
const STRINGS = {
  nodiff: '',
  year: 'year',
  years: 'years',
  month: 'month',
  months: 'months',
  day: 'day',
  days: 'days',
  hour: 'hour',
  hours: 'hours',
  minute: 'minute',
  minutes: 'minutes',
  second: 'second',
  seconds: 'seconds',
  delimiter: ' '
};


const pluralize = (num, word) => {
  return num + ' ' + STRINGS[word + (num === 1 ? '' : 's')];
};


const buildStringFromValues = (yDiff, mDiff, dDiff, hourDiff, minDiff, secDiff) => {
  var result = [];

  if (yDiff) {
    result.push(pluralize(yDiff, 'year'));
  }
  if (mDiff) {
    result.push(pluralize(mDiff, 'month'));
  }
  if (dDiff) {
    result.push(pluralize(dDiff, 'day'));
  }
  if (hourDiff) {
    result.push(pluralize(hourDiff, 'hour'));
  }
  if (minDiff) {
    result.push(pluralize(minDiff, 'minute'));
  }
  if (secDiff) {
    result.push(pluralize(secDiff, 'second'));
  }

  return result.join(STRINGS.delimiter);
};


const buildValueObject = (yDiff, mDiff, dDiff, hourDiff, minDiff, secDiff, firstDateWasLater) => {
  return {
    "years": yDiff,
    "months": mDiff,
    "days": dDiff,
    "hours": hourDiff,
    "minutes": minDiff,
    "seconds": secDiff,
    "firstDateWasLater": firstDateWasLater
  }
};


const preciseDiff = (d1, d2, returnValueObject) => {
  var m1 = moment(d1),
    m2 = moment(d2),
    firstDateWasLater;
  m1.add(m2.utcOffset() - m1.utcOffset(), 'minutes'); // shift timezone of m1 to m2
  if (m1.isSame(m2)) {
    if (returnValueObject) {
      return buildValueObject(0, 0, 0, 0, 0, 0, false);
    } else {
      return STRINGS.nodiff;
    }
  }
  if (m1.isAfter(m2)) {
    var tmp = m1;
    m1 = m2;
    m2 = tmp;
    firstDateWasLater = true;
  } else {
    firstDateWasLater = false;
  }

  var yDiff = m2.year() - m1.year();
  var mDiff = m2.month() - m1.month();
  var dDiff = m2.date() - m1.date();
  var hourDiff = m2.hour() - m1.hour();
  var minDiff = m2.minute() - m1.minute();
  var secDiff = m2.second() - m1.second();

  if (secDiff < 0) {
    secDiff = 60 + secDiff;
    minDiff--;
  }
  if (minDiff < 0) {
    minDiff = 60 + minDiff;
    hourDiff--;
  }
  if (hourDiff < 0) {
    hourDiff = 24 + hourDiff;
    dDiff--;
  }
  if (dDiff < 0) {
    var daysInLastFullMonth = moment(m2.year() + '-' + (m2.month() + 1), "YYYY-MM").subtract(1, 'M').daysInMonth();
    if (daysInLastFullMonth < m1.date()) { // 31/01 -> 2/03
      dDiff = daysInLastFullMonth + dDiff + (m1.date() - daysInLastFullMonth);
    } else {
      dDiff = daysInLastFullMonth + dDiff;
    }
    mDiff--;
  }
  if (mDiff < 0) {
    mDiff = 12 + mDiff;
    yDiff--;
  }

  if (returnValueObject) {
    return buildValueObject(yDiff, mDiff, dDiff, hourDiff, minDiff, secDiff, firstDateWasLater);
  } else {
    return buildStringFromValues(yDiff, mDiff, dDiff, hourDiff, minDiff, secDiff);
  }
};
// End copy


function hookMessageToSlack(channel, message) {
  let body = {
    username: config.SLACK_NAME
  };

  if (typeof(message) == 'string') {
    body.text = message;
  } else {
    body = { ...body, ...message };
  }

  if (channel) body.channel = channel;

  request.post({
    url: config.SLACK_WEBHOOK,
    json: true,
    body: body,
  }, function(error) {
    if (error) {
      return console.error('Error posting message to Slack: ', error, message);
    }
  });
  console.info(`Post to slack: ${JSON.stringify(body)}`);
}


function postMessageToSlack(channel, message) {
    const postMessageAPI = "https://slack.com/api/chat.postMessage";
    const token = config.api_token;
    console.log(`Send message ${message} to ${channel}`);
    request.post({
        url: postMessageAPI,
        formData: {
            username: config.SLACK_NAME,
            icon_url: "https://avatars.slack-edge.com/2017-11-10/269430428768_35c509a623199c63fa8d_512.jpg",
            token: token,
            text: message,
            channel: channel
        },
      },
      (error, response, body) => {
          console.log(body);
    });
}


module.exports = {
  randomInt,
  formatQuote,
  isSame,
  preciseDiff,
  postMessageToSlack,
  hookMessageToSlack
};
