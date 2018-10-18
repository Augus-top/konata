const moment = require('moment');
const jimp = require('jimp');
const fs = require('fs');
const request = require('request-promise');
const utils = require('../utils/utils');
const mongoController = require('./mongoController');
const PlayerSchema = require('../models/Player');

let battles = [];
let bot;
let font16;
let font32;
let font32b;

exports.setBot = async (b) => {
  bot = b;
  
  font16 = await jimp.loadFont(jimp.FONT_SANS_16_WHITE);    
  font32 = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);    
  font32b = await jimp.loadFont(jimp.FONT_SANS_32_BLACK);    
  
  
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
  if (currentBattle === undefined) return bot.createMessage(msg.channel.id, 'No Battles in this channel!');
  if (currentBattle.firstPlayerChar !== undefined && currentBattle.secondPlayerChar !== undefined) {
    return bot.createMessage(msg.channel.id, 'You\'re not in battle!');
  }
  const params = msg.content.split(' ').slice(1).join(' ').split('http');
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
  // const charImage = msg.content.split(' ').slice(1).join(' ');
  
  // const userChar = (user === currentBattle.firstPlayer) ? currentBattle.firstPlayerChar : currentBattle.secondPlayerChar;
  // userChar.image = charImage;
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
  const hit = utils.generateRandomInteger(1, 2);
  if (skill.accuracy < battleTurn.enemyChar.evasion && hit === 1) {
    bot.createMessage(msg.channel.id, `${skill.name} missed!`);
    return this.checkBattleState(msg, battleTurn.currentBattle);
  }
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
  const loserChar = (currentBattle.firstPlayerChar.hp <= 0) ? currentBattle.firstPlayerChar : currentBattle.secondPlayerChar;
  const loserUser = (currentBattle.firstPlayerChar.hp <= 0) ? currentBattle.firstPlayer : currentBattle.secondPlayer;
  const winnerChar = (currentBattle.firstPlayerChar.hp <= 0) ? currentBattle.secondPlayerChar : currentBattle.firstPlayerChar;
  const winnerUser = (currentBattle.firstPlayerChar.hp <= 0) ? currentBattle.secondPlayer : currentBattle.firstPlayer;
  bot.createMessage(msg.channel.id, `${loserChar.name} fainted!\n${winnerChar.name} wins!`);
  bot.createMessage(msg.channel.id, `Congratulations, <@${winnerUser}>!`);
  battles = battles.filter(b => b.place !== currentBattle.place);
  this.updateBattlePlayers(msg, winnerUser, loserUser, winnerChar);
};

exports.updateBattlePlayers = async (msg, winnerId, loserId, char) => {
  const player = await mongoController.getPlayer(winnerId);
  const loser = await mongoController.getPlayer(loserId);
  player.xp += 50;
  console.log(player.xp);
  player.wins++;
  loser.loses++;
  if (player.xp % 100 === 0) {
    player.level++;
    bot.createMessage(msg.channel.id, `<@${player.discord_id}>, you have leveled up!\nYour current level is ${player.level}`);
  }
  player.save();
  loser.save();
  this.updateWinnerChar(msg, player, char);
};

exports.updateWinnerChar = (msg, player, char) => {
  char.xp += 50;
  console.log(char.xp);
  char.hp = char.originalHP;
  console.log(char.originalHP);
  if (char.xp % 50 !== 0) {
    return;
  }
  char.level++;
  bot.createMessage(msg.channel.id, `<@${player.discord_id}>, ${char.name} has leveled up!\n${char.name} current level is ${char.level}`);
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
  char.save();
};

exports.showChar = async (msg) => {
  const charName = msg.content.split(' ').slice(1).join(' ');
  const chars = await mongoController.getChar(charName);
  if (chars === undefined) return bot.createMessage(msg.channel.id, `There's no char named **${charName}**!`);
  const char = chars.filter(c => c.owner.discord_id === msg.author.id);
  if (char.length === 0) return bot.createMessage(msg.channel.id, `You don't have any char named **${charName}**, <@${msg.author.id}>!`);
  
  const fg = await jimp.read('./profile.png');
  const lvlframe = await jimp.read('./bglvl.png');
  const lvlback = await jimp.read('./bgwhite.png');
  
  let c = char[0];
  jimp.read(c.image).then(async(image) => {
    let finalImage = await jimp.read(450, 450, 0x000000ff);
    
    image.cover(450,280);
    finalImage.blit(image,0,0);
    finalImage.blit(lvlback,0,0);
    finalImage.blit(lvlframe,-200,0);
    finalImage.blit(fg, 0, 0);
    finalImage.print(font32, 15, 10, c.name);
    finalImage.print(font32, 60, 270, c.hp);
    finalImage.print(font32, 60, 315, c.atk);
    finalImage.print(font32, 60, 360, c.def);
    finalImage.print(font32, 60, 405, c.speed);
    for(let i = 0; i < c.skills.length; i++){
      finalImage.print(font32, 250, 270 + (i*35), c.skills[i].name + ' ('+c.skills[i].atk+')');
    }
    finalImage.print(font32b, 340, 5, c.level);

    let fileo = c._id + '.' + finalImage.getExtension(); // with no extension   
    finalImage.write(fileo, () => {
      bot.createMessage(msg.channel.id,'',{file: fs.readFileSync(fileo), name: fileo});
    });
  })
  .catch(err => {
    // handle an exception
  });

};

exports.showCharList = async (msg) => {
  const user = msg.author.id;
  const player = await mongoController.getPlayer(user);
  if (player === undefined) return bot.createMessage(msg.channel.id, `You don't have any chars, <@${msg.author.id}>!`);
  let message = '';
  const bg = await jimp.read('./bgblack.png');

  player.chars.forEach(c => {        
    jimp.read(c.image).then(image => {
      image.cover(300,100);
      bg.cover(300,21);
      
      image.blit(bg, 0, 79);
      image.print(font16, 15, 81, c.name);
      let fileo = player.discord_id + c._id + '.' + image.getExtension(); // with no extension
      
      image.write(fileo, () => {
        bot.createMessage(msg.channel.id,'',{file: fs.readFileSync(fileo), name: fileo});
      });
    })
    .catch(err => {
      console.log(err);
    });
  });
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
