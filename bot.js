const Discord = require('discord.js');
const auth = require('./auth');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('rateLimit', rateLimit => {
	console.log(rateLimit);
});

client.on('message', message => {
  // Voice only works in guilds, if the message does not come from a guild,
  // we ignore it
	if (!message.guild || message.author.bot) return;

	if (message.content === '!jail' && message.channel) {
		// TODO: Does it need to join?
		message.member.voiceChannel.join().then(connection => {
			// Hard coded id for "test" voice channel. 
			// TODO: search through channels for the right one based on name
			// TODO: x, y are placeholders for what I assume are error and success args. Not sure which is which (care?)
			message.member.setVoiceChannel(message.guild.channels.get('783173759455461386')).then((x, y) => {
				console.log(x);
				console.log(y);
			});
		});
	} 

});

client.login(auth.token);