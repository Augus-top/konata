const mongoose = require('../config/mongoConnection');
const autopopulate = require('mongoose-autopopulate');
const Schema = mongoose.Schema;

const SkillSchema = new Schema({
  name: String,
  atk_multiplier: Number,
  effect: String,
  accuracy: Number,
  cooldown: Number,
  owner: { type: Schema.Types.ObjectId, ref: 'Char', autopopulate: { maxDepth: 1 } }
});
SkillSchema.plugin(autopopulate);

const Skill = mongoose.model('Skill', SkillSchema);

module.exports = Skill;
