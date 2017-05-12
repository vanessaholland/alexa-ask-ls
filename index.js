var Alexa = require('alexa-sdk');
var http = require('http');

var states = {
    FEATUREDMODE: '_FEATUREDMODE',
};

var numberOfResults = 3;

var welcomeMessage = "Welcome to Ask by Legal Shield.";

var welcomeRepromt = "To hear the top featured questions say featured questions, or for free access to more than 1,400 legal questions visit ask dot legal shield dot com or download our mobile app.";

var helpMessage = "For free access to more than 1,400 legal questions visit ask dot legal shield dot com or download our mobile app.";

var noQuestionErrorMessage = "There was an error finding this question, please try again."

var getMoreInfo = "You can tell me a number for more information. For example open number one.";

var goodbyeMessage = "Thank you for asking legal shield.";

var questionIntroMessage = "These are the top featured questions from Ask by Legal Shield.";

var answerIntroMessage = "These are the top matches from Ask by Legal Shield.";

var hearMoreMessage = "To hear the featured questions say featured questions, or to ask a question say... my question is... followed by your question.";

var newline = "\n";

var output = "";

var tag = "<p>Tags:";

var tags = "Tags:";

var slotValue;

var alexa;

var questions = [];

var responseData;

var custom = false;

var newSessionHandlers = {
    'LaunchRequest': function () {
        output = welcomeMessage + helpMessage;
        this.emit(':ask', output, welcomeRepromt);
    },
    'getAnswerIntent': function () {
        this.handler.state = states.FEATUREDMODE;
        this.emitWithState('getAnswerIntent');
    },
    'getFeaturedQuestionsIntent': function(){
        this.handler.state = states.FEATUREDMODE;
        this.emitWithState('getFeaturedQuestionsIntent');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(":tell", goodbyeMessage);
    },
    'SessionEndedRequest': function () {
        this.emit('AMAZON.StopIntent');
    },
    'Unhandled': function () {
        output = welcomeRepromt;
        this.emit(':ask', output, welcomeRepromt);
    },
};

var startFeaturedHandlers = Alexa.CreateStateHandler(states.FEATUREDMODE, {
  'getFeaturedQuestionsIntent': function () {
    custom = false;
    questions = [];
    httpGet(function (response) {
        responseData = response;
        var cardContent = "Data provided by LegalShield\n\n";
        if (responseData == null) {
            output = "There was a problem with getting data please try again";
        }
        else {
            output = questionIntroMessage;

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

            output += getMoreInfo;
        }

        var cardTitle = "Featured Questions";
        alexa.emit(':askWithCard', output, getMoreInfo, cardTitle, output);
    });
  },
  'getMoreInfoIntent': function () {
      slotValue = this.event.request.intent.slots.question.value;
      var index = parseInt(slotValue) - 1;

      var selectedQuestion = questions[index];
      if (selectedQuestion) {
          output = selectedQuestion.title + ". " + selectedQuestion.answer + ". " + hearMoreMessage;
          var cardTitle = selectedQuestion.title;
          var cardContent = selectedQuestion.title + newline + newline + selectedQuestion.answer;
          this.handler.state = states.FEATUREDMODE;
          this.emit(':askWithCard', output, hearMoreMessage, cardTitle, cardContent);
      } else {
          this.emit(':ask', noQuestionErrorMessage);
      }
    },
    'getAnswerIntent': function () {
      slotValue = this.event.request.intent.slots.Reply.value;
      custom = true;
      questions = [];
             httpGet(function(response) {
                 responseData = response;
                     var cardContent = "Data provided by LegalShield\n\n";
                     if (responseData == null) {
                         output = "There was a problem with getting data please try again";
                     }
                     else {
                         output = answerIntroMessage;
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
                         output += getMoreInfo;
                     }
                     var cardTitle = "Ask LS";
                     alexa.emit(':askWithCard', output, getMoreInfo, cardTitle, output);
              });
    },
    'AMAZON.YesIntent': function () {
        output = helpMessage;
        this.emit(':ask', output, helpMessage);
    },
    'AMAZON.NoIntent': function () {
        output = helpMessage;
        this.emit(':ask', helpMessage, helpMessage);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.HelpIntent': function () {
        output = HelpMessage;
        this.emit(':ask', output, helpMessage);
    },
    'AMAZON.RepeatIntent': function () {
        this.emit(':ask', output, helpMessage);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(":tell", goodbyeMessage);
    },
    'SessionEndedRequest': function () {
        this.emit('AMAZON.StopIntent');
    },
    'Unhandled': function () {
        output = welcomeRepromt;
        this.emit(':ask', output, welcomeRepromt);
    }
});

exports.handler = function (event, context, callback) {
    alexa = Alexa.handler(event, context);
    alexa.registerHandlers(newSessionHandlers, startFeaturedHandlers);
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
                console.log(parsed);
            } catch (err) {
                console.error('Unable to parse response as JSON', err);
                return callback(err);
            }
            return callback(parsed);
        });
    }).on('error', function(err) {
        console.error('Error with the request:', err.message);
        callback(err);
    });
}

String.prototype.trunc =
      function (n) {
          return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
      };
