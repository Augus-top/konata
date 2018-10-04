const mongoose = require('../config/mongoConnection');
const autopopulate = require('mongoose-autopopulate');
const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
  discord_id: String,
  wins: Number,
  loses: Number,
  level: Number,
  chars: [{ type: Schema.Types.ObjectId, ref: 'Char', autopopulate: { maxDepth: 1 } }]
});
PlayerSchema.plugin(autopopulate);

const Player = mongoose.model('Player', PlayerSchema);

module.exports = Player;
