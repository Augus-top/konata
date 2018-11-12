const moment = require('moment');
const jimp = require('jimp');
const fs = require('fs');
const utils = require('../utils/utils');
const mongoController = require('./mongoController');
const charController = require('./charController');
const skillController = require('./skillController');
const playerController = require('./playerController');
const viewController = require('./viewController');

let battles = [];
let bot;

exports.setBot = async (b) => {
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
  playerController.registerPlayer(msg.author.id);
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
  playerController.registerPlayer(msg.author.id);
  currentBattle[0].lastActionTime = moment().format() + '';
  bot.createMessage(msg.channel.id, `Starting battle between <@${currentBattle[0].firstPlayer}> and <@${currentBattle[0].secondPlayer}>!\nChoose your chars`);
};

exports.chooseBattleChar = (msg) => {
  let currentBattle = battles.filter(b => b.place === msg.channel.id);
  currentBattle = currentBattle[0];
  if (currentBattle === undefined) return bot.createMessage(msg.channel.id, 'No Battles in this channel!');
  if (currentBattle.firstPlayer !== undefined && currentBattle.secondPlayerChar !== undefined) {
    return bot.createMessage(msg.channel.id, 'You\'re not in battle!');
  }
  const params = msg.content.split(' ').slice(1).join(' ').split('http');
  charController.defineChar(msg, params, currentBattle);
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

exports.useBattleSkill = async (msg) => {
  const battleTurn = this.prepareBattle(msg, bot);
  if (!battleTurn) return;
  const skillName = msg.content.split(' ').slice(1).join(' ');
  if (!/\S/.test(skillName)) {
    return bot.createMessage(msg.channel.id, 'Skill name can\'t be blank!');
  }
  const skill = await skillController.prepareSkill(skillName, battleTurn, msg.author.id, msg);
  const hit = utils.generateRandomInteger(1, 2);
  if (skill.accuracy < battleTurn.enemyChar.evasion && hit === 1) {
    bot.createMessage(msg.channel.id, `${skill.name} missed!`);
    return this.checkBattleState(msg, battleTurn.currentBattle);
  }
  const dmg = (skill.atk > battleTurn.enemyChar.def) ? skill.atk : Math.round(skill.atk / 2);
  battleTurn.enemyChar.hp -= dmg;
  bot.createMessage(msg.channel.id, viewController.prepareEmbed(battleTurn, skill, dmg));
  this.checkBattleState(msg, battleTurn.currentBattle);
};

exports.checkBattleState = async (msg, currentBattle) => {
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
  const winner = await mongoController.getPlayer(winnerUser);
  const loser = await mongoController.getPlayer(loserUser);
  playerController.updateBattlePlayers(msg, winner, loser, winnerChar);
  charController.updateWinnerChar(msg, winner, winnerChar);
};

exports.endBattles = (msg) => {
  battles = battles.filter(b => b.place !== msg.channel.id);
  bot.createMessage(msg.channel.id, 'Battles ended in this channel');
};
