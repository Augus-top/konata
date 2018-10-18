const express = require('express');

const dbController = require('../controllers/mongoController');
const Player = require('../models/Player');
const Skill = require('../models/Skill');
const Char = require('../models/Char');
const asyncHandler = require('../utils/utils');

const router = express.Router();

router.get('/', async (req, res) => {
  const result = await asyncHandler.handleAsyncMethod(dbController.getSchema, [Player]);
  result !== 'error' ? res.send(result) : res.send({'error': 'An error has occurred'});
});
  
router.get('/:id', async (req, res) => {
  const result = await asyncHandler.handleAsyncMethod(dbController.getSchemaById, [Player, req.params.id]);
  result !== 'error' ? res.send(result) : res.send({'error': 'An error has occurred'});
});
  
router.post('/', async (req, res) => {
  const result = await asyncHandler.handleAsyncMethod(dbController.createSchema, [Player, req.body]);
  result !== 'error' ? res.send(result) : res.send({'error': 'An error has occurred'});
});
  
router.put('/:id', async (req, res) => {
  const result = await asyncHandler.handleAsyncMethod(dbController.updateSchema, [Player, req.params.id, req.body]);
  result !== 'error' ? res.send(result) : res.send({'error': 'An error has occurred'});
});
  
router.delete('/:id', async (req, res) => {
  const player = await asyncHandler.handleAsyncMethod(dbController.getSchemaById, [Player, req.params.id]);
  player.chars.forEach(c => {
    c.skills.forEach(s => asyncHandler.handleAsyncMethod(dbController.deleteSchema, [Skill, s._id]));
    asyncHandler.handleAsyncMethod(dbController.deleteSchema, [Char, c._id]);
  });
  const result = await asyncHandler.handleAsyncMethod(dbController.deleteSchema, [Player, req.params.id]);
  result !== 'error' ? res.send(result) : res.send({'error': 'An error has occurred'});
});

module.exports = router;
