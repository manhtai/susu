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

module.exports = {
  randomInt,
  formatQuote,
  isSame
};
