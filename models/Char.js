const mongoose = require('../config/mongoConnection');
const autopopulate = require('mongoose-autopopulate');
const Schema = mongoose.Schema;

const CharSchema = new Schema({
  name: String,
  image: String,
  hp: Number,
  atk: Number,
  def: Number,
  speed: Number,
  evasion: Number,
  level: Number,
  status: String,
  xp: Number,
  skills: [{ type: Schema.Types.ObjectId, ref: 'Skill', autopopulate: { maxDepth: 1 } }],
  owner: { type: Schema.Types.ObjectId, ref: 'Player', autopopulate: { maxDepth: 1 } }
});
CharSchema.plugin(autopopulate);

const Char = mongoose.model('Char', CharSchema);

module.exports = Char;
