require("./config");
const {
  generateWAMessageFromContent,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  prepareWAMessageMedia,
} = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require("fs");
const util = require("util");
const chalk = require('./color');
const { format } = require('util');
const { exec } = require('child_process');
const fetch = require("cross-fetch");

module.exports = async (core, m) => {
  const CategoryCommand = {};
  core.command = async (commands, callback, options = {}) => {
    if (!Array.isArray(commands)) {
      commands = [commands];
    }

    let body = m.mtype === 'conversation' ? m.message.conversation : m.mtype === 'extendedTextMessage' ? m.message.extendedTextMessage.text : '';
    const prefix = body && /^[#!.,®©¥€¢£/\∆✓]/.test(body) ? body.match(/^[#!.,®©¥€¢£/\∆✓]/gi)[0] : '#';

    const executing = ['>', '=>', '$'];
    let command = body.trim().split(/ +/).shift().toLowerCase();

    if (body.startsWith(prefix) && !executing.includes(command)) {
      command = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase();
    } else if (!executing.includes(command)) {
      return;
    }

    const args = body.trim().split(/ +/).slice(1);
    const text = args.join(' ');
    const isOwner = global.owner.map(v => v + '@s.whatsapp.net').includes(m.sender);

    const getGroupMetadata = async () => {
      if (!m.isGroup) return {};
      const groupMetadata = await core.groupMetadata(m.chat);
      const participants = groupMetadata.participants;
      const adminList = participants.filter(v => v.admin !== null).map(v => v.id);
      const isAdmin = adminList.includes(m.sender);
      const isBotAdmin = adminList.includes((core.user.id.split`:`[0]) + '@s.whatsapp.net');
      return { groupMetadata, isAdmin, isBotAdmin };
    };

    const groupMetadata = await getGroupMetadata();
    const isAdmin = groupMetadata.isAdmin;
    const isBotAdmin = groupMetadata.isBotAdmin;

    if (options.admin && !isAdmin) {
      return core.reply(m.chat, "Perintah ini hanya tersedia untuk admin grup.", m);
    }
    if (options.bot && !isBotAdmin) {
      return core.reply(m.chat, "Perintah ini membutuhkan bot untuk menjadi admin.", m);
    }

    if (options.owner && !isOwner) {
      return core.reply(m.chat, "Perintah ini hanya tersedia untuk pemilik.", m);
    }

    if (commands.includes(command)) {
      callback(m, { core, args, text, isOwner, func, prefix, executing, groupMetadata, command });

      core.readMessages([m.key]);
      console.log(chalk.black(chalk.bgWhite(command ? '|| CMD ||' : '|| MSG ||')), chalk.black(chalk.bgBlue(body || m.mtype)) + chalk.magenta(' From'), chalk.green(m.pushName), chalk.yellow(m.sender) + chalk.blueBright(' In'), chalk.green(m.isGroup ? groupMetadata.groupMetadata.subject : 'Private Chat', m.chat));
    }
    const category = options.category || 'uncategorized';
    if (!CategoryCommand[category]) {
      CategoryCommand[category] = [];
    }
    const use = options.use || "";
    if (Array.isArray(use)) {
      use.forEach(u => {
        commands.forEach(cmd => {
          const commandWithUse = `${cmd} ${u}`.trim();
          if (!CategoryCommand[category].includes(commandWithUse)) {
            CategoryCommand[category].push(commandWithUse);
          }
        });
      });
    } else {
      commands.forEach(cmd => {
        const commandWithUse = `${cmd} ${use}`.trim();
        if (!CategoryCommand[category].includes(commandWithUse)) {
          CategoryCommand[category].push(commandWithUse);
        }
      });
    }
  };

  core.command(["tes", "halo", "ping"], async (m, { core, command }) => {
    core.reply(m.chat, `Bot aktif dengan perintah: ${command}`, m);
  }, { category: 'main' });

  core.command("get", async (m, { core, args }) => {
    try {
      if (!func.isUrl(args[0])) return core.reply(m.chat, 'Masukkan URL', m);
      await core.reply(m.chat, global.status.wait, m);
      let { href: url, origin } = new URL(args[0]);
      let res = await fetch(url, { headers: { 'referer': origin } });
      if (res.headers.get('content-length') > 100 * 1024 * 1024) throw `Content-Length: ${res.headers.get('content-length')}`;
      const result = await core.getFile(args[0], true);
      if (!/text|json/.test(res.headers.get('content-type'))) {
        return core.sendFile(m.chat, result.filename, core.filename(result.ext), args[0], m);
      }
      let txt = await res.buffer();
      try {
        txt = format(JSON.parse(txt + ''));
      } catch {
        txt = txt + '';
      }
      core.reply(m.chat, txt.trim().slice(0, 65536) + '', m);
    } catch (err) {
      core.reply(m.chat, func.jsonFormat(err), m);
    }
  }, { category: 'downloader', use: '<url>' });

  core.command("$", async (m, { core, text }) => {
    await core.reply(m.chat, global.status.execute, m);
    exec(text, async (err, stdout) => {
      if (err) return core.reply(m.chat, func.jsonFormat(err), m);
      if (stdout) {
        await core.reply(m.chat, stdout, m);
      }
    });
  }, { owner: true, category: 'owner', use: '<command>' });

  core.command(">", async (m, { core, text }) => {
    try {
      await core.reply(m.chat, global.status.execute, m);
      let evaled = await eval(text);
      if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
      await core.reply(m.chat, evaled, m);
    } catch (err) {
      core.reply(m.chat, func.jsonFormat(err), m);
    }
  }, { owner: true, category: 'owner', use: '<command>' });

  core.command("=>", async (m, { core, text }) => {
    try {
      const result = await eval(`(async () => { return ${text} })()`);
      core.reply(m.chat, JSON.stringify(result, null, 2), m);
    } catch (e) {
      core.reply(m.chat, func.jsonFormat(e), m);
    }
  }, { owner: true, category: 'owner', use: '<command>' });

  core.command("menu", async (m, { core, prefix, executing }) => {
  let menu = `Halo ${func.tag(m.sender)}, ${func.greeting()}, saya adalah ${global.namebot}, yang di ciptakan oleh ${global.author}, berikut ini adalah fitur yang ada di bot\n`
  for (const category in CategoryCommand) {
    menu += `\n*${category.toUpperCase()} MENU*\n`;
    CategoryCommand[category].forEach(command => {
      if (executing.includes(command.split(" ")[0])) { 
        menu += ` ◦ ${command}\n`;
      } else {
        menu += ` ◦ ${prefix}${command}\n`; 
      }
    });
  }
  core.reply(m.chat, menu, m);
 });
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
