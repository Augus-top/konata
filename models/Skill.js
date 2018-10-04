const mongoose = require('../config/mongoConnection');
const Schema = mongoose.Schema;

const SkillSchema = {
  name: String,
  atk_multiplier: Number,
  effect: String,
  accuracy: Number,
  cooldown: Number,
  owner: { type: Schema.Types.ObjectId, ref: 'Char' }
};

const Skill = mongoose.model('Skill', SkillSchema);

module.exports = Skill;
