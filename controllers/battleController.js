const moment = require('moment');
const jimp = require('jimp');
const fs = require('fs');
const request = require('request-promise');
const utils = require('../utils/utils');
const mongoController = require('./mongoController');

let battles = [];
let bot;

exports.setBot = (b) => {
  bot = b;
};

exports.startBattle = (msg) => {
  const currentBattle = battles.filter(b => b.place === msg.channel.id);
  if (currentBattle[0]) {
    return bot.createMessage(msg.channel.id, 'Battle already happening in this channel');
  }
  const newBattle = {
    firstPlayer: msg.author.id,
    place: msg.channel.id,
    lastActionTime: moment().format() + ''
  };
  mongoController.registerPlayer(msg.author.id);
  battles.push(newBattle);
  bot.createMessage(msg.channel.id, 'Waiting for challenger');
};

exports.joinBattle = (msg) => {
  const currentBattle = battles.filter(b => b.place === msg.channel.id);
  if (!currentBattle[0]) {
    return bot.createMessage(msg.channel.id, 'No battles current in this channel');
  }
  if (currentBattle[0].firstPlayer === msg.author.id) {
    return bot.createMessage(msg.channel.id, 'You can\'t fight against yourself!');
  }
  if (currentBattle[0].firstPlayer && currentBattle[0].secondPlayer) {
    return bot.createMessage(msg.channel.id, 'Battle already has two players');
  }
  currentBattle[0].secondPlayer = msg.author.id;
  mongoController.registerPlayer(msg.author.id);
  currentBattle[0].lastActionTime = moment().format() + '';
  bot.createMessage(msg.channel.id, `Starting battle between <@${currentBattle[0].firstPlayer}> and <@${currentBattle[0].secondPlayer}>!\nChoose your chars`);
};

exports.viewChar = (msg) => {
  const currentBattle = battles.filter(b => b.place === msg.channel.id);
  const charName = msg.content.split(' ').slice(1).join(' ');
  console.log(charName + 'char');
  
  jimp.read('https://blizzardwatch.com/wp-content/uploads/2016/11/OW_Sombra_cinematic_header.jpg').then(image => {
    image.cover(200,350);
    let fileo = 'char.' + image.getExtension(); // with no extension
    image.write(fileo, () => {
      bot.createMessage(msg.channel.id,'',{file: fs.readFileSync(fileo), name: fileo});
    });
  })
  .catch(err => {
    // handle an exception
  });
};

exports.chooseChar = (msg) => {
  const user = msg.author.id;
  let currentBattle = battles.filter(b => b.place === msg.channel.id);
  currentBattle = currentBattle[0];
  if (!currentBattle && (currentBattle.firstPlayer !== user || currentBattle.secondPlayer !== user)) {
    return bot.createMessage(msg.channel.id, 'You\'re not in battle!');
  }
  const charName = msg.content.split(' ').slice(1).join(' ');
  if (!/\S/.test(charName)) {
    return bot.createMessage(msg.channel.id, 'Char name can\'t be blank!');
  }
  const userPosition = (currentBattle.firstPlayer === user) ? 'firstPlayer' : 'secondPlayer';
  if (currentBattle[userPosition + 'Char']) {
    return bot.createMessage(msg.channel.id, 'Already choosed!');
  }
  if (currentBattle.secondPlayer === undefined) currentBattle.secondPlayer = msg.author.id;
  this.updateBattleChar(msg, currentBattle, user, charName, userPosition);
};

exports.setCharImage = (msg) => {
  const user = msg.author.id;
  let currentBattle = battles.filter(b => b.place === msg.channel.id);

  currentBattle = currentBattle[0];
  if (!currentBattle && (currentBattle.firstPlayer !== user || currentBattle.secondPlayer !== user)) {
    return bot.createMessage(msg.channel.id, 'You\'re not in battle!');
  }
  const charImage = msg.content.split(' ').slice(1).join(' ');
  
  const userChar = (user === currentBattle.firstPlayer) ? currentBattle.firstPlayerChar : currentBattle.secondPlayerChar;
  userChar.image = charImage;
};

