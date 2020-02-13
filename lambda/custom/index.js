const Alexa = require('ask-sdk-core');
const PERMISSIONS = ['read::alexa:device:all:address'];

// Start a session
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

// Tell the user a local fact based on their address
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
        .withShouldEndSession(true)
        .getResponse();
    } 
    try {
      const { deviceId } = requestEnvelope.context.System.device;
      const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();
      const address = await deviceAddressServiceClient.getFullAddress(deviceId);
      console.log(address);

      // Fetch the users county so we can fetch relevant facts
      var county = address.stateOrRegion;
      // Expand shortened county names or convert them to match the fact dataset
      if (county === 'Hants') county = 'Hampshire';
      if (county === 'West Sussex' || county === 'East Sussex') county = 'Sussex';
      if (county === 'Greater London') county = 'London';
      if (county === 'Greater Manchester') county = 'Manchester';
      if (county === 'North Yorkshire' || county === 'South Yorkshire' || county === 'West Yorkshire') county = 'Yorkshire';

      var response = '';
      if (county && FACTS.hasOwnProperty(county)) {
        // Get a random fact based on the user's county
        response = FACTS[county][Math.floor(Math.random()*5)];
      } else {
        // Otherwise advise the user to check their device location in the app
        response = messages.FACT_ERROR;
      }
      
      return responseBuilder
        .speak(response)
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

// Help the user understand what the skill is for
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

// Tell the user local facts can't help with that
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

// Exit the skill
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

// Log session end
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

// Handle specific address fetching errors
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

// Handle generic errors
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    return handlerInput.responseBuilder
      .speak(messages.ERROR)
      .getResponse();
  },
};

