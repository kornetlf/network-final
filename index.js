'use strict';

var Alexa = require('alexa-sdk');
var GoogleMapsAPI = require('googlemaps');

var APP_ID = 'amzn1.ask.skill.c05b98e6-66ae-4336-8f22-4dad24c8adf4';
var SKILL_NAME = 'Route Planner';

var configurations = {
  key: 'AIzaSyAL-_ofZlAfrDUU_QtU8PdSGXSyH4dFtFs', // Acquired from registering for Google API
  stagger_time:       50,
  encode_polylines:   false,
  secure:             true,
};

var googleMaps = new GoogleMapsAPI(configurations);

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

var handlers = {
  'LaunchRequest': function () {
    console.log("went in newsession function");

    this.attributes['speechOutput'] = 'Welcome to ' + SKILL_NAME + '. Ask me a question like how far away is McDonalds? Which destination would you like to know the travel time to?';

    this.attributes['repromptSpeech'] = 'To get a distance, ask something like: how far away is Starbucks?';
    this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])

  },
  'RoutePlanner': function () {
    console.log("In route planning function");

    if (this.event.request.intent.slots.Start.value !== undefined && this.event.request.intent.slots.Destination.value !== undefined && this.event.request.intent.slots.Start.value.toLowerCase() === 'here') {
      var t = this;
      var origin = this.event.request.intent.slots.Start.value;
      var dest = this.event.request.intent.slots.Destination.value;

      console.log("Finding " + origin + " to " + dest);
      var paramaters = {
        origins: origin,
        destinations: dest,
        units: 'imperial'
      };

      googleMaps.distance(paramaters, function(err, res) {
        console.log("Err: "+err);
        console.log("Result: "+res);
        console.log("Status: "+res.status);

        var answer = res.rows[0].elements;

        if (answer[0].distance === undefined || answer[0].duration === undefined) {
          t.emit('Problem finding distance');
        } else {
          console.log("distance is: " + answer[0].distance.text);
          console.log("time is: " + answer[0].duration.text);
          var response = "The distance from " + paramaters.origins + " to " + paramaters.destinations + " is " + answer[0].distance.text + " and will take approximately " + answer[0].duration.text;
          self.emit(':tell', response);
        }

      });
    } else if (((this.event.request.intent.slots.Start.value === undefined || this.event.request.intent.slots.Start.value === "here") && this.event.request.intent.slots.Destination.value !== undefined) ){
      var t = this;
      console.log("Only Destination value provided");
      var dest = this.event.request.intent.slots.Destination.value;
      console.log("Finding distance to " + dest + " from current location");

      // Taken from google developers: https://developers.google.com/web/fundamentals/native-hardware/user-location/
      var startPos = null;
      var geoSuccess = function(position) {
        startPos = position;
      };
      var geoError = function(error) {
        console.log('Error occurred. Error code: ' + error.code);
      };

      navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
      // End of google developer code

      var paramaters = {
        origins: startPos, // Need this to be the current location
        destinations: dest,
        units: 'imperial'
      };

      googleMaps.distance(paramaters, function(err, res) {
        console.log("Err: "+err);
        console.log("Result: "+res);
        console.log("Status: "+res.status);

        var answer = res.rows[0].elements;

        if (answer[0].distance === undefined || answer[0].duration === undefined) {
          t.emit('Problem finding distance');
        } else {
          console.log("distance is: " + answer[0].distance.text);
          console.log("time is: " + answer[0].duration.text);
          var response = "The distance from " + paramaters.origins + " to " + paramaters.destinations + " is " + answer[0].distance.text + " and will take approximately " + answer[0].duration.text;
          self.emit(':tell', response);
        }

      });

    } else if (this.event.request.intent.slots.Start.value === "help" || this.event.request.intent.slots.Destination.value === "help"){
      console.log("help if logic");
      this.emit('HelpMe');
    }
    else{
      this.attributes['speechOutput'] = 'Welcome to ' + SKILL_NAME + '. I can tell you the driving distance to any location you desire. Ask a question like, how far away is Starbucks?';

      this.attributes['repromptSpeech'] = 'Ask a quiestion like, how far away is Starbucks?';
      this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
    }
  },
  'AMAZON.HelpIntent': function() {
    console.log("went in Amazon.HelpIntent");
    this.attributes['speechOutput'] = 'Ask a question like, how far away is Starbucks?';
    this.attributes['repromptSpeech'] = 'Ask a quiestion like, how far away is Starbucks?';
    this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
  },
  'AMAZON.StopIntent': function () {
    this.emit('SessionEndedRequest');
  },
  'AMAZON.CancelIntent': function () {
    this.emit('SessionEndedRequest');
  },
  'SessionEndedRequest':function () {
    this.emit(':tell', 'Goodbye!');
  },
  'Unhandled': function() {
    this.emit(':tell', 'I do not understand your request. Please try again.');
    this.emit('SessionEndedRequest');
  },
  'HelpMe': function() {
    console.log("went in HelpMe");
    this.attributes['speechOutput'] = 'Ask a question like, how far away is Starbucks?';
    this.attributes['repromptSpeech'] = 'Ask a question like, how long will it take me to get to McDonalds from here';
    this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
  }
};