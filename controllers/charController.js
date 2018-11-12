const viewController = require('./viewController');
const mongoController = require('./mongoController');
const utils = require('../utils/utils');

let bot;

exports.setBot = async (b) => {
  bot = b;
};

exports.defineChar = (msg, params, currentBattle) => {
  const user = msg.author.id;
  let image;
  if (params.length > 1) image = 'http' + params[1];
  const charName = (params.length > 1) ? params[0].substring(0, params[0].length - 1) : params[0];
  if (!/\S/.test(charName)) {
    return bot.createMessage(msg.channel.id, 'Char name can\'t be blank!');
  }
  const userPosition = (currentBattle.firstPlayer === user) ? 'firstPlayer' : 'secondPlayer';
  if (currentBattle[userPosition + 'Char']) {
    return bot.createMessage(msg.channel.id, 'Already choosed!');
  }
  if (currentBattle.secondPlayer === undefined && msg.author.id !== currentBattle.firstPlayer) currentBattle.secondPlayer = msg.author.id;
  this.updateBattleChar(msg, currentBattle, user, charName, userPosition, image);
};

exports.updateBattleChar = async (msg, currentBattle, user, charName, userPosition, image) => {
  const char = await prepareChar(charName, user, msg);
  if (char === undefined) return;
  if (image !== undefined) {
    char.image = image;
    char.save();
  }
  char.originalHP = char.hp;
  currentBattle[userPosition + 'Char'] = char;
  bot.createMessage(msg.channel.id, `Choosed ${charName}!`);
  if (currentBattle.firstPlayerChar && currentBattle.secondPlayerChar) {
    bot.createMessage(msg.channel.id, `Battle Started!\n<@${currentBattle.firstPlayer}>, choose your move!`);
    currentBattle.currentPlayer = currentBattle.firstPlayer;
  }
};

exports.setCharImage = async (msg) => {
  const user = msg.author.id;
  const params = msg.content.split(' ').slice(1).join(' ').split('http');
  if (params.length < 2) return;
  const charName = params[0].split(' ').slice(0, 1).join(' ');
  const link = 'http' + params[1];
  const chars = await mongoController.getChar(charName);
  if (chars === undefined) return bot.createMessage(msg.channel.id, `There's no char named **${charName}**!`);
  const char = chars.filter(c => c.owner.discord_id === msg.author.id);
  if (char.length === 0) return bot.createMessage(msg.channel.id, `You don't have any char named **${charName}**, <@${msg.author.id}>!`);
  char[0].image = link;
  char[0].save();
  bot.createMessage(msg.channel.id, `${charName}'s image was updated!`);
};

const prepareChar = async (charName, user, msg) => {
  const chars = await mongoController.getChar(charName);
  if (chars !== undefined) {
    const userChar = chars.filter(c => c.owner.discord_id === user);
    if (userChar.length > 0) return userChar[0];
  }
  let char = createChar(charName);
  char = await mongoController.saveChar(char, user);
  if (char === undefined) return;
  if (char === 'already exists') {
    bot.createMessage(msg.channel.id, `You already have a char named ${charName}!`);
    return;
  }
  return char;
};

const createChar = (charName) => {
  const newChar = {
    name: charName,
    hp: utils.generateRandomInteger(100, 150),
    atk: utils.generateRandomInteger(20, 100),
    def: utils.generateRandomInteger(20, 99),
    speed: utils.generateRandomInteger(1, 100),
    evasion: utils.generateRandomInteger(1, 100),
    level: 1,
    xp: 0,
    status: 'none',
    image: 'https://vignette.wikia.nocookie.net/ultimate-pokemon-fanon/images/8/85/Missingno_drawing_by_aerostat-d4krmly.jpg/revision/latest?cb=20130916223342'
  };
  return newChar;
};

exports.updateWinnerChar = (msg, player, char) => {
  char.xp += 50;
  char.hp = char.originalHP;
  if (char.xp % 50 !== 0) {
    return;
  }
  char.level++;
  bot.createMessage(msg.channel.id, `<@${player.discord_id}>, ${char.name} has leveled up!\n${char.name} current level is ${char.level}`);
  updateCharSkills(msg, char);
  updateCharStats(msg, char);
  char.save();
};

const updateCharSkills = (msg, char) => {
  char.skills.forEach((s) => {
    const randSkill = utils.generateRandomInteger(1, 3);
    if (randSkill === 1) {
      s.atk++;
      bot.createMessage(msg.channel.id, `Skill ${s.name} atk has upgraded!\n current atk is ${s.atk}`);
    }
    if (randSkill === 2) {
      s.accuracy++;
      bot.createMessage(msg.channel.id, `Skill ${s.name} accuracy has upgraded!\n current accuracy is ${s.accuracy}`);
    }
    s.save();
  });
};

const updateCharStats = (msg, char) => {
  const randStats = utils.generateRandomInteger(1, 3);
  switch (randStats) {
    case 1:
      char.hp++;
      bot.createMessage(msg.channel.id, `${char.name}'s hp has upgraded!\n current hp is ${char.hp}`);
      break;
    case 2:
      char.def++;
      bot.createMessage(msg.channel.id, `${char.name}'s def has upgraded!\n current def is ${char.def}`);
      break;
    default:
      char.evasion++;
      bot.createMessage(msg.channel.id, `${char.name}'s evasion has upgraded!\n current evasion is ${char.evasion}`);
  }
};

exports.showChar = async (msg) => {
  const charName = msg.content.split(' ').slice(1).join(' ');
  const chars = await mongoController.getChar(charName);
  if (chars === undefined) return bot.createMessage(msg.channel.id, `There's no char named **${charName}**!`);
  const char = chars.filter(c => c.owner.discord_id === msg.author.id);
  if (char.length === 0) return bot.createMessage(msg.channel.id, `You don't have any char named **${charName}**, <@${msg.author.id}>!`);
  const c = char[0];
  viewController.prepareCharImage(msg, c);
};
