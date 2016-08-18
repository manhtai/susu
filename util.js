function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function formatQuote (quote) {
    return '*' + quote.content + '*\n  _~ ' + quote.author + '_';
}

module.exports = {
  randomInt: randomInt,
  formatQuote: formatQuote
};
