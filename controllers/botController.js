const Eris = require('eris');
const battleController = require('./battleController');
let keys;

if (!process.env['bot_token']) {
  keys = require('../keys.json');
}

const botToken = process.env['bot_token'] || keys.bot_token;
const bot = new Eris(botToken);
const commands = [];


exports.connectBot = () => {
  bot.connect();
};

bot.on('ready', () => {
  createCommands();
  battleController.setBot(bot);
  console.log('Konata up and ready desu');
  // const before = moment('2018-09-27T08:50:25-03:00');
  // const now = moment();
  // console.log(before.diff(now, 'minutes'));
  // const msg = {};
  // msg.content = '!ping';
  // const command = commands.filter(c => c.condition(msg));
  // if (command[0]) command.action(msg);
});

bot.on('messageCreate', (msg) => {
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
  commands.push({
    name: 'Start Battle',
    condition: (msg) => { return msg.content.startsWith('!battle'); },
    action: (msg) => { battleController.startBattle(msg, bot); }
  });
  commands.push({
    name: 'Join Battle',
    condition: (msg) => { return msg.content.startsWith('!join'); },
    action: (msg) => { battleController.joinBattle(msg); }
  });
  commands.push({
    name: 'Choose Char',
    condition: (msg) => { return msg.content.startsWith('!go'); },
    action: (msg) => { battleController.chooseChar(msg); }
  });
  commands.push({
    name: 'Atk during battle',
    condition: (msg) => { return msg.content.startsWith('!atk'); },
    action: (msg) => { battleController.executeAtk(msg); }
  });
  commands.push({
    name: 'Use skill battle',
    condition: (msg) => { return msg.content.startsWith('!use'); },
    action: (msg) => { battleController.useSkill(msg); }
  });
  commands.push({
    name: 'Closing Battles',
    condition: (msg) => { return msg.content.startsWith('!end'); },
    action: (msg) => { battleController.endBattles(msg); }
  });
  commands.push({
    name: 'Test battle system',
    condition: (msg) => { return msg.content.startsWith('!testjoin'); },
    action: (msg) => { testBattle(msg); }
  });
  commands.push({
    name: 'Test go char',
    condition: (msg) => { return msg.content.startsWith('!testgo'); },
    action: (msg) => { testChar(msg); }
  });
  commands.push({
    name: 'Test Atk',
    condition: (msg) => { return msg.content.startsWith('!testatk'); },
    action: (msg) => { testAtk(msg); }
  });
  commands.push({
    name: 'Test skill',
    condition: (msg) => { return msg.content.startsWith('!testuse'); },
    action: (msg) => { testSkill(msg); }
  });
};

const testBattle = (msg) => {
  bot.createMessage(msg.channel.id, '!join');
};

const testChar = (msg) => {
  const charName = msg.content.split(' ').slice(1).join(' ');
  bot.createMessage(msg.channel.id, '!go ' + charName);
};

const testAtk = (msg) => {
  bot.createMessage(msg.channel.id, '!atk');
};

const testSkill = (msg) => {
  const skillName = msg.content.split(' ').slice(1).join(' ');
  bot.createMessage(msg.channel.id, '!use ' + skillName);
};

const showHelp = (msg) => {
  let message = '```Command List:\n';
  message += '!ping: play pong\n';
  message += '!battle: start battle\n';
  message += '!join: join current battle\n';
  message += '!go + your char name: choose your battle char\n';
  message += '!atk: do a normal atk\n';
  message += '!use + skill name: use a skill to atk\n';
  message += '!end: stop battles current happening\n';

  message += '```';
  bot.createMessage(msg.channel.id, message);
};
