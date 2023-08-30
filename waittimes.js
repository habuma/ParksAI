'use strict';
const { OpenAI } = require('openai');
const axios = require('axios').default;
const { ATTRACTION_IDS } = require('./data');
const { logTurn } = require('./logging');

const configuration = {
    // Uncomment if using LocalAI (https://github.com/go-skynet/LocalAI)
    // baseURL: `http://localhost:8080/v1`
};
const openai = new OpenAI(configuration);

const getCurrentWaitTime = async(attractionName) => {
    const attractionId = ATTRACTION_IDS[attractionName];
    const response = await axios.get(`https://api.themeparks.wiki/v1/entity/${attractionId}/live`);
    // TODO : For now assume a happy HTTP 200 response
    const data = response.data;
    const waitTime = data.liveData[0].queue.STANDBY.waitTime;
    const status = data.liveData[0].status;
    return JSON.stringify({
        attractionName: attractionName,
        waitTime: waitTime,
        status: status
    });
}

const askForWaitTime = async (attractionName) => {
    const messages = [
        { role: 'user', content: `How long is the wait for ${attractionName}? If the status is not OPERATING then say that the attraction is closed. If you do not know say "I do not know".`}
    ];

    const initialPrompt = {
        messages: messages,
        model: 'gpt-3.5-turbo',
        functions: [
            {
                'name': 'getCurrentWaitTime',
                'description': 'Get the wait time and status for a given attraction',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'attractionName': {
                            'type': 'string',
                            'description': 'The name of an attraction such as Haunted Mansion or Jungle Cruise',
                        }
                    },
                    'required': ['attractionName'],
                },
            }
        ]
      };
  logTurn(1, initialPrompt);

  const response = await openai.chat.completions.create(initialPrompt);
  logTurn(2, response);

  const responseMessage = response.choices[0].message;

  if (responseMessage.function_call) {
    const availableFunctions = {
        'getCurrentWaitTime': getCurrentWaitTime
    };

    const functionName = responseMessage.function_call.name;
    const functionToCall = availableFunctions[functionName];
    const functionArgs = JSON.parse(responseMessage.function_call.arguments);
    const functionResponse = await functionToCall(functionArgs.attractionName);

    messages.push(responseMessage);
    messages.push({
        role: 'function',
        name: functionName,
        content: functionResponse
    });

    const followupPrompt = {
        model: 'gpt-3.5-turbo',
        messages: messages
    };
    logTurn(3, followupPrompt);

    const secondResponse = await openai.chat.completions.create(followupPrompt);
    logTurn(4, secondResponse);

    return secondResponse.choices[0].message.content;
  }
};

const go = async () => {
    let attractionName = 'Jungle Cruise';
    if (process.argv.length >= 3) {
        attractionName = process.argv[2];
    }
    const response = await askForWaitTime(attractionName);
    console.log(": " + response);
};


go();
