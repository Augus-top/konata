const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const db = require('./config/mongoConnection');
const index = require('./routes/index');
const player = require('./routes/player');
const char = require('./routes/char');
const rank = require('./routes/rank');
const skill = require('./routes/skill');
const botController = require('./controllers/botController');

const app = express();
const port = process.env.PORT || '3030';

app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/api/player', player);
app.use('/api/char', char);
app.use('/api/rank', rank);
app.use('/api/skill', skill);

app.use((req, res) => {
  res.status(404).send({ url: `${req.originalUrl} not found` });
});

const server = app.listen(port, () => {});
console.log(`Connected on port ${port}`);

botController.connectBot();

module.exports = app;
