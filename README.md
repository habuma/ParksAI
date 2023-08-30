Parks AI
===
This project contains sample code demonstrating the OpenAI module for Node.js, specifically using Disney Parks as the domain to ask questions about.

Before running any of these scripts, you'll need to obtain an OpenAI API key (see https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key) and assign it to an environment variable named `OPENAI_API_KEY`.

You'll also need to install the package dependencies using `npm`:

```
$ npm install
```

With the package dependencies installed and the `OPENAI_API_KEY` environment variable set, you should be able to run the scripts.

Park Hours
---
You can use the `parkhours.js` script to ask for tomorrow's park hours. For example:

```
$ node parkhours.js Epcot
```

If the park name is not given, it defaults to Disneyland.

Wait Times
---
You can use the `waittimes.js` script to ask about the current wait times for an attraction. For example:

```
$ node waittimes.js "Space Mountain"
```

If not specified, the default attraction is "Jungle Cruise".

Note that to keep these examples simple, not all attractions are supported. Only the following attractions are available (all from Disneyland):

 - Big Thunder Mountain
 - Jungle Cruise
 - Haunted Mansion
 - Matterhorn Bobsleds
 - Pirates of the Caribbean
 - Space Mountain

When to Ride
---
You can use `whentoride.js` to ask about the best time to ride an attraction. This script is much like `waittimes.js`, but uses forecast data to make a recommendation about when the best time to ride is. For example:

```
$ node whentoride.js "Matterhorn Bobsleds"
```

As with `waittimes.js` if no attraction is specified, it will default to "Jungle Cruise". The same set of attractions are also supported.

Under the Covers
---
Behind the scenes, these scripts rely on [Theme Park API](https://themeparks.wiki/) to lookup actual park hours and realtime wait times for Disney Parks attractions. 

The actual interaction with OpenAI takes place over multiple turns:

 - The first prompt sent to OpenAI includes the question about park hours or wait times as well as a definition of the relevant local function to lookup that data.
 - OpenAI, not being aware of realtime data, will respond with a choice that asks the application to call the relevant local function.
 - After calling the local function, the script sends a new prompt, this time including the response from the local function.
 - Finally, OpenAI will respond with the final answer.

When running the scripts you can see the details from each of these turns in the emitted log output by setting either the `DEBUG` environment variable (which also enables debug logging for the OpenAI module) or the `DEBUG_TURNS` environment variable (which only enables debug logging for these scripts).
