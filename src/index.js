var Immutable = require('immutable');
var _ = require('underscore');
var math = require('mathjs');
var constants = require('./constants.json');

var STAKE = constants.stake;
var ALPHA = constants.alpha;
var BETA = constants.beta;
var ROUND_TO = constants.roundTo;

module.exports = {
  evaluate: evaluate
}

function evaluate(params) {
  var uid = params.uid;
  var value = params.value;
  var evaluators = params.evaluators;
  var evaluations = params.evaluations;
  var systemRep = params.systemRep;

  var iMap = Immutable.Map({ 
    newRep: 0,
    voteRep: 0,
    systemRep: systemRep
  });

  evaluators = addVoteValueToEvaluators(evaluators, evaluations);
  iMap = iMap.set('newRep', getCurrentUserFrom(evaluators, uid).reputation);
  iMap = iMap.set('voteRep', getVoteRep(evaluators, value));


  evaluators = updateSameEvaluatorsRep(evaluators, iMap.get('newRep'), iMap.get('systemRep'), iMap.get('voteRep'), value, uid);

  evaluators = updateEvaluatorsRep(evaluators, iMap.get('newRep'), iMap.get('systemRep'));

  evaluators = cleanupEvaluators(evaluators);

  return evaluators;
}

function addVoteValueToEvaluators(evaluators, evaluations) {
  return _.map(evaluators, function(evaluator) {
    evaluator.value = _.find(evaluations, function(evaluation) {
      return evaluation.userId === evaluator.id;
    }).value;
    
    return evaluator;
  });
}

function getVoteRep(evaluators, value) {
  var toAdd = 0;
  return _.reduce(evaluators, function(memo, evaluator) {
    toAdd = evaluator.value === value ? evaluator.reputation : 0;
    return memo + toAdd;
  }, 0);
}

function getCurrentUserFrom(evaluators, currentUserId) {
  return _.find(evaluators, function(evaluator) {
    return evaluator.id === currentUserId;
  });
}

function burnStakeForCurrentUser(currentUserRep) {
  var toMultiply = math.subtract(1, STAKE);
  return math.multiply(currentUserRep, toMultiply);
}

function cleanupEvaluators(evaluators) {
  return _.map(evaluators, function(evaluator) {
    evaluator.reputation = round(evaluator.reputation)
    evaluator = _.omit(evaluator, 'value');
    return evaluator;
  });
}

function getSameEvaluatorsAddValue(newRep, factor, evaluatorRep, voteRep) {
  return math.chain(newRep)
                .multiply(STAKE)
                .multiply(factor)
                .multiply(evaluatorRep)
                .divide(voteRep)
                .done();
}

function updateSameEvaluatorsRep(evaluators, newRep, systemRep, voteRep, currentEvaluationValue, currentUserId) {
  var toAdd;
  var factor = math.pow(math.divide(voteRep, systemRep), ALPHA);
  return _.map(evaluators, function(evaluator) {

    if ( evaluator.id === currentUserId ) {
      toAdd = getSameEvaluatorsAddValue(newRep, factor, newRep, voteRep)
      evaluator.reputation = math.add(burnStakeForCurrentUser(newRep), toAdd);
    }

    else if ( evaluator.value === currentEvaluationValue ) {
      toAdd = getSameEvaluatorsAddValue(newRep, factor, evaluator.reputation, voteRep)
      evaluator.reputation = math.add(evaluator.reputation, toAdd);
    }


    return evaluator;
  });
}

function updateEvaluatorsRep(evaluators, currentUserRep, systemRep) {
  var factor = math.pow(math.divide(currentUserRep, systemRep), BETA);
  var toDivide = math.chain(1)
                        .subtract(math.multiply(STAKE, factor))
                        .done();

  return _.map(evaluators, function(evaluator) {
    evaluator.reputation = math.divide(evaluator.reputation, toDivide);
    return evaluator;
  });

}

function cleanupEvaluators(evaluators) {
  return _.map(evaluators, function(evaluator) {
    evaluator.reputation = round(evaluator.reputation);
    evaluator = _.omit(evaluator, 'value');
    return evaluator;
  });
}

function round(n) {
  return math.round(n, ROUND_TO);
}