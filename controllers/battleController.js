const moment = require('moment');

const utils = require('../utils/utils');
let battles = [];
let bot;

exports.setBot = (b) => {
  bot = b;
};

exports.startBattle = (msg) => {
  const currentBattle = battles.filter(b => b.place === msg.channel.id);
  if (currentBattle[0]) {
    bot.createMessage(msg.channel.id, 'Battle already happening in this channel');
    return;
  }
  const newBattle = {
    firstPlayer: msg.author.id,
    place: msg.channel.id,
    lastActionTime: moment().format() + ''
  };
  battles.push(newBattle);
  bot.createMessage(msg.channel.id, 'Waiting for challenger');
};

exports.joinBattle = (msg) => {
  const currentBattle = battles.filter(b => b.place === msg.channel.id);
  if (!currentBattle[0]) {
    bot.createMessage(msg.channel.id, 'No battles current in this channel');
    return;
  }
  if (currentBattle[0].firstPlayer && currentBattle[0].secondPlayer) {
    bot.createMessage(msg.channel.id, 'Battle already has two players');
    return;
  }
  currentBattle[0].secondPlayer = msg.author.id;
  currentBattle[0].lastActionTime = moment().format() + '';
  bot.createMessage(msg.channel.id, `Starting battle between <@${currentBattle[0].firstPlayer}> and <@${currentBattle[0].secondPlayer}>!\nChoose your chars`);
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
  currentBattle[userPosition + 'Char'] = createChar(charName);
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

exports.useSkill = (msg) => {
  const battleTurn = this.prepareBattle(msg, bot);
  if (!battleTurn) return;
  const skillName = msg.content.split(' ').slice(1).join(' ');
  if (!/\S/.test(skillName)) {
    return bot.createMessage(msg.channel.id, 'Skill name can\'t be blank!');
  }
  const skillAtk = utils.generateRandomInteger(1, 100);
  const dmg = (skillAtk > battleTurn.enemyChar.def) ? skillAtk : Math.round(skillAtk / 2);
  battleTurn.enemyChar.hp -= dmg;
  bot.createMessage(msg.channel.id, `${battleTurn.userChar.name} used ${skillName}!\n${battleTurn.enemyChar.name} suffered ${dmg} points of damage!`);
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

const createChar = (charName) => {
  const newChar = {
    name: charName,
    hp: utils.generateRandomInteger(50, 100),
    atk: utils.generateRandomInteger(20, 100),
    def: utils.generateRandomInteger(20, 99),
    speed: utils.generateRandomInteger(1, 100)
  };
  return newChar;
};

exports.endBattles = (msg) => {
  battles = battles.filter(b => b.place !== msg.channel.id);
  bot.createMessage(msg.channel.id, 'Battles ended in this channel');
};
