var config = require('./config/config');
var callNextTick = require('call-next-tick');
var Twit = require('twit');
var async = require('async');
var probable = require('probable');
var postTweetChain = require('post-tweet-chain');
var getExclamation = require('./get-exclamation');

var dryRun = false;
if (process.argv.length > 2) {
  dryRun = (process.argv[2].toLowerCase() == '--dry');
}

var twit = new Twit(config.twitter);

async.waterfall(
  [
    getExclamation,
    postTweet
  ],
  wrapUp
);

function postTweet(text, done) {
  if (dryRun) {
    console.log('Would have tweeted:', text);
    callNextTick(done);
  }
  else {
    var opts = {
      twit: twit,
      parts: text
    };
    postTweetChain(opts, done);
  }
}

function wrapUp(error, data) {
  if (error) {
    console.log(error, error.stack);

    if (data) {
      console.log('data:', data);
    }
  }
  else {
    // Technically, the user wasn't replied to, but good enough.
    // lastTurnRecord.recordTurn(callOutId, new Date(), reportRecording);
  }
}
