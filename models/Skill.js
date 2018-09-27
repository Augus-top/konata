const mongoose = require('../config/mongoConnection');

const SkillSchema = {
  name: String,
  atk_multiplier: Number,
  effect: String,
  accuracy: Number,
  cooldown: Number
};

const Skill = mongoose.model('Skill', SkillSchema);

module.exports = Skill;
