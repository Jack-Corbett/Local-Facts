const Alexa = require('ask-sdk-core');

// TODO: Add a launch handler

const GetNewFactHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    // If it is a launch request or they are asking for a fact handle it
    return request.type === 'LaunchRequest' || (request.type === 'IntentRequest' && request.intent.name === 'GetNewFactIntent');
  },
  handle(handlerInput) {
    console.log("Processing fact request");
    // TODO: Fetch a fact based on the users location
    // Get a random fact
    const randomFact = facts[Math.floor(Math.random()*facts.length)];

    return handlerInput.responseBuilder
      .speak(randomFact)
      .reprompt(helpReprompt)
      .withSimpleCard(skillName, randomFact)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(helpMessage)
      .reprompt(helpReprompt)
      .getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(fallbackMessage)
      .reprompt(fallbackReprompt)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && (request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(stopMessage)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    return handlerInput.responseBuilder
      .speak(errorMessage)
      .reprompt(errorMessage)
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetNewFactHandler,
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

const skillName = 'Local Facts';

const welcomeMessage = 'Welcome to local facts! You can say tell me a local fact to find out about your local area.';
const helpMessage = 'You can say tell me a local fact, or, you can say exit... What can I help you with?';
const helpReprompt = 'What can I help you with?';
const fallbackMessage = 'The Local Facts skill can\'t help you with that. It can help you discover facts about your local area if you say tell me a local fact. What can I help you with?';
const fallbackReprompt = 'What can I help you with?';
const errorMessage = 'Sorry, an error occurred.';
const stopMessage = 'Goodbye!';

const facts = [
  'The New Forest is one of Britains newest and smallest national parks with an area of 218 square miles.',
  'Hampshire is the birthplace of Jane Austen and Charles Dickens.',
  'Southampton is the home of the Spitfire Aircraft which was designed by R.J. Mitchell.',
  'Southampton was the first town in Britain to sample fish fingers in 1955.',
  'The first Sherlock Holmes story was written in Southsea by Sir Arthur Conan-Doyle.'
];
