var config = require('./config/config');
var callNextTick = require('call-next-tick');
var betterKnowATweet = require('better-know-a-tweet');
var async = require('async');
var behavior = require('./behavior');

var username = behavior.twitterUsername;

// Passes an error if you should not reply.
function shouldReplyToTweet(opts, done) {
  var tweet;
  var lastReplyDates;
  var waitingPeriod;

  if (opts) {
    tweet = opts.tweet;
    lastReplyDates = opts.lastReplyDates;
  }

  if (tweet.user.screen_name === username) {
    callNextTick(done, new Error('Subject tweet is own tweet.'));
    return;
  }

  if (betterKnowATweet.isRetweetOfUser(username, tweet)) {
    callNextTick(done, new Error('Subject tweet is own retweet.'));
    return;
  }

  var tweetMentionsBot = doesTweetMentionBot(tweet);
  debugger;

  if (behavior.chimeInUsers &&
    behavior.chimeInUsers.indexOf(tweet.user.screen_name) !== -1 &&
    !tweetMentionsBot) {

    // Chiming in.
    waitingPeriod = behavior.hoursToWaitBetweenChimeIns;
  }
  else if (tweetMentionsBot) {
    // Replying.
    waitingPeriod = behavior.hoursToWaitBetweenRepliesToSameUser;
  }
  else {
    callNextTick(done, new Error('Not chiming in or replying.'));
    return;
  }

  async.waterfall(
    [
      goFindLastReplyDate,
      replyDateWasNotTooRecent
    ],
    done
  );

  function goFindLastReplyDate(done) {
    findLastReplyDateForUser(tweet, done);
  }

  function findLastReplyDateForUser(tweet, done) {
    console.log('Get:', tweet.user.id_str);
    lastReplyDates.get(tweet.user.id_str, passLastReplyDate);

    function passLastReplyDate(error, dateString) {
      debugger;
      var date;
      // Don't pass on the error – `whenWasUserLastRepliedTo` can't find a
      // key, it returns a NotFoundError. For us, that's expected.
      if (error && error.type === 'NotFoundError') {
        error = null;
        date = new Date(0);
      }
      else {
        date = new Date(dateString);
      }
      done(error, tweet, date);
    }
  }

  function replyDateWasNotTooRecent(tweet, lastReplyDate, done) {
    debugger;
    var hoursElapsed = (Date.now() - lastReplyDate.getTime())/(60 * 60 * 1000);

    if (hoursElapsed >= waitingPeriod) {
      done();
    }
    else {
      done(new Error(
        `Replied ${hoursElapsed} hours ago to ${tweet.user.screen_name}.
        Need at least ${waitingPeriod} to pass.`
      ));
    }
  }
}

function doesTweetMentionBot(tweet) {
  var usernames = betterKnowATweet.whosInTheTweet(tweet).map(lowerCase);
  return !usernames || usernames.indexOf(username.toLowerCase()) !== -1;
}

function lowerCase(s) {
  return s.toLowerCase();
}

module.exports = shouldReplyToTweet;