// Import that facts for each county from the data file
const FACTS = {
  'Hampshire': [
    'The New Forest is one of Britains newest and smallest national parks with an area of 218 square miles.',
    'Hampshire is the birthplace of Jane Austen and Charles Dickens.',
    'Southampton is the home of the Spitfire Aircraft which was designed by R.J. Mitchell.',
    'Southampton was the first town in Britain to sample fish fingers in 1955.',
    'The first Sherlock Holmes story was written in Southsea by Sir Arthur Conan-Doyle.'
  ],
  'London': [
    'Big Ben is actually meant to be called ‘The Clock Tower’, while ‘Big Ben’ is the name of the bell.',
    'The identity of Jack the Ripper, London’s most notorious serial killer, has never been discovered.',
    'Charles II’s ordered for six ravens to be placed in the Tower of London to protect it. Apparently, six ravens are still kept in the tower today and they must remain there at all times due to superstitious reasons.',
    'When the London Underground was first proposed, engineers suggested filling the tunnels with water and using barges to float people from station to station',
    'Feeding Pigeons in Trafalgar Square has been banned since 2003.'
  ],
  'Bedfordshire': [
    'Catherine of Aragon, one time wife of Henry VIII was imprisoned in the county before their marriage was annulled',
    'Britain’s longest town is said to be in Bedfordshire? Arlesey’s main street is three miles long.',
    'The worlds first tractors were created in Biggleswade by a man called Daniel Albone.',
    'St Paul’s church in Bedford was used to broadcast the BBC’s daily service during the second world war.',
    'The first ever performance recognised as a play in England was written in Dunstable. It was written by Geoffrey de Gorham who staged it at Dunstable Priory'
  ],
  'Buckinghamshire': [
    'Stoke Mandeville Hospital in Aylesbury is internationally known for its treatment of spinal-cord injuries and has hosted the World Stoke Mandeville Wheelchair Games.',
    'The name Buckinghamshire is Anglo-Saxon in origin and means ‘the district of Bucca’s home’, Bucca being an Anglo-Saxon landowner.',
    'Waddesdon Manor was built for Baron de Rothschild in 1874 to display his outstanding collection of art treasures.',
    'The former home of Florence Nightingale is near Waddesdon in Claydon.',
    'Hell-Fire Caves are tunnels that were dug by hand and were once a haunt of the notorious Hellfire club!'
  ],
  'Cambridgeshire': [
    'Lord Byron kept a bear in his rooms when he was a student at Trinity College. Apparently he was annoyed by the rule that students were not allowed to keep dogs at the university.',
    'Oliver Cromwell’s head is buried in Cambridge in a secret location.',
    'The university library has over 29 million books and receives a free copy of every book published in the UK',
    'The first official football game using the ‘Cambridge Rules’ was played on Parker’s Piece in 1848 – this formed the basis of the Football Association’s rules drawn up in 1863.',
    'In 1958, Cambridge engineering students managed to get an Austin Seven car on the roof of Senate House. It took the university a week to remove it.'
  ],
  'Cheshire': [
    'Sir Arthur Aston of Catton Hall, near Frodsham, was declared by Charles I to be more feared by the enemy than any other man in his army.',
    'The Packhorse Bridge over the River Dane at Three Shires Head is where Cheshire, Derbyshire and Staffordshire all meet.',
    'Legend has it that Rostherne Mere is bottomless. Another legend tells of a workman who cursed a church bell as it was being conveyed to Rostherne St Mary’s – at which point the bell came loose and knocked the man into the mere where he drowned.',
    'St Oswald’s Church at Lower Peover is home to a big oak chest which for many years housed parish records, vicars’ robes, chalices and church documents. Local legend has it that if a girl wished to be a farmer’s wife she must be able to lift the chest lid with one arm.',
    'The first person to walk across Chester’s Grosvenor Bridge was a young Princess Victoria.'
  ],
  'Cornwall': [
    'Cornwall is the most southwest county of Great Britain.',
    'Cornwall boasts the longest coastline in Great Britain, extending 433 miles.',
    'A team of bakers from Bodmin, Cornwall, hold the record for baking the biggest Cornish pasty.  It weighed 1900 pounds and had a whopping 1,750,000 calories.',
    'Truro is the only city in Cornwall, which is also the administrative center.',
    'In the 1900’s, half of the world’s tin came from Cornwall.'
  ],
  'Cumbria': [
    'Lake Bassenthwaite is the only lake in the Lake District. The other “lakes” are considered to be Waters, Meres or Tarns.',
    'Wastwater is the deepest lake at 74 metres.',
    'Seathwaite in Borrowdale, is widely considered to be the wettest place in England, receiving over 3-metres of rain per year.',
    'England\'s tallest Grand Fir Tree, at 57 meters, can be found amongst other giants at the Ambleside Champion Tree Trail.',
    'As a nod to Lambert Simnel’s attempt to usurp the throne in 1487, the landlord of the Ship Inn on Piel Island, is known as the King of Piel Island.'
  ],
  'Derbyshire': [
    'Derby Arboretum, is famous for being England’s first public park. It’s Grade Two listed and inspired the design of New York’s Central Park.',
    'Cotton spinner Jedediah Strutt patented and built a machine called the Derby Rib Attachment which revolutionised the manufacture of ribbed hose stockings.',
    'Erasmus Darwin, doctor, scientist, philosopher and grandfather of Charles Darwin, founded the Derby Philosophical Society in 1783.',
    'Romans built a fort on high ground around Belper Road, overlooking the River Derwent, one of a line of forts seeking to protect the first boundary of their newly-conquered province.',
    'An industrial boom began in Derby when Rolls-Royce opened a car and aircraft factory in the town in 1907.'
  ],
  'Devon': [
    'Devon County Council is responsible for 8,000 miles of road - the longest network in the country.',
    'Parliament Street in Exeter bears a plaque claiming it to be the narrowest street in the world. At its narrowest it is about 0.64 metres.',
    'The earliest recorded recipe for the pasty was discovered in 2006 in a Devon cook book and dates back 500 years.',
    'Jacka Bakery on the Barbican made biscuits that went onto The Mayflower for the sailing of the Pilgrim Fathers.',
    'Torbay Picture House was opened on 16 March 1914, and is believed to be the oldest surviving purpose-built cinema in Europe.'
  ],
  'Dorset': [
    'The Jurassic coast was the first-ever natural site to make the UNESCO World Heritage list in December 2001.',
    'Enid Blyton loved to spend time in Dorset as a child, and those fond childhood memories were the source of inspiration for her famous book “Five”.',
    'Dorset Naga Chillis are known as one of the world’s hottest Chillis.',
    'Fossil lover Mary Anning’s life and work was the inspiration behind the well-known tongue-twister “she sells sea shells on the seashore”',
    'The oldest post box in England can be found on the streets of Holwell, a quaint village and it is still in use today.'
  ],
  'Durham': [
    'On the main door of Durham Cathedral is the Sanctuary Knocker. Any fugitives who grasped the knocker were granted sanctuary for 37 days. They could then either face their accusers or be given safe conduct to the coast.',
    'Charles Dickens stayed in Barnard Castle when collecting material for Nicholas Nickleby.',
    'Durham\'s Cathedral and Castle World Heritage Site was one of the very 1st to be designated, along with the Taj Mahal and Palace of Versailles.',
    'Causey Arch is the world’s oldest surviving railway bridge, built in 1725-1726 by a local stonemason.',
    'In 1909 an amateur football team from West Auckland won the first World Cup, beating FC Winterthour of Switzerland.'
  ],
  'Sussex': [
    'The historic battle of Hastings didn’t even take place in Hastings – it took place about six miles up the road at Senlac Hill',
    'Paul McCartney received an honorary degree from the University of Sussex in 1988.',
    'Brighton Marina is the largest marina in Europe. It covers an area of 127 acres – 35 of which is land.',
    'A few world records have been set in Worthing, including the longest most consecutive rounds of kickboxing, the longest football marathon, and the heaviest fig ever grown, weighing 295 grams.',
    'Eastbourne is the 28th largest town without city status'
  ],
  'Essex': [
    'Essex is home to Britain\'s oldest recorded town, Colchester. It was the first Roman capital in Britain.',
    'The 350 mile long Essex coast is the second longest coastline of any English county.',
    'Waltham Abbey is the burial place of King Harold who died in the Battle of Hastings.',
    'Essex is one of the few places in the world where the "Little Scarlet" strawberry is grown, the perfect variant for jam making.',
    'Greensted Church is the oldest wooden church in the world. It was built in 1081 AD.'
  ],
  'Gloucestershire': [
    'The Cotswolds’ local sheep, known as "The Cotswold Lion", once provided wool for half of England\'s cloth.',
    'Edwin Budding, from Stroud, invented the very first lawnmower, with some of the early machines on display in The Museum in the Park.',
    'The cloisters of Gloucester Cathedral were used for scenes of the “Harry Potter” films’ taking place at Hogwarts School.',
    'The first ever British and Allied jet, the Gloster E28, was designed and built by the Gloster Aircraft Company, with many trial flights taking off from Brockworth airfield.',
    'The biggest ice cream factory in the UK is the Walls factory in Gloucester.'
  ],
  'Manchester': [
    'Manchester was formerly a Roman fort and settlement called Mamicium – a Latinised form of the Celtic meaning "breast-shaped hill".',
    'Manchester is said to be the only place in the world where you can obtain a degree in ‘Mummy Studies’ – the University of Manchester has facilities to enable the study of ancient Egyptian mummies.',
    'The Reverend William Cowherd preached the moral virtues of a vegetarian diet at a Salford chapel more than 200 years ago.',
    'Guy Fawkes’ gunpowder plot was supposedly planned in Salford’s Ordsall Hall.',
    'Manchester is the capital of football - and not just because of United and City. The world’s first professional football league was set up at the city’s Royal Hotel.'
  ],
  'Hertfordshire': [
    'Hatfield was habituated with early settlers who introduced agriculture, defence and war. The Domesday Book survey of 1086-87 confirms the existence of Hatfield.',
    'St Alban was the earliest British saint. He was a pagan living in Verulamium who sheltered a fugitive Christian cleric in the 3rd century, deceiving soldiers hunting him by exchanging cloaks and getting himself arrested.',
    'The first paper mill in Britain - Sele Mill near Hertford - was established by John Tate in about 1488.',
    'Before Charles Blondin made his first tightrope walk over Niagara Falls he practiced near Welwyn.',
    'The first turnpike road in Britain was a section of the Great North Road.'
  ],
  'Kent': [
    'The world\’s oldest horse fossil was found at Studd Hill, Herne Bay in 1838 and has recently been dated as 54 million years old',
    'John Buchan wrote The 39 Steps while bedridden in Kent. Suffering from stomach ulcers, he wrote his famed novel to distract himself from the excruciating pain.',
    'Leeds Castle is known as the ‘Ladies’ Castle’ because so many future Queens of England have resided within its protective walls.',
    'Comedy giants Laurel and Hardy opened The Romney, Hythe & Dymchurch Railway in 1947.',
    'Henry the Eighth allegedly once sampled a bowl of cherries produced in Kent and was so delighted with the flavour that the county became known as the Garden of England.'
  ],
  'Lancashire': [
    'The first KFC in the UK opened in Preston in 1965, for Valentine\'s Day in 2016 they offered a table service.',
    'The first motorway in the UK was built around Preston and opened in 1958.',
    'Sea Life Blackpool was home to a record breaking crab. "Big Daddy" held the record for the "longest leg on a crab" which measured 1.43 metres',
    'Blackburn was the first town in the UK to take on mass fingerprinting following the murder of June Anne Devaney in May 1948.',
    'When it opened the Big One rollercoaster in Blackpool was the largest and steepest in the world. It held this title until 1996.'
  ],
  'Leicestershire': [
    'The River Soar was once known for its unusual pink colour, due to waste from Leicester\'s textile factories running into it.',
    'Leicester Tigers, are officially the most successful English rugby club since the introduction of the league in 1987. The team holds the record for English champions, winning the league 10 times.',
    'The Jain Centre opened on Oxford Street in 1988, becoming the first ever Jain temple to be established in the West.',
    'Leicester City FC shocked everyone when they won the Premier league in 2015/16.',
    'Ada Lovelace, the world’s first computer programmer, was raised at Kirkby Mallory Hall in south Leicestershire. Ada Lovelace Day is celebrated each October.'
  ],
  'Lincolnshire': [
    'The first policewoman to be granted full powers of arrest in Great Britain 100 years ago was Lincolnshire woman Edith Smith who patrolled the streets of Grantham.',
    'Lincoln Castle is home to one of only four surviving copies of the Magna Carta.',
    'Sir Isaac Newton was born in a manor house at Woolsthorpe, near Grantham, in 1642, where he made many of his most important discoveries about light and gravity.',
    'Long Sutton was home to Dick Turpin for around nine months in 1737, when the notorious highwayman sought refuge away from London.',
    'Pinchbeck\'s Key Market store was chosen to host the historic moment when the country\'s first barcode - on a packet of Melrose teabags - was scanned in October 1979.'
  ],
  'Yorkshire': [
    'Yorkshire is the biggest county in the UK, and due to its vast amount of ‘unspoilt’ countryside is often nicknamed God’s own Country.',
    'Swaledale is home to Britain’s highest pub, The Tan Hill, 1,732 feet above sea level.',
    'The earliest reference to the classic ‘Yorkshire Pudding’ was in Hannah Glasse’s Art Of Cookery in 1747.',
    'Sheffield has the highest ratio of trees to people in Europe.',
    'Thomas Crapper, who invented the modern loo, was born in Yorkshire.'
  ],
  'Merseyside': [
    'Liverpool has Europe’s longest established Chinese community and Europe’s largest Chinese Arch which stands 14 metres over the entrance to Chinatown.',
    'Liverpool holds the Guinness Book of Records for being the Capital of Pop – more Liverpool artists have had a number one hit than any other town or city.',
    'The Grand National which is hosted at Aintree is watched by 600 million people worldwide.',
    'The clock faces on the Liver Building are the biggest in the country.',
    'On December 21st 1913, Arthur Wynne, a journalist from Liverpool, published a “word-cross” puzzle in the New York World' 
  ],
  'Norfolk': [
    'Norfolk has 659 medieval churches, the highest concentration in the world.',
    'Lord Nelson was born at the rectory at Burnham Thorpe on 29th September 1758.',
    'Howard Carter the archaeologist who discovered the tomb of Tutankhamen grew up in Swaffham.',
    'Thetford Forest is the largest lowland forest in Britain covering an area of 80 square miles.',
    'Robert Hales (1820-1863) the "Norfolk Giant" is buried in West Somerton churchyard, he grew to the height of 7 foot 6 inches.'
  ],
  'Northamptonshire': [
    'Northamptonshire is home to the world-famous Silverstone circuit track which hosts the British Grand Prix and houses Mercedes’ engine manufacturing factory.',
    'Althorp House has been the stately home to the Spencer family for almost 500 years and is the final resting place of Princess Diana. You can visit to see Lady Diana’s personal artefacts.',
    'The world’s first RADAR demonstration took place in Daventry on February 26, 1935, with the supervision of Robert Watson-Watt, pioneer of the radar.',
    'Famous brands Weetabix, Carlsberg and Doc Martens are all made in the Northamptonshire County.',
    'Northampton is home to the biggest market square in England which was established in 1189 around All Saint’s Church.'
  ],
  'Northumberland': [
    'Kielder Water & Forest Park in Northumberland forms part of the largest man made forest in Northern Europe.',
    'Northumberland has 97% of its area classed as rural. The county is sparsely populated with 63 people per square kilometre',
    'Jack Charlton and Sir Bobby Charlton come from Northumberland. The two brothers, born in Ashington helped England win the 1966 World Cup',
    'Northumberland is home to more castles than any other county in England.',
    'Holy island is home to the Lindisfarne castle and breathtaking views just off the Northumberland coast.'
  ],
  'Nottinghamshire': [
    'Nottingham has the world’s smallest cinema, seating only 21 guests.',
    'Robin Hood, a heroic outlaw from English folktales - a highly-skilled archer and swordsman known for robbing from the rich to give to the poor assisted by outlaws known as his ‘Merry Men were based in Nottingham.',
    'Nottingham is home to the deepest-toned bell in Britain called ‘Little John.’ The 10.5 tonne bell sounds out every 15 minutes and it’s reportedly the loudest clock bell in the country.',
    'HP sauce was invented by Frederick Gibson Garton in his packing factory at the back of 47 Sandon Street, Nottingham.',
    'Wollaton Hall was used as the setting for Wayne Manor in the 2012 Batman film, The Dark Knight Rises.'
  ],
  'Oxfordshire': [
    'The first enrolment of women to Oxford University was in 1878 from select number of colleges. It then took them a further 42 years for them to award women degrees.',
    'Hitler intended to have Oxford as his national city once he had fully conquered Britain so it was spared from German bombing.',
    'Cambridge University was formed by scholars who escaped from Oxford. This was during a time when the locals wanted to lynch all the students because some of them had beat a local woman to death.',
    'Legend has it that Oxford was started by a beautiful and pious young princess named Frideswide. When her dream of becoming a nun was threatened by a king who wanted to marry her, Frideswide ran away to Oxford.',
    'Oxford\'s Ashmolean Museum was the first museum in the world to be opened to the public when it was officially opened in 1683 according to the Guinness Book of Records.'
  ],
  'Shropshire': [
    'Shropshire doesn\'t contain a single city.',
    'The Ditherington Flax Mill in Shrewsbury was the first iron-framed building in the entire world, giving it the title the grandfather of all skyscrapers.',
    'Shropshire is home to the British Hedgehog Preservation Society. Founded in 1982 the Society offers help and advice to those with sick, injured or orphaned hedgehogs.',
    'Newport in Shropshire recorded the coldest temperature ever in England on 10th January 1982: minus 26 degrees centigrade',
    'Shrewsbury boasts the tallest town crier in the world, at 7ft 2in, and now also has the tallest MP in the United Kingdom: Daniel Kawczynski is 6ft 8.5in tall.'
  ],
  'Somerset': [
    'The West Somerset Railway is the longest preserved steam railway in the country with 20 miles of track.',
    'Taunton was the first town in the country to be lit permanently by electric street lighting in 1881.',
    'Shepton Mallet had the oldest prison in England when its jail closed in 2013. It first opened in 1610 and housed and saw the execution of countless inmates for over 400 years.',
    'Somerset is the county of Cider and there are more than 400 different varieties of cider apple grown in the area, which is enough to keep the keenest scrumper busy.',
    'The oldest complete human skeleton ever found in Britain was Cheddar Man, found at Cheddar Gorge. It was aged at around 9,000 years old.'
  ],
  'Staffordshire': [
    'There are more miles of canals in Staffordshire than any other county in England.',
    'An Annual Conker Tournament is held at The Red Lion, in Boundary near Cheadle every October.',
    'Prince\'s Park in Burntwood is listed in the Guinness Book of Records as the smallest park in the UK',
    'The largest ever haul of Anglo-Saxon gold in Britain was discovered beneath a farmers field in Staffordshire?',
    'The first jar of Marmite was produced in Staffordshire. It was German scientist, Justus Von Liebig, who realised that the beer by-product could be bottled and eaten.'
  ],
  'Suffolk': [
    'Travel as far east as you can within mainland Britain and you’ll reach Ness Point in Lowestoft. This quiet place is the first place in the country to see the sunrise.',
    'Suffolk Punch horses are chesnut in colour, gentle and hardworking in nature, and very stocky, hence the ‘Punch’ in their name.',
    'At 15ft by 7ft, the Nutshell pub in Bury St Edmunds is officially Britain’s smallest pub.',
    'The medieval village of Lavenham in Suffolk was the inspiration for Harry Potter’s fictional birthplace, Godric’s Hollow.',
    'St Edmund is the parton saint of Suffolk, he was king of East Anglia from 855 until 869, when he was killed by the Great Heathen Army of Norse warriors.'
  ],
  'Surrey': [
    'Guildford is named after a ford of golden sand just south of the town - it was dredged in 1760 when the river was deepened.',
    'The three most popular street names in Surrey are High Street, Church Road and Station Road.',
    'Bagshot Heath was once reputedly the most dangerous place in England - all because of the activities of a particularly cool, violent and careful highwayman called The Golden Farmer who operated there from about 1647 to 1689.',
    'In the third week of July each year, the River Thames witnesses the ancient ceremony of Swan Upping: the annual census of the swan population for the Queen.',
    'In 1540, King Henry VIII annulled his marriage to Anne of Cleves. Anne\'s family didn\'t want her back, so Henry was left with the problem of what to do with her. Then he hit on the idea of making her his sister and building Oatlands Palace for her in Weybridge.'
  ],
  'Tyne and Wear': [
    'A house in Gateshead became the first home in the world to be lit by an electric light bulb.',
    'Stephenson\’s Rocket, which won the Rainhill Trials in 1829, was built in Newcastle. It\'s design set the standard for steam locomotives for a century.',
    'The world’s first organised dog show was held in Newcastle on June 28 1859.',
    'Geordies are so called because the city was the only one in the North East that supported George II and closed its gates to the Jacobite army during the rebellion of 1745.',
    'St Peter\’s Church, built circa 674 in Monkwearmouth, was the first ever church in Britain to have stained glass windows.'
  ],
  'Warwickshire': [
    'Shakespeare - the Stratford-on-Avon born playwright and Warwickshire\'s most famous son - is widely recognised as the greatest writer in history.',
    'After the Coventry Blitz bombing raids in the Second World War, the city\'s name entered the German language when Joseph Goebbels used the term coventriert to describe similar levels of destruction of other enemy towns.',
    'The Italian Job\'s car chase scene involving Minis was filmed in huge sewer pipes at Stoke Aldermoor, in September 1968.',
    'JRR Tolkien\'s Middle Earth is based on Warwickshire.',
    'Coventry had its last public hanging 19 years before the practice ended completely in Britain in the County Hall on July 28, 1849. Mary Ball was found guilty of the murder of her husband Thomas and sentenced to death - and the execution was watched by an estimated 20,000 people.'
  ],
  'West Midlands': [
    'Victoria Square in Birmingham hosts one of the largest fountains in Europe, with a flow of 3,000 gallons per minute.',
    'JRR Tolkien, author of \'Lord of the Rings\', spent his childhood in the village of Sarehole, Birmingham. The tiny village is said to have been the model for the Shire, home of Bilbo Baggins in the book The Hobbit.',
    'Birmingham has over 6 million trees and more parks than any other European city.',
    'Birmingham\'s Central Library is the city\'s busiest building and Europe\'s largest public library, lending out 8 million books each year.',
    'The historic Bull Ring Centre in Birmingham has been the site of a market for more than 800 years.'
  ],
  'Wiltshire': [
    'Stonehenge attracts over 1.3 million visitors per year.',
    'The Royal Naval Air Service had an air station at Stonehenge during World War 1',
    'In Cricklade, just off the high street, there is a sign that says “In 1832 on this spot nothing happened.”',
    'The Kennet & Avon Canal is a total of 87 miles and links London with the Bristol Channel.',
    'Salisbury Cathedral is unusual in that it was built within a single century, has the tallest spire at 123 metres, largest cloisters and largest cathedral close in Britain.'
  ],
  'Worcestershire': [
    'In 1642, the Battle of Powick Bridge was the first major skirmish of the English Civil War, and the Battle of Worcester in 1651 effectively ended the civil war.',
    'The Malvern Hills, which run from the south of the county into Herefordshire, are made up mainly of volcanic igneous rocks and metamorphic rocks, some of which date from more than 1200 million years ago.',
    'The village of Broadheath, about 6 miles North-West of the city of Worcester, is the birthplace of the composer Edward Elgar.',
    'The Battle of Powick Bridge on the River Teme on 23rd September 1642 began the English Civil War.',
    'Worcestershire sauce was first produced in Worcester by two chemists, John Wheeley Lea and William Perrins, and went on sale in 1837.'
  ]
};

const skillName = 'Local Facts';

const messages = {
  WELCOME: 'Welcome to Local Facts!',
  HELP: 'You can say tell me a fact, or you can say exit.',
  HELP_REPROMPT: 'Ask me to tell you a fact.',
  FALLBACK: 'Local Facts can\'t help you with that. It can help you discover facts about your local area if you say: tell me a fact.',
  FALLBACK_REPROMPT: 'To learn a fact about your local area say: tell me a fact.',
  NOTIFY_MISSING_PERMISSIONS: 'Please enable address permissions in the Alexa app to find out facts about your local area. Then try again.',
  LOCATION_FAILURE: 'There was a problem fetching your address, please try again later.',
  ERROR: 'Sorry, an error occurred when fetching you a fact.',
  FACT_ERROR: 'I couldn\'t find any facts for your area. Make sure your device location is set in the Alexa app.',
  STOP: 'Thank you for using Local Facts!',
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
  .addErrorHandlers(GetAddressError, ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();