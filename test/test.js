var _ = require('underscore');
var chakram = require('chakram');
expect = chakram.expect;
var scenarios = require('./scenarios.json');
var protocol = require('../src');

describe('evaluate', function() {
  var evaluators = [];

  it('should run step 1', function () {
    var step1 = getStep(1);
    evaluators = protocol.evaluate(step1);
    expect(evaluators[0].reputation).to.be.equal(0.197676);
  });

  it('should run step 2', function () {
    var step2 = getStep(2);
    evaluators = protocol.evaluate(step2);
    expect(evaluators[0].reputation).to.be.equal(0.200938);
    expect(evaluators[1].reputation).to.be.equal(0.197686);
  });

  it('should run step 3', function () {
    var step3 = getStep(3);
    evaluators = protocol.evaluate(step3);
    expect(evaluators[0].reputation).to.be.equal(0.198631);
  });

  it('should run step 4', function () {
    var step4 = getStep(4);
    evaluators = protocol.evaluate(step4);
    expect(evaluators[0].reputation).to.be.equal(0.205115);
    expect(evaluators[1].reputation).to.be.equal(0.200952);
    expect(evaluators[2].reputation).to.be.equal(0.196364);
  });

});

// Clones the scneraio so it won't mutate with each test run
function getStep(n) {
  return JSON.parse(JSON.stringify(scenarios))[n];
}