const fs = require('fs');
const mongoController = require('./mongoController');
const viewController = require('./viewController');
const Player = require('../models/Player');

let bot;

exports.setBot = async (b) => {
  bot = b;
};

exports.registerPlayer = async (playerId) => {
  const result = await mongoController.getSchemaByProperty(Player, 'discord_id', playerId);
  if (result.length !== 0) return;
  const newPlayer = {
    discord_id: playerId,
    wins: 0,
    loses: 0,
    level: 1,
    xp: 0
  };
  const resultCreate = await mongoController.createSchema(Player, newPlayer);
  return resultCreate;
};

exports.updateBattlePlayers = async (msg, winner, loser) => {
  winner.xp += 50;
  winner.wins++;
  loser.loses++;
  if (winner.xp % 100 === 0) {
    winner.level++;
    bot.createMessage(msg.channel.id, `<@${winner.discord_id}>, you have leveled up!\nYour current level is ${winner.level}`);
  }
  winner.save();
  loser.save();
};

exports.showPlayerCharList = async (msg) => {
  const user = msg.author.id;
  const player = await mongoController.getPlayer(user);
  if (player === undefined) return bot.createMessage(msg.channel.id, `You don't have any chars, <@${msg.author.id}>!`);
  player.chars.forEach(async (char) => {
    viewController.preparePlayerCharSlot(msg, player, char);
  });
};
