var APP_ID = "amzn1.ask.skill.76b3bc0d-1f13-4be7-9754-272f28de3ba5";
var Alexa = require('alexa-sdk');
var http = require('http');

var constants = require('./constants');
var states = {
  FEATUREDMODE: '_FEATUREDMODE',
};

var numberOfResults = 3;
var output = "";
var tag = "<p>Tags:";
var tags = "Tags:";
var slotValue;
var alexa;
var questions = [];
var responseData;
var custom = false;

var handlers = {
  'LaunchRequest': function () {
    output = constants.welcomeMessage + constants.hearMoreMessage;
    this.emit(':ask', output, constants.welcomeRepromt);
  },
  'getFeaturedQuestionsIntent': function () {
    custom = false;
    questions = [];
    httpGet(function (response) {
      responseData = response;
      var cardContent = constants.dataProvidedMessage;
      if (responseData == null) {
        output = constants.dataErrorMessage;
      }
      else {
        output = constants.questionIntroMessage;

        for (var i = 0; i < numberOfResults; i++) {
          var title = responseData[i].title;
          var answer = responseData[i].answer;
          if (answer.includes(tag)) {
            answer = answer.slice(0, answer.indexOf(tag));
          } else if (answer.includes(tags)) {
            answer = answer.slice(0, answer.indexOf(tags));
          }
          var index = i + 1;

          output += " Number " + index + ": " + title + ";";

          cardContent += " Number " + index + ".\n";
          cardContent += title + ".\n\n";
          currentQuestion = { "number": index, "title": title, "answer": answer};
          questions.push(currentQuestion);
        }

        output += constants.getMoreInfo;
      }

      var cardTitle = "Featured Questions";
      alexa.emit(':askWithCard', output, constants.getMoreInfo, cardTitle, output);
    });
  },
  'getMoreInfoIntent': function () {
    slotValue = this.event.request.intent.slots.question.value;
    var index = parseInt(slotValue) - 1;

    var selectedQuestion = questions[index];
    if (selectedQuestion) {
      output = selectedQuestion.title + ". " + selectedQuestion.answer + ". " + constants.hearMoreMessage;
      var cardTitle = selectedQuestion.title;
      var cardContent = selectedQuestion.title + constants.newline + constants.newline + selectedQuestion.answer;
      this.emit(':askWithCard', output, constants.hearMoreMessage, cardTitle, cardContent);
    } else {
      this.emit(':ask', constants.noQuestionErrorMessage);
    }
  },
  'getAnswerIntent': function () {
    slotValue = this.event.request.intent.slots.Reply.value;
    custom = true;
    questions = [];
    httpGet(function(response) {
      responseData = response;
      var cardContent = constants.dataProvidedMessage;
      if (responseData == null) {
        output = constants.dataErrorMessage;
      }
      else {
        output = constants.answerIntroMessage;
        for (var i = 0; i < numberOfResults; i++) {
          var title = responseData[i].title;
          var answer = responseData[i].answer;
          if (answer.includes(tag)) {
            answer = answer.slice(0, answer.indexOf(tag));
          } else if (answer.includes(tags)) {
            answer = answer.slice(0, answer.indexOf(tags));
          }
          var index = i + 1;

          output += " Number " + index + ": " + title + ";";

          cardContent += " Number " + index + ".\n";
          cardContent += title + ".\n\n";
          currentQuestion = { "number": index, "title": title, "answer": answer};
          questions.push(currentQuestion);
        }
        output += constants.getMoreInfo;
      }
      var cardTitle = "Ask LS";
      alexa.emit(':askWithCard', output, constants.getMoreInfo, cardTitle, output);
    });
  },
  'AMAZON.YesIntent': function () {
    output = constants.helpMessage;
    this.emit(':ask', output, constants.helpMessage);
  },
  'AMAZON.NoIntent': function () {
    output = constants.helpMessage;
    this.emit(':ask', output, constants.helpMessage);
  },
  'AMAZON.HelpIntent': function () {
    output = constants.helpMessage;
    this.emit(':ask', output, constants.helpMessage);
  },
  'AMAZON.RepeatIntent': function () {
    this.emit(':ask', output, constants.helpMessage);
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', constants.goodbyeMessage);
  },
  'AMAZON.CancelIntent': function () {
    this.emit(":tell", constants.goodbyeMessage);
  },
  'SessionEndedRequest': function () {
    this.emit('AMAZON.StopIntent');
  },
  'Unhandled': function () {
    output = constants.welcomeRepromt;
    this.emit(':ask', output, constants.welcomeRepromt);
  },
};

exports.handler = function (event, context, callback) {
  alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};

function httpGet(callback) {
  var query = slotValue ? slotValue.split(' ').join('%20') : '';
  var path = custom ? '/api/v1/questions?phrase='+query : '/api/v1/questions?featured=true';

  http.get({
    host: 'api.asklegalshield.com',
    path: path
  }, function(res) {
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function(d) {
      body += d;
    });

    res.on('end', function() {
      try {
        var parsed = JSON.parse(body);
      } catch (err) {
        return callback(err);
      }
      return callback(parsed);
    });
  }).on('error', function(err) {
    callback(err);
  });
}

String.prototype.trunc =
function (n) {
  return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
};
