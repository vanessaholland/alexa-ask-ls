var roleArn = 'arn:aws:iam::<YOUR AWS ACCOUNT ID>:role/lambda_dynamo';
var region = 'us-east-1';
/* DO NOT MAKE CHANGE BELOW THIS */
var AWS = require('aws-sdk');

function context() {
   var context = require('./context.json');
   context.done = function(error, result) {
       console.log('context.done');
       console.log(error);
       console.log(result);
       process.exit();
   }
   context.succeed = function(result) {
       console.log('context.succeed');
       console.log(result);
       process.exit();
   }
   context.fail = function(error) {
       console.log('context.fail');
       console.log(error);
       process.exit();
   }

   return context;

}

AWS.config.region = region;
var sts = new AWS.STS();
sts.assumeRole({
    RoleArn: roleArn,
    RoleSessionName: 'emulambda'
}, function(err, data) {
    if (err) { // an error occurred
        console.log('Cannot assume role');
        console.log(err, err.stack);
    } else { // successful response
        AWS.config.update({
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.sessionToken
        });
        var Module = require('module');
        var originalRequire = Module.prototype.require;
        Module.prototype.require = function(){
          if (arguments[0] === 'aws-sdk'){
            return AWS;
          } else {
            return originalRequire.apply(this, arguments);
          }
        };
        var lambda = require('../src/index.js');
        var event = require('./input.json');
        lambda.handler(event, context());
    }
});
