const Eris = require('eris');
let keys;

if (!process.env.heroku) {
  keys = require('../keys.json');
}

const botToken = process.env.botToken || keys.botToken;
const bot = new Eris(botToken);
const commands = [];

exports.connectBot = () => {
  bot.connect();
};

bot.on('ready', () => {
  createCommands();
  console.log('Konata, up and ready desu');
  // const msg = {};
  // msg.content = '!ping';
  // const command = commands.filter(c => c.condition(msg));
  // if (command[0]) command.action(msg);
});

bot.on('messageCreate', (msg) => {
  console.log(msg.content);
  const command = commands.filter(c => c.condition(msg));
  if (command[0]) command[0].action(msg);
});

const createCommands = () => {
  commands.push({
    name: 'Ping',
    condition: (msg) => { return msg.content.startsWith('!ping'); },
    action: (msg) => { bot.createMessage(msg.channel.id, 'Pong!'); }
  });
  commands.push({
    name: 'Help',
    condition: (msg) => { return msg.content.startsWith('!help'); },
    action: (msg) => { showHelp(msg); }
  });
};

const showHelp = (msg) => {
  let message = '```Command List:\n';
  message += '!ping: play pong';

  message += '```';
  bot.createMessage(msg.channel.id, message);
};