exports.updateBattleChar = async (msg, currentBattle, user, charName, userPosition) => {
  const char = await prepareChar(charName, user, msg);
  if (char === undefined) return;
  currentBattle[userPosition + 'Char'] = char;
  bot.createMessage(msg.channel.id, `Choosed ${charName}!`);
  if (currentBattle.firstPlayerChar && currentBattle.secondPlayerChar) {
    bot.createMessage(msg.channel.id, `Battle Started!\n<@${currentBattle.firstPlayer}>, choose your move!`);
    currentBattle.currentPlayer = currentBattle.firstPlayer;
  }
};

exports.prepareBattle = (msg) => {
  const currentBattle = battles.filter(b => b.place === msg.channel.id);
  if (!currentBattle[0] || currentBattle[0].currentPlayer !== msg.author.id) {
    bot.createMessage(msg.channel.id, 'Not possible');
    return;
  }
  const userChar = (currentBattle[0].currentPlayer === currentBattle[0].firstPlayer) ? currentBattle[0].firstPlayerChar : currentBattle[0].secondPlayerChar;
  const enemyChar = (currentBattle[0].currentPlayer === currentBattle[0].firstPlayer) ? currentBattle[0].secondPlayerChar : currentBattle[0].firstPlayerChar;
  const battleTurn = { currentBattle: currentBattle[0], userChar, enemyChar };
  return battleTurn;
};

exports.executeAtk = (msg) => {
  const battleTurn = this.prepareBattle(msg);
  if (!battleTurn) return;
  const dmg = (battleTurn.userChar.atk > battleTurn.enemyChar.def) ? battleTurn.userChar.atk : Math.round(battleTurn.userChar.atk / 2);
  battleTurn.enemyChar.hp -= dmg;
  bot.createMessage(msg.channel.id, `${battleTurn.userChar.name} attacked!\n${battleTurn.enemyChar.name} suffered ${dmg} points of damage!`);
  this.checkBattleState(msg, battleTurn.currentBattle);
};

exports.useSkill = async (msg) => {
  const battleTurn = this.prepareBattle(msg, bot);
  if (!battleTurn) return;
  const skillName = msg.content.split(' ').slice(1).join(' ');
  if (!/\S/.test(skillName)) {
    return bot.createMessage(msg.channel.id, 'Skill name can\'t be blank!');
  }
  const skill = await prepareSkill(skillName, battleTurn, msg.author.id, msg);
  const dmg = (skill.atk > battleTurn.enemyChar.def) ? skill.atk : Math.round(skill.atk / 2);
  battleTurn.enemyChar.hp -= dmg;
  bot.createMessage(msg.channel.id, prepareEmbed(battleTurn, skill, dmg));
  this.checkBattleState(msg, battleTurn.currentBattle);
};

exports.checkBattleState = (msg, currentBattle) => {
  if (currentBattle.firstPlayerChar.hp > 0 && currentBattle.secondPlayerChar.hp > 0) {
    currentBattle.currentPlayer = (currentBattle.currentPlayer === currentBattle.firstPlayer) ? currentBattle.secondPlayer : currentBattle.firstPlayer;
    bot.createMessage(msg.channel.id, `Your turn, <@${currentBattle.currentPlayer}>!`);
    return;
  }
  const loserChar = (currentBattle.firstPlayerChar.hp <= 0) ? currentBattle.firstPlayerChar.name : currentBattle.secondPlayerChar.name;
  const winnerChar = (currentBattle.firstPlayerChar.hp <= 0) ? currentBattle.secondPlayerChar.name : currentBattle.firstPlayerChar.name;
  const winnerUser = (currentBattle.firstPlayerChar.hp <= 0) ? currentBattle.secondPlayer : currentBattle.firstPlayer;
  bot.createMessage(msg.channel.id, `${loserChar} fainted!\n${winnerChar} wins!`);
  bot.createMessage(msg.channel.id, `Congratulations, <@${winnerUser}>!`);
  battles = battles.filter(b => b.place !== currentBattle.place);
};

