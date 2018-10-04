const Player = require('../models/Player');
const Char = require('../models/Char');
const Skill = require('../models/Skill');

exports.getSchema = async (Schema) => {
  const result = await Schema.find().lean();
  return result;
};

exports.getSchemaById = async (Schema, id) => {
  const result = await Schema.findById(id).lean();
  return result;
};

exports.getSchemaByProperty = async (Schema, propertyName, propertyValue) => {
  const query = {};
  query[propertyName] = propertyValue;
  const result = await Schema.find(query).lean();
  return result;
};

exports.createSchema = async (Schema, info) => {
  const model = new Schema({
    ...info
  });
  const createdModel = await model.save();
  return createdModel;
};

exports.updateSchema = async (Schema, id, modifications) => {
  const updatedModel = await Schema.updateOne({ _id: id }, modifications);
  return updatedModel;
};

exports.updateSchemaByProperty = async (Schema, propertyName, propertyValue, modifications) => {
  const updatedModel = await Schema.updateMany({ propertyName: propertyValue }, modifications);
  return updatedModel;
};

exports.deleteSchema = async (Schema, id) => {
  await Schema.findByIdAndRemove(id);
};

exports.registerPlayer = async (playerId) => {
  const result = await this.getSchemaByProperty(Player, 'discord_id', playerId);
  if (result.length !== 0) return;
  const newPlayer = {
    discord_id: playerId,
    wins: 0,
    loses: 0,
    level: 1
  };
  const resultCreate = await this.createSchema(Player, newPlayer);
  return resultCreate;
};

exports.getChar = async (name, playerId) => {
  const result = await Char.find({ name }).populate('owner').lean();
  if (result.length === 0) return;
  return result;
};

exports.saveChar = async (char, playerId) => {
  const player = await Player.find({ discord_id: playerId }).populate('chars').lean();
  if (player.length === 0) return;
  const existingChar = player[0].chars.filter(c => c.name === char.name);
  if (existingChar.length > 0) return 'already exists';
  char.owner = player[0]._id;
  const newChar = await this.createSchema(Char, char);
  if (newChar === undefined) return;
  player[0].chars.push(newChar._id);
  const resultUpdate = await this.updateSchema(Player, player[0]._id, player[0]);
  return newChar;
};
