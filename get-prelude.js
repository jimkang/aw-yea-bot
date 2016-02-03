var probable = require('probable');

var preludes = [
  'Aw yea',
  'Aw yis',
  'Awwww yea',
  'YIS',
  'Aw hell yeah'
];

var actionForeshadowers = probable.createTableFromDef({
  '0-2': "I'm gonna",
  '3': 'time to',
  '4': 'gonna',
  '5-6': "I'm"
});

function getPrelude(opts) {
  var foreshadowAction;

  if (opts) {
    foreshadowAction = opts.foreshadowAction;
  }

  var prelude = probable.pickFromArray(preludes);
  if (foreshadowAction) {
    prelude += ' ' + actionForeshadowers.roll();
  }

  return prelude;
}

module.exports = getPrelude;
