var config = require('./config/config');
var callNextTick = require('call-next-tick');
var Twit = require('twit');
var async = require('async');
var behavior = require('./behavior');
var shouldReplyToTweet = require('./should-reply-to-tweet');
var level = require('level');
var Sublevel = require('level-sublevel')

var dryRun = false;
if (process.argv.length > 2) {
  dryRun = (process.argv[2].toLowerCase() == '--dry');
}


var db = Sublevel(level(__dirname + '/data/aw-yea-responses.db'));
var lastReplyDates = db.sublevel('last-reply-dates');

var username = behavior.twitterUsername;

var twit = new Twit(config.twitter);
var streamOpts = {
  replies: 'all'
};
var stream = twit.stream('user', streamOpts);

stream.on('tweet', respondToTweet);
stream.on('error', logError);

function respondToTweet(incomingTweet) {
  async.waterfall(
    [
      checkIfWeShouldReply,
      composeReply,
      postTweet,
      recordThatReplyHappened
    ],
    wrapUp
  );

  function checkIfWeShouldReply(done) {
    var opts = {
      tweet: incomingTweet,
      lastReplyDates: lastReplyDates
    };
    shouldReplyToTweet(opts, done);
  }  

  function composeReply(done) {
    var text = '@' + incomingTweet.user.screen_name + ' I am replying! ';
    callNextTick(done, null, text);
  }

  function postTweet(text, done) {
    if (dryRun) {
      console.log('Would have tweeted:', text);
      var mockTweetData = {
        user: {
          id_str: 'mockuser',        
        }
      };
      callNextTick(done, null, mockTweetData);
    }
    else {
      var body = {
        status: text,
        in_reply_to_status_id: incomingTweet.id_str
      };
      twit.post('statuses/update', body, done);
    }
  }

  function recordThatReplyHappened(tweetData, response, done) {
    console.log('Put:', incomingTweet.user.id_str);

    lastReplyDates.put(incomingTweet.user.id_str, tweetData.created_at, done);
  }
}

function wrapUp(error, data) {
  if (error) {
    console.log(error, error.stack);

    if (data) {
      console.log('data:', data);
    }
  }
}

function logError(error) {
  console.log(error);
}
