require("./config")
const { generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require("fs");
const util = require("util");
const chalk = require('./color');
const { format } = require('util')
const { exec } = require('child_process');
const fetch = require("cross-fetch");
module.exports = async (core, m) => {
  try {
    const body = m.mtype === 'conversation' ? m.message.conversation : m.mtype === 'extendedTextMessage' ? m.message.extendedTextMessage.text : '';
    const prefix = /^[#!.,®©¥€¢£/\∆✓]/.test(body) ? body.match(/^[#!.,®©¥€¢£/\∆✓]/gi) : '#'
    const commandnya = body.startsWith(prefix) ? body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase() : '';
    const command = commandnya.replace(prefix, '');
    const args = body.trim().split(/ +/).slice(1);
    const isOwner = global.owner.map(v => v + '@s.whatsapp.net').includes(m.sender);
    const text = args.join(' ');
   
    const groupMetadata = m.isGroup ? await core.groupMetadata(m.chat) : {};
    const groupName = m.isGroup ? groupMetadata.subject : '';
    const participants = m.isGroup ? groupMetadata.participants : [];
    const adminList = m.isGroup ? participants.filter(v => v.admin !== null).map(v => v.id) : [];
    const isAdmin = m.isGroup ? adminList.includes(m.sender) : false;
    const isBotAdmin = m.isGroup ? adminList.includes((core.user.id.split`:` [0]) + '@s.whatsapp.net') : false;
    
    if (global.privacy) {
      if (body.startsWith(prefix)) {
        core.readMessages([m.key]);
        console.log(chalk.black(chalk.bgWhite("PRIVACY MODE ON")))
      }
    } else {
      if (m.message) {
        core.readMessages([m.key]);
        console.log(chalk.black(chalk.bgWhite(!command ? '|| MSG ||' : '|| CMD ||')), chalk.black(chalk.bgBlue(body || m.mtype)) + chalk.magenta(' From'), chalk.green(m.pushName), chalk.yellow(m.sender) + chalk.blueBright(' In'), chalk.green(m.isGroup ? groupName : 'Private Chat', m.chat))
      }
    }

    switch (command) {
      case 'get': {
        try {
          if (!func.isUrl(args[0])) return core.reply(m.chat, 'Please Input Url To Get', m)
          await core.reply(m.chat, global.status.wait, m)
          let { href: url, origin } = new URL(args[0])
          let res = await fetch(url, {
            headers: {
              'referer': origin
            }
          })
          if (res.headers.get('content-length') > 100 * 1024 * 1024 * 1024) throw `Content-Length: ${res.headers.get('content-length')}`
          const result = await core.getFile(args[0], true)
          if (!/text|json/.test(res.headers.get('content-type'))) return core.sendFile(m.chat, result.filename, core.filename(result.ext), args[0], m)
          let txt = await res.buffer()
          try {
            txt = format(JSON.parse(txt + ''))
          } catch {
            txt = txt + ''
          }
          core.reply(m.chat, txt.trim().slice(0, 65536) + '', m)
        } catch (e) {
          core.reply(m.chat, func.jsonFormat(e))
        }
      }
      break
      default: {}
      if (body.startsWith('$')) {
        if (!isOwner) return core.reply(m.chat, global.mess.owner, m)
        await core.reply(m.chat, global.status.execute, m)
        exec(text, async (err, stdout) => {
          if (err) return core.reply(m.chat, func.jsonFormat(err), m)
          if (stdout) {
            await core.reply(m.chat, stdout, m)
          }
        })
      }

      if (body.startsWith('>')) {
        if (!isOwner) return core.reply(m.chat, global.mess.owner, m)
        try {
          await core.reply(m.chat, global.status.execute, m)
          let evaled = await eval(text)
          if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
          await core.reply(m.chat, evaled, m)
        } catch (err) {
          await core.reply(m.chat, func.jsonFormat(err), m)
        }
      }

      if (body.startsWith('=>')) {
        if (!isOwner) return core.reply(m.chat, global.mess.owner, m)
        function Return(sul) {
          let sat = JSON.stringify(sul, null, 2)
          if (sat) {
            var bang = util.format(sat)
          } else if (sat == undefined) {
            var bang = util.format(sul)
          }
          return core.reply(m.chat, bang, m)
        }
        try {
          core.reply(m.chat, util.format(eval(`(async () => { return ${text} })()`)), m)
        } catch (e) {
          core.reply(m.chat, func.jsonFormat(e), m)
        }
      }
    }
  } catch (err) {
    core.reply(m.chat, func.jsonFormat(err), m)
  }
}


let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
