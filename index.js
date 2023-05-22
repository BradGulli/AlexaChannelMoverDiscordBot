const Alexa = require('ask-sdk-core');
const Fuse = require('fuse.js');


const getSecret = async () => {
    // Load the AWS SDK
    var AWS = require('aws-sdk'),
    region = "us-east-2",
    secretName = "DiscordAPIKey",
	decodedBinarySecret;

	const STS = new AWS.STS({ apiVersion: '2011-06-15' });
	const credentials = await STS.assumeRole({
		RoleArn: 'arn:aws:iam::214600412822:role/service-role/JohnnyJail-role-9duf3o0j',
		RoleSessionName: 'ExampleSkillRoleSession'
	}, (err, res) => {
		if (err) {
			console.log('AssumeRole FAILED: ', err);
			throw new Error('Error while assuming role');
		}
		return res;
	}).promise();

    var client = new AWS.SecretsManager({
		region: region,
		accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken
    });
	const result = await client.getSecretValue({SecretId: secretName}).promise();
	return result.SecretString;
}


const handleMoveIntent = async (user, channelDest, mode = 'user') => {
    const Discord = require('discord.js');
	const discordClient = new Discord.Client();
	const secret = await getSecret();
    discordClient.login(JSON.parse(secret).token);

    const getMembers = () => {
	    return Array.from(discordClient.guilds.first(1)[0].members.values());
    }

    const getChannels = () => {
        return Array.from(discordClient.guilds.first(1)[0].channels.values()).filter(ch => ch.type === 'voice');
    }

    const getShadowRealm = () => {
    	return discordClient.channels.find(ch => ch.name === 'Shadow Realm');
    }

    const getUser = (members, name) => {
        const options = {
          keys: [
            "user.username"
          ]
        };
        const fuse = new Fuse(members, options);
        const result = fuse.search(name);
        console.log(result);
        return result[0].item;
    };

    const getChannel = (channels, channelName) => {
        const options = {
          keys: [
            "name"
          ]
        };
        const fuse = new Fuse(channels, options);
        const result = fuse.search(channelName);
        console.log(result);
        return result[0].item;
    }


    discordClient.on('ready', () => {
        console.log(`Logged in as ${discordClient.user.tag}!`);
        // First get the channel
        const channels = getChannels();
        console.log(channels);
        const channel = getChannel(channels, channelDest);
        if (mode === 'user') {
    	    // Then get user
    	    const members = getMembers();
    	    console.log(members);
    	    const userToMove = getUser(members, user);

    	    // Then set the voice channel - Note: this is async, but not doing anything with the promise for now
    	    userToMove.setVoiceChannel(channel);
        } else {
            const members = getMembers();
            console.log("members: ", members);
            members.forEach(mem => {
                mem.setVoiceChannel(channel);
            });
        }
    });

    discordClient.on('rateLimit', rateLimit => {
    	console.log(rateLimit);
	});

};

/////

/**
 * Triggered when the skill is launched.
 * */
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Who would you like to move?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Triggered when user says a name to move.
 * */
const NameIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'name';
    },
    async handle(handlerInput) {
        const user = Alexa.getSlotValue(handlerInput.requestEnvelope, 'user');
        console.log(user);
        const channelName = Alexa.getSlotValue(handlerInput.requestEnvelope, 'channel');
        await handleMoveIntent(user, channelName);

        const speakOutput = 'Bye Johnny!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/**
* Triggered when user says to move a name to "ShadowRealm"
* */
const ShadowIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'shadow';
    },
    async handle(handlerInput) {
        const user = Alexa.getSlotValue(handlerInput.requestEnvelope, 'user');
        const channelName = 'Shadow Realm';
        await handleMoveIntent(user, channelName);

        return handlerInput.responseBuilder.getResponse();
    }
}

/**
* Triggered when a user says to move an entire channel
* */
const ChannelIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'moveChannel';
    },
    async handle(handlerInput) {
        const channelName = Alexa.getSlotValue(handlerInput.requestEnvelope, 'channelName');
        const destChannel = Alexa.getSlotValue(handlerInput.requestEnvelope, 'destChannel');

        await handleMoveIntent(channelName, destChannel, 'channel');

        return handlerInput.responseBuilder.getResponse();
    }
}

/**
* Triggered when user asks to cancel or stop.
* */
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when no other intents are matched.
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        if(null!==handlerInput.requestEnvelope.request.error) {
            console.log(JSON.stringify(handlerInput.requestEnvelope.request.error));
        }


        return handlerInput.responseBuilder.getResponse();
    },
};
/**
 * Error handling.
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};



/**
 * Skill entry point. Declare handlers here.
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        NameIntentHandler,
        ChannelIntentHandler,
        ShadowIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler)
    .addErrorHandlers(
        ErrorHandler)
    .lambda();