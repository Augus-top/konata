const express = require('express');

const dbController = require('../controllers/mongoController');
const Player = require('../models/Player');
const asyncHandler = require('../utils/utils');

const router = express.Router();

router.get('/', async (req, res) => {
  const result = await asyncHandler.handleAsyncMethod(dbController.getSchema, [Player]);
  result.sort( (a, b) => a.wins < b.wins);
  result !== 'error' ? res.send(result) : res.send({'error': 'An error has occurred'});
});

module.exports = router;