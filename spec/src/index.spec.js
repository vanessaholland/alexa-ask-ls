var index = require('../../src/index'),
    framework = require('../alexa-test-framework'),
    intent = framework.intent,
    session = framework.session,
    response = framework.response;

function getEvent(fileName) {
  let event = require(`../json/requests/${fileName}`);
  return event;
}

describe('index', function() {
    it('LaunchRequest', function() {
        var launch = index.handler(getEvent('launchRequestTest.json'));
        console.log(launch);
        expect(launch).toEqual('Welcome to Ask by Legal Shield. To hear the top featured questions say featured questions, or for free access to more than 1,400 legal questions visit ask dot legal shield dot com or download our mobile app. ')
    });
});
