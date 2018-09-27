const mongoose = require('mongoose');
let keys;

if (!process.env.heroku) {
  keys = require('../keys.json');
}

const url = process.env.urlMongo || keys.urlMongo;

// mongoose.connect(url, () => {
//   console.log('mongodb connected');
// });

module.exports = mongoose;

