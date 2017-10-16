'use strict';

const puppeteer = require('puppeteer');
const moment = require('moment');


const getScreenShot = async(url, clip, timeout = 1000) => {
  console.log("Start getting screenshot...", url, clip, timeout);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  page.setViewport({
    width: 2048,
    height: 1536
  });
  await page.goto(url, {
    waitUntil: "networkidle",
    networkIdleTimeout: timeout
  });
  await page.waitFor(timeout);
  const buffer = await page.screenshot({
    clip
  });
  await browser.close();
  console.log("End getting screenshot...");
  return buffer;
};


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



module.exports = {
  randomInt,
  formatQuote,
  isSame,
  getScreenShot,
  preciseDiff
};
