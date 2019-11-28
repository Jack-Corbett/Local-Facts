const Alexa = require('ask-sdk-core');

const skillName = 'Local Facts';

const messages = {
  WELCOME: 'Welcome to local facts!',
  HELP: 'You can say tell me a local fact, or, you can say exit... What can I help you with?',
  HELP_REPROMPT: 'What can I help you with?',
  FALLBACK: 'The Local Facts skill can\'t help you with that. It can help you discover facts about your local area if you say tell me a local fact.',
  FALLBACK_REPROMPT: 'What can I help you with?',
  NOTIFY_MISSING_PERMISSIONS: 'Please enable address permissions in the Amazon Alexa app to find out facts about your local area. Then start local facts again.',
  LOCATION_FAILURE: 'There was a problem getting your address, please try again later.',
  ERROR: 'Sorry, an error occurred.',
  STOP: 'Goodbye!',
}

const facts = [
  'The New Forest is one of Britains newest and smallest national parks with an area of 218 square miles.',
  'Hampshire is the birthplace of Jane Austen and Charles Dickens.',
  'Southampton is the home of the Spitfire Aircraft which was designed by R.J. Mitchell.',
  'Southampton was the first town in Britain to sample fish fingers in 1955.',
  'The first Sherlock Holmes story was written in Southsea by Sir Arthur Conan-Doyle.'
];

const PERMISSIONS = ['read::alexa:device:all:address'];

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === `LaunchRequest`;
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(messages.WELCOME)
      .reprompt(messages.HELP)
      .getResponse();
  },
};

const GetNewFactHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope
    return request.type === 'IntentRequest' && request.intent.name === 'GetNewFactIntent';
  },
  async handle(handlerInput) {
    const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;
    
    const consentToken = requestEnvelope.context.System.user.permissions
      && requestEnvelope.context.System.user.permissions.consentToken;
    
    if (!consentToken) {
      return responseBuilder
        .speak(messages.NOTIFY_MISSING_PERMISSIONS)
        .withAskForPermissionsConsentCard(PERMISSIONS)
        .getResponse();
    } 
    try {
      const { deviceId } = requestEnvelope.context.System.device;
      const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();
      const address = await deviceAddressServiceClient.getFullAddress(deviceId);

      console.log('Address successfully retrieved, now responding to user.');

      // TODO: Fetch a fact based on the users location
      // Currently get a random fact
      const randomFact = facts[Math.floor(Math.random()*facts.length)];

      return responseBuilder
        .speak(randomFact + " County: " + address.stateOrRegion)
        .reprompt(messages.HELP_REPROMPT)
        .withSimpleCard(skillName, randomFact)
        .getResponse();
    } catch (error) {
      if (error.name !== 'ServiceError') {
        return responseBuilder 
          .speak(messages.ERROR)
          .reprompt(messages.ERROR)
          .getResponse();
      }
      throw error;
    }
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(messages.HELP)
      .reprompt(messages.HELP_REPROMPT)
      .getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(messages.FALLBACK)
      .reprompt(messages.FALLBACK_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope
    return request.type === 'IntentRequest' && (request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(messages.STOP)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const GetAddressError = {
  canHandle(handlerInput, error) {
    return error.name === 'ServiceError';
  },
  handle(handlerInput, error) {
    if (error.statusCode === 403) {
      return handlerInput.responseBuilder
        .speak(messages.NOTIFY_MISSING_PERMISSIONS)
        .withAskForPermissionsConsentCard(PERMISSIONS)
        .getResponse();
    }
    return handlerInput.responseBuilder
      .speak(messages.LOCATION_FAILURE)
      .reprompt(messages.LOCATION_FAILURE)
      .getResponse();
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
      .speak(messages.ERROR)
      .reprompt(messages.ERROR)
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    GetNewFactHandler,
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler, GetAddressError)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();