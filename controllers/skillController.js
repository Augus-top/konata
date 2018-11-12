const mongoController = require('./mongoController');
const utils = require('../utils/utils');
const viewController = require('./viewController');

let bot;

exports.setBot = async (b) => {
  bot = b;
};

exports.prepareSkill = async (skillName, battleTurn, user, msg) => {
  const skills = await mongoController.getSkill(skillName);
  if (skills !== undefined) {
    const userSkill = skills.filter(s => (s.owner._id + '') === (battleTurn.userChar._id + ''));
    if (userSkill.length > 0) return userSkill[0];
  }
  const skillGif = await viewController.generateGif(skillName);
  let skill = createSkill(skillName, skillGif);
  skill = await mongoController.saveSkill(skill, battleTurn.userChar.name);
  if (skill === undefined) return;
  if (skill === 'already exists') {
    bot.createMessage(msg.channel.id, `You already have a skill named ${skillName}!`);
    return;
  }
  return skill;
};

const createSkill = (skillName, skillGif) => {
  const newSkill = {
    name: skillName,
    atk: utils.generateRandomInteger(30, 100),
    effect: 'none',
    accuracy: utils.generateRandomInteger(50, 100),
    cooldown: utils.generateRandomInteger(2, 5),
    image: skillGif
  };
  return newSkill;
};
