var config = require('./config/config');
var createWordnok = require('wordnok').createWordnok;
var probable = require('probable');
var callNextTick = require('call-next-tick');
var getRandomVerbs = require('./get-random-verbs');
var WanderGoogleNgrams = require('wander-google-ngrams');
var createIsCool = require('iscool');
var async = require('async');
var getPrelude = require('./get-prelude');

var iscool = createIsCool();
var wordnok = createWordnok({
  apiKey: config.wordnikAPIKey
});

var exclamationTypeTable = probable.createTableFromDef({
  '0': 'object',
  '1': 'object-ngram-elaboration',
  '2-4': 'random-verb-ngram-elaboration'
});

function getExclamation(done) {
  getExclamationType(exclamationTypeTable.roll(), done);
}

function getExclamationType(type, done) {
  if (type === 'object') {
    async.waterfall(
      [
        wordnok.getTopic,
        formatObjectExclamation
      ],
      done
    );
  }
  else if (type === 'object-ngram-elaboration') {
    async.waterfall(
      [
        wordnok.getTopic,
        getElaborationForNoun,
        formatObjectExclamation
      ],
      done
    );
  }
  else {
    async.waterfall(
      [
        getRandomVerbs,
        pickAtRandom,
        getElaborationForVerb,
        formatVerbExclamation
      ],
      done
    );
  }
}

function getElaborationForNoun(word, done) {
  getNgramElaboration(word, false, done);
}

function getElaborationForVerb(word, done) {
  getNgramElaboration(word, true, done);
}

function getNgramElaboration(theWord, wordIsVerb, done) {
  var createWanderStream = WanderGoogleNgrams({
    wordnikAPIKey: config.wordnikAPIKey
  });

  var opts = {
    word: theWord,
    direction: 'forward',
    repeatLimit: 1,
    tryReducingNgramSizeAtDeadEnds: true,
    shootForASentence: true,
    maxWordCount: 20,
  };

  if (wordIsVerb) {
    opts.forwardStages = [
      {
        name: 'pushedVerb',
        needToProceed: ['noun', 'pronoun', 'noun-plural', 'adjective'],
        disallowCommonBadExits: true,
        lookFor: '*_NOUN',
        posShouldBeUnambiguous: true
      },
      {
        name: 'done'
      }
    ];
  }

  var stream = createWanderStream(opts);
  var phrase = theWord;

  stream.on('error', reportError);
  stream.on('end', passPhrase);
  stream.on('data', saveWord);

  function saveWord(word) {
    if (word !== theWord) {
      if (!iscool(word)) {
        console.log('Uncool word:', word);
      }
      else {
        phrase += ' ';
        phrase += word;
      }
    }
  }

  function reportError(error) {
    // Don't stop everything for a stream error.
    console.log(error);
  }

  function passPhrase() {
    done(null, phrase);
  }
}

function pickAtRandom(things, done) {
  callNextTick(done, null, probable.pickFromArray(things));
}

function formatVerbExclamation(basePhrase, done) {
  var exclamation = getPrelude({
    foreshadowAction: true
  });
  callNextTick(done, null, exclamation + ' ' + basePhrase + '!');
}

function formatObjectExclamation(basePhrase, done) {
  callNextTick(done, null, getPrelude() + ' ' + basePhrase + '!');
}

module.exports = {
  getExclamation: getExclamation,
  getExclamationType: getExclamationType
};