exports.showChar = async (msg) => {
  const charName = msg.content.split(' ').slice(1).join(' ');
  const chars = await mongoController.getChar(charName);
  if (chars === undefined) return bot.createMessage(msg.channel.id, `There's no char named **${charName}**!`);
  console.log(chars);
  const char = chars.filter(c => c.owner.discord_id === msg.author.id);
  if (char.length === 0) return bot.createMessage(msg.channel.id, `You don't have any char named **${charName}**, <@${msg.author.id}>!`);
  bot.createMessage(msg.channel.id, "" + char);
};

exports.showCharList = async (msg) => {
  const user = msg.author.id;
  const player = await mongoController.getPlayer(user);
  if (player === undefined) return bot.createMessage(msg.channel.id, `You don't have any chars, <@${msg.author.id}>!`);
  let message = '';
  player[0].chars.forEach(c => {
    console.log(c.name);
    message += c.name + '\n';
  });
  bot.createMessage(msg.channel.id, "" + message);
};

const createChar = (charName) => {
  const newChar = {
    name: charName,
    hp: utils.generateRandomInteger(50, 100),
    atk: utils.generateRandomInteger(20, 100),
    def: utils.generateRandomInteger(20, 99),
    speed: utils.generateRandomInteger(1, 100),
    evasion: utils.generateRandomInteger(1, 100),
    level: 1,
    status: 'none',
    image: 'https://vignette.wikia.nocookie.net/ultimate-pokemon-fanon/images/8/85/Missingno_drawing_by_aerostat-d4krmly.jpg/revision/latest?cb=20130916223342'
  };
  return newChar;
};

const createSkill = (skillName, skillGif) => {
  const newSkill = {
    name: skillName,
    atk: utils.generateRandomInteger(30, 100),
    effect: 'none',
    accuracy: utils.generateRandomInteger(50, 100),
    cooldown: utils.generateRandomInteger(2, 5),
    image: skillGif
  };
  return newSkill;
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

const prepareSkill = async (skillName, battleTurn, user, msg) => {
  const skills = await mongoController.getSkill(skillName);
  if (skills !== undefined) {
    const userSkill = skills.filter(s => (s.owner._id + '') === (battleTurn.userChar._id + ''));
    if (userSkill.length > 0) return userSkill[0];
  }
  const skillGif = await generateGif(skillName);
  let skill = createSkill(skillName, skillGif);
  skill = await mongoController.saveSkill(skill, battleTurn.userChar.name);
  if (skill === undefined) return;
  if (skill === 'already exists') {
    bot.createMessage(msg.channel.id, `You already have a skill named ${skillName}!`);
    return;
  }
  return skill;
};

const generateGif = async (skillName) => {
  let skillGif = 'https://cdn.discordapp.com/embed/avatars/0.png'
  const gif_request = 'http://api.giphy.com/v1/gifs/search?api_key=mFydloY4ZmutT1TA65SX2cf6Nxe2dKqG&q=' + skillName;
  const resp = await request(gif_request, { json: true });
  if (resp.data.length > 0) skillGif = resp.data[utils.generateRandomInteger(0, resp.data.length - 1)].images.original.url;
  return skillGif;
};

const prepareEmbed = (battleTurn, skill, dmg) => {
  const embed = { embed: {
    title: battleTurn.userChar.name + ' used ' + skill.name,
    color: 703991,
    thumbnail: {
      url: battleTurn.userChar.image
    },
    "image": {
      "url": skill.image
    },
    "author": {
      "name": battleTurn.userChar.name,
      "url": "https://discordapp.com",
      "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
    },
    "fields": [
      {
        "name": "🤔",
        "value": battleTurn.enemyChar.name + ' suffered '+ dmg +' points of damage'
      }
    ]
  }};
  return embed;
};

exports.endBattles = (msg) => {
  battles = battles.filter(b => b.place !== msg.channel.id);
  bot.createMessage(msg.channel.id, 'Battles ended in this channel');
};
