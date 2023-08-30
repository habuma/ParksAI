'use strict';
const { OpenAI } = require('openai');
const axios = require('axios').default;
const { PARK_IDS } = require('./data');
const { logTurn } = require('./logging');

const configuration = {
    // Uncomment if using LocalAI (https://github.com/go-skynet/LocalAI)
    // baseURL: `http://localhost:8080/v1`
};
const openai = new OpenAI(configuration);

const getParkHours = async(parkName, date = 'today') => {
    const parkId = PARK_IDS[parkName];

    let filterDate = date;
    if (date === 'today') {
        const today = new Date();
        // pad month and day with leading 0 if needed
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        filterDate = `${today.getFullYear()}-${month}-${day}`;
    } else if (date === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        // pad month and day with leading 0 if needed
        const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
        const day = tomorrow.getDate().toString().padStart(2, '0');
        filterDate = `${tomorrow.getFullYear()}-${month}-${day}`;
    }

    const response = await axios.get(`https://api.themeparks.wiki/v1/entity/${parkId}/schedule`);
    // TODO : For now assume a happy HTTP 200 response
    const data = response.data;
    const dataForDate = data.schedule.filter(schedItem => {
        return schedItem.date === filterDate;
    });

    const parkHoursData = {};
    dataForDate.forEach(schedItem => {
        const hours = {
            openingTime: schedItem.openingTime,
            closingTime: schedItem.closingTime
        };
        var type = schedItem.description ? schedItem.description : schedItem.type;
        if (type === 'OPERATING') {
            type = 'Regular Park Hours';
        }
        parkHoursData[type] = hours;
    });

    return JSON.stringify(parkHoursData);
}

const askForParkHours = async (parkName) => {
    const messages = [
        { role: 'user', content: `What are the hours for ${parkName} tomorrow? If you do not know say "I do not know".`}
    ];

    const initialPrompt = {
        messages: messages,
        model: 'gpt-3.5-turbo',
        functions: [
            {
                'name': 'getParkHours',
                'description': 'Get the hours for a given park on a given date',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'parkName': {
                            'type': 'string',
                            'description': 'The name of a theme park such as Epcot or Magic Kingdom',
                        },
                        'date': {'type': 'string', 'enum': ['today', 'tomorrow']},
                    },
                    'required': ['parkName'],
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
        'getParkHours': getParkHours
    };

    const functionName = responseMessage.function_call.name;
    const functionToCall = availableFunctions[functionName];
    const functionArgs = JSON.parse(responseMessage.function_call.arguments);
    const functionResponse = await functionToCall(functionArgs.parkName, functionArgs.date);

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
    let parkName = 'Disneyland';
    if (process.argv.length >= 3) {
        parkName = process.argv[2];
    }

    const response = await askForParkHours(parkName);
    console.log(": " + response);
};


go();
