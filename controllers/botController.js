const Eris = require('eris');
const battleController = require('./battleController');
const utils = require('../utils/utils');
let keys;

if (!process.env['bot_token']) {
  keys = require('../keys.json');
}

const botToken = process.env['bot_token'] || keys.bot_token;
const bot = new Eris(botToken);
const commands = [];
let commandSymbol = '+';

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
  
  bot.editStatus("away", {name:"Conversa Fora", type:2});
  // const msg = {};

  // msg.content = commandSymbol + 'battle';
  // msg.author = {};
  // msg.channel = {};
  // msg.channel.id = '374042711939874816';
  // msg.author.id = '94937291998375936';
  // const command = commands.filter(c => c.condition(msg));
  // if (command[0]) command[0].action(msg);
});

bot.on('messageCreate', (msg) => {
  const command = commands.filter(c => c.condition(msg));
  if (command[0]) command[0].action(msg);
});

const createCommands = () => {
  commands.push({
    name: 'Ping',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'ping'); },
    action: (msg) => { bot.createMessage(msg.channel.id, 'Pong!'); }
  });
  commands.push({
    name: 'Help',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'help'); },
    action: (msg) => { showHelp(msg); }
  });
  commands.push({
    name: 'Start Battle',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'battle'); },
    action: (msg) => { battleController.startBattle(msg, bot); }
  });
  commands.push({
    name: 'Join Battle',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'join'); },
    action: (msg) => { battleController.joinBattle(msg); }
  });
  commands.push({
    name: 'Choose Char',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'go'); },
    action: (msg) => { battleController.chooseChar(msg); }
  });
  commands.push({
    name: 'Set Char Image',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'setImage'); },
    action: (msg) => { battleController.setCharImage(msg); }
  });
  commands.push({
    name: 'Use Skill during battle',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'use'); },
    action: (msg) => { battleController.useSkill(msg); }
  });
  commands.push({
    name: 'Change command symbol',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'changeSymbol'); },
    action: (msg) => { changeSymbol(msg); }
  });
  commands.push({
    name: 'Closing Battles',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'end'); },
    action: (msg) => { battleController.endBattles(msg); }
  });
  commands.push({
    name: 'See Char Stats',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'stats'); },
    action: (msg) => { battleController.showChar(msg); }
  });
  commands.push({
    name: 'See Chars',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'chars'); },
    action: (msg) => { battleController.showCharList(msg); }
  });
  commands.push({
    name: 'Test battle system',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'testjoin'); },
    action: (msg) => { testBattle(msg); }
  });
  commands.push({
    name: 'Test go char',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'testgo'); },
    action: (msg) => { testChar(msg); }
  });
  commands.push({
    name: 'Test skill',
    condition: (msg) => { return msg.content.startsWith(commandSymbol + 'testuse'); },
    action: (msg) => { testSkill(msg); }
  });
};

const testBattle = (msg) => {
  bot.createMessage(msg.channel.id, commandSymbol + 'join');
};

const testChar = (msg) => {
  const charName = msg.content.split(' ').slice(1).join(' ');
  bot.createMessage(msg.channel.id, commandSymbol + 'go ' + charName);
};

const testAtk = (msg) => {
  bot.createMessage(msg.channel.id, commandSymbol + 'atk');
};

const testSkill = (msg) => {
  const skillName = msg.content.split(' ').slice(1).join(' ');
  bot.createMessage(msg.channel.id, commandSymbol + 'use ' + skillName);
};

const changeSymbol = (msg) => {
  commandSymbol = msg.content.split(' ').slice(1).join(' ');
  bot.createMessage(msg.channel.id, `New symbol is now ${commandSymbol}`);
};

const showHelp = (msg) => {
  let message = '```Command List:\n\n';
  
  message += '\n\n--------------battle---------------\n';
  message += commandSymbol + 'battle: start battle\n';
  message += commandSymbol + 'join: join current battle\n';
  message += commandSymbol + 'go + your char name: choose your battle char\n';
  message += commandSymbol + 'use + skill name: use a skill to atk\n';
  message += commandSymbol + 'end: stop battles current happening\n';
  message += '\n\n------------characters-------------\n';
  message += commandSymbol + 'chars: list all player\'s characters\n';
  message += commandSymbol + 'stats: show the stats of a character\n';
  message += commandSymbol + 'setImage: change the character image\n';
  message += '\n\n--------------control---------------\n';
  message += commandSymbol + 'ping: play pong\n';
  message += commandSymbol + 'changeSymbol: change current command symbol\n';

  message += '```';
  bot.createMessage(msg.channel.id, message);
};
