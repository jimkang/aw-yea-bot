var config = require('./config/config');
var createWordnok = require('wordnok').createWordnok;
var async = require('async');
var probable = require('probable');

var wordnok = createWordnok({
  apiKey: config.wordnikAPIKey
});

function getRandomVerbs(done) {
  var randomWordsOpts = {
    customParams: {
      includePartOfSpeech: 'verb',
      minLength: 2
    }
  };

  wordnok.getRandomWords(randomWordsOpts, canonicalizeWords);

  function canonicalizeWords(error, words) {
    if (error) {
      done(error);
    }
    else if (!words || words.length < 1) {
      wordnok.getRandomWords(randomWordsOpts, pickWord);
    }
    else {
      var shuffled = probable.shuffle(words);
      // console.log('words', shuffled);
      async.map(
        words.map((word) => { return {word: word}; }),
        wordnok.canonicalize,
        done
      );
    }
  }
}

module.exports = getRandomVerbs;
