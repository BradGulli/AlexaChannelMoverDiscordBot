const Discord = require('discord.js');
const auth = require('./auth');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('rateLimit', rateLimit => {
	console.log(rateLimit);
});

const getJohnny = () => {
	// When testing you can replace the string with your user name
	return client.guilds.first(1)[0].members.find(member => member.user.username === 'Chief Teeth');
}

const getJail = () => {
	return client.channels.find(ch => ch.name === 'Johnny Jail');
}

client.on('message', message => {
  // Voice only works in guilds, if the message does not come from a guild,
  // we ignore it
	if (!message.guild || message.author.bot) return;

	if (message.content === '!jail' && message.channel) {
		// First get the channel
		const channel = getJail();
		// Then get user
		const johnny = getJohnny();
		// Then set the voice channel - Note: this is async, but not doing anything with the promise for now
		johnny.setVoiceChannel(channel);		
	}
});

client.login(auth.token);