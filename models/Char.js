const mongoose = require('../config/mongoConnection');
const Schema = mongoose.Schema;

const CharSchema = {
  name: String,
  image: String,
  hp: Number,
  atk: Number,
  def: Number,
  speed: Number,
  evasion: Number,
  level: Number,
  status: String,
  skills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
  owner: { type: Schema.Types.ObjectId, ref: 'Player' }
};

const Char = mongoose.model('Char', CharSchema);

module.exports = Char;
