const express = require('express');

const dbController = require('../controllers/mongoController');
const Char = require('../models/Char');
const Skill = require('../models/Skill');
const asyncHandler = require('../utils/utils');

const router = express.Router();

router.get('/', async (req, res) => {
  const result = await asyncHandler.handleAsyncMethod(dbController.getSchema, [Char]);
  result !== 'error' ? res.send(result) : res.send({'error': 'An error has occurred'});
});
  
router.get('/:id', async (req, res) => {
  const result = await asyncHandler.handleAsyncMethod(dbController.getSchemaById, [Char, req.params.id]);
  result !== 'error' ? res.send(result) : res.send({'error': 'An error has occurred'});
});
  
router.post('/', async (req, res) => {
  const result = await asyncHandler.handleAsyncMethod(dbController.createSchema, [Char, req.body]);
  result !== 'error' ? res.send(result) : res.send({'error': 'An error has occurred'});
});
  
router.put('/:id', async (req, res) => {
  const result = await asyncHandler.handleAsyncMethod(dbController.updateSchema, [Char, req.params.id, req.body]);
  result !== 'error' ? res.send(result) : res.send({'error': 'An error has occurred'});
});
  
router.delete('/:id', async (req, res) => {
  const char = await asyncHandler.handleAsyncMethod(dbController.getSchemaById, [Char, req.params.id]);
  char.skills.forEach(s => asyncHandler.handleAsyncMethod(dbController.deleteSchema, [Skill, s._id]));
  const player = char.owner;
  player.chars.forEach((c) => {
    if (c === char._id) {
      return player.chars.remove(c);;
    }
  });
  player.save();
  const result = await asyncHandler.handleAsyncMethod(dbController.deleteSchema, [Char, req.params.id]);
  result !== 'error' ? res.send(result) : res.send({'error': 'An error has occurred'});
});

module.exports = router;
