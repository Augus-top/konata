const request = require('request-promise');
const jimp = require('jimp');
const fs = require('fs');
const utils = require('../utils/utils');

let bot;

exports.setBot = (b) => {
  bot = b;
};

exports.generateGif = async (skillName) => {
  let skillGif = 'https://cdn.discordapp.com/embed/avatars/0.png';
  const gifRequest = 'http://api.giphy.com/v1/gifs/search?api_key=mFydloY4ZmutT1TA65SX2cf6Nxe2dKqG&q=' + skillName;
  const resp = await request(gifRequest, { json: true });
  if (resp.data.length > 0) skillGif = resp.data[utils.generateRandomInteger(0, resp.data.length - 1)].images.original.url;
  return skillGif;
};

exports.prepareEmbed = (battleTurn, skill, dmg) => {
  const embed = { embed: {
    title: battleTurn.userChar.name + ' used ' + skill.name,
    color: 703991,
    thumbnail: {
      url: battleTurn.userChar.image
    },
    image: {
      url: skill.image
    },
    author: {
      name: battleTurn.userChar.name,
      url: 'https://discordapp.com',
      icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
    },
    fields: [
      {
        name: '🤔',
        value: battleTurn.enemyChar.name + ' suffered ' + dmg + ' points of damage'
      }
    ]
  } };
  return embed;
};

exports.prepareCharImage = async (msg, char) => {
  const fg = await jimp.read('./profile.png');
  const lvlframe = await jimp.read('./bglvl.png');
  const lvlback = await jimp.read('./bgwhite.png');
  const font32 = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);
  const font32b = await jimp.loadFont(jimp.FONT_SANS_32_BLACK);
  const image = await jimp.read(char.image);
  const finalImage = await jimp.read(450, 450, 0x000000ff);
  image.cover(450, 280);
  finalImage.blit(image, 0, 0);
  finalImage.blit(lvlback, 0, 0);
  finalImage.blit(lvlframe, -200, 0);
  finalImage.blit(fg, 0, 0);
  finalImage.print(font32, 15, 10, char.name);
  finalImage.print(font32, 60, 270, char.hp);
  finalImage.print(font32, 60, 315, char.atk);
  finalImage.print(font32, 60, 360, char.def);
  finalImage.print(font32, 60, 405, char.speed);
  for (let i = 0; i < char.skills.length; i++) {
    finalImage.print(font32, 250, 270 + (i * 35), char.skills[i].name + ' (' + char.skills[i].atk + ')');
  }
  finalImage.print(font32b, 340, 5, char.level);
  const fileo = char._id + '.' + finalImage.getExtension();
  finalImage.write(fileo, () => {
    bot.createMessage(msg.channel.id, '', { file: fs.readFileSync(fileo), name: fileo });
  });
};

exports.preparePlayerCharSlot = async (msg, player, char) => {
  const bg = await jimp.read('./bgblack.png');
  const font16 = await jimp.loadFont(jimp.FONT_SANS_16_WHITE);
  const image = await jimp.read(char.image);
  image.cover(300, 100);
  bg.cover(300, 21);
  image.blit(bg, 0, 79);
  image.print(font16, 15, 81, char.name);
  const fileo = player.discord_id + char._id + '.' + image.getExtension();
  image.write(fileo, () => {
    bot.createMessage(msg.channel.id, '', { file: fs.readFileSync(fileo), name: fileo });
  });
};
