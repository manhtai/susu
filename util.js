'use strict';


function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}


function formatQuote (quote) {
    return '*' + quote.content + '*\n  _~ ' + quote.author + '_';
}


function isSame (w1, w2) {
    if (!(typeof(w1) == 'string' && typeof(w2) == 'string')) return false;
    return w1.toLowerCase().indexOf(w2.toLowerCase()) === 0;
}


// a and b are javascript Date objects
function dateDiffInDays(a, b) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}


module.exports = {
  randomInt,
  formatQuote,
  isSame,
  dateDiffInDays
};
