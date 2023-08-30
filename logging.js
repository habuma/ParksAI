const logTurn = (index, json) => {
    if (process.env.DEBUG_TURNS || process.env.DEBUG) {
        console.log(`--------------- Turn ${index} ---------------`);
        console.log(JSON.stringify(json, null, 2));
        console.log("--------------------------------------");
    }
};

module.exports = {
    logTurn: logTurn
};
