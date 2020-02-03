const Alexa = require('ask-sdk-core');
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

      // Fetch the users counts
      const county = address.stateOrRegion;
      var response = "";

      if (county && facts.hasOwnProperty(county)) {
        // Get a random fact based on the user's county
        response = facts[county][Math.floor(Math.random()*5)];
      } else {
        // Otherwise advise the user to check their device location in the app
        response = messages.COUNTY_ERROR;
      }
      
      return responseBuilder
        .speak(response + " County: " + county)
        .reprompt(messages.HELP_REPROMPT)
        .withSimpleCard(skillName, response)
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

// Import that facts for each county from the data file
const facts = {
  Hampshire: [
    'The New Forest is one of Britains newest and smallest national parks with an area of 218 square miles.',
    'Hampshire is the birthplace of Jane Austen and Charles Dickens.',
    'Southampton is the home of the Spitfire Aircraft which was designed by R.J. Mitchell.',
    'Southampton was the first town in Britain to sample fish fingers in 1955.',
    'The first Sherlock Holmes story was written in Southsea by Sir Arthur Conan-Doyle.'
  ],
  London: [
    'Big Ben is actually meant to be called ‘The Clock Tower’, while ‘Big Ben’ is the name of the bell.',
    'The identity of Jack the Ripper, London’s most notorious serial killer, has never been discovered.',
    'Charles II’s ordered for six ravens to be placed in the Tower of London to protect it. Apparently, six ravens are still kept in the tower today and they must remain there at all times due to superstitious reasons.',
    'When the London Underground was first proposed, engineers suggested filling the tunnels with water and using barges to float people from station to station',
    'Feeding Pigeons in Trafalgar Square has been banned since 2003.'
  ],
  Bedfordshire: [
    'Catherine of Aragon, one time wife of Henry VIII was imprisoned in the county before their marriage was annulled',
    'Britain’s longest town is said to be in Bedfordshire? Arlesey’s main street is three miles long.',
    'The worlds first tractors were created in Biggleswade by a man called Daniel Albone.',
    'St Paul’s church in Bedford was used to broadcast the BBC’s daily service during the second world war.',
    'The first ever performance recognised as a play in England was written in Dunstable. It was written by Geoffrey de Gorham who staged it at Dunstable Priory'
  ],
  Buckinghamshire: [
    'Stoke Mandeville Hospital in Aylesbury is internationally known for its treatment of spinal-cord injuries and has hosted the World Stoke Mandeville Wheelchair Games.',
    'The name Buckinghamshire is Anglo-Saxon in origin and means ‘the district of Bucca’s home’, Bucca being an Anglo-Saxon landowner.',
    'Waddesdon Manor was built for Baron de Rothschild in 1874 to display his outstanding collection of art treasures.',
    'The former home of Florence Nightingale is near Waddesdon in Claydon.',
    'Hell-Fire Caves are tunnels that were dug by hand and were once a haunt of the notorious Hellfire club!'
  ],
  Cambridgeshire: [
    'Lord Byron kept a bear in his rooms when he was a student at Trinity College. Apparently he was annoyed by the rule that students were not allowed to keep dogs at the university.',
    'Oliver Cromwell’s head is buried in Cambridge in a secret location.',
    'The university library has over 29 million books and receives a free copy of every book published in the UK',
    'The first official football game using the ‘Cambridge Rules’ was played on Parker’s Piece in 1848 – this formed the basis of the Football Association’s rules drawn up in 1863.',
    'n 1958, Cambridge engineering students managed to get an Austin Seven car on the roof of Senate House. It took the university a week to remove it.'
  ],
  Cheshire: [
    'Sir Arthur Aston of Catton Hall, near Frodsham, was declared by Charles I to be more feared by the enemy than any other man in his army.',
    'The Packhorse Bridge over the River Dane at Three Shires Head is where Cheshire, Derbyshire and Staffordshire all meet.',
    'Legend has it that Rostherne Mere is bottomless. Another legend tells of a workman who cursed a church bell as it was being conveyed to Rostherne St Mary’s – at which point the bell came loose and knocked the man into the mere where he drowned.',
    'St Oswald’s Church at Lower Peover is home to a big oak chest which for many years housed parish records, vicars’ robes, chalices and church documents. Local legend has it that if a girl wished to be a farmer’s wife she must be able to lift the chest lid with one arm.',
    'The first person to walk across Chester’s Grosvenor Bridge was a young Princess Victoria.'
  ],
  Cornwall: [
    'Cornwall is the most southwest county of Great Britain.',
    'Cornwall boasts the longest coastline in Great Britain, extending 433 miles.',
    'A team of bakers from Bodmin, Cornwall, hold the record for baking the biggest Cornish pasty.  It weighed 1900 pounds and had a whopping 1,750,000 calories.',
    'Truro is the only city in Cornwall, which is also the administrative center.',
    'In the 1900’s, half of the world’s tin came from Cornwall.'
  ],
  Cumbria: [
    
  ]
  /*
  
  Derbyshire
  Devon
  Dorset
  Durham
  East Sussex
  Essex
  Gloucestershire
  Greater London
  Greater Manchester
  Hertfordshire
  Kent
  Lancashire
  Leicestershire
  Lincolnshire
  Merseyside
  Norfolk
  North Yorkshire
  Northamptonshire
  Northumberland
  Nottinghamshire
  Oxfordshire
  Shropshire
  Somerset
  South Yorkshire
  Staffordshire
  Suffolk
  Surrey
  Tyne and Wear
  Warwickshire
  West Midlands
  West Sussex
  West Yorkshire
  Wiltshire
  Worcestershire
  Flintshire
  Glamorgan
  Merionethshire
  Monmouthshire
  Montgomeryshire
  Pembrokeshire
  Radnorshire
  Anglesey
  Breconshire
  Caernarvonshire
  Cardiganshire
  Carmarthenshire
  Denbighshire
  Kirkcudbrightshire
  Lanarkshire
  Midlothian
  Moray
  Nairnshire
  Orkney
  Peebleshire
  Perthshire
  Renfrewshire
  Ross & Cromarty
  Roxburghshire
  Selkirkshire
  Shetland
  Stirlingshire
  Sutherland
  West Lothian
  Wigtownshire
  Aberdeenshire
  Angus
  Argyll
  Ayrshire
  Banffshire
  Berwickshire
  Bute
  Caithness
  Clackmannanshire
  Dumfriesshire
  Dumbartonshire
  East Lothian
  Fife
  Inverness
  Kincardineshire
  Kinross-shire
  */
};

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
  COUNTY_ERROR: 'I couldn\'t find any facts for your area. Make sure your device location is set in the Alexa app.',
  STOP: 'Goodbye!',
}

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