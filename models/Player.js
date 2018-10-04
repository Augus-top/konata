const mongoose = require('../config/mongoConnection');
const Schema = mongoose.Schema;

const PlayerSchema = {
  discord_id: String,
  wins: String,
  loses: Number,
  level: Number,
  chars: [{ type: Schema.Types.ObjectId, ref: 'Char' }]
};

const Player = mongoose.model('Player', PlayerSchema);

module.exports = Player;
