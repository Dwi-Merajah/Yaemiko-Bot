const moment = require("moment-timezone");

exports.isUrl = (url) => {
  if (!url) return false; 
  return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/, 'gi'))
}

exports.jsonFormat = (obj) => {
    try {
      let print = (obj && (obj.constructor.name == 'Object' || obj.constructor.name == 'Array')) ? require('util').format(JSON.stringify(obj, null, 2)) : require('util').format(obj)
      return print
    } catch {
      return require('util').format(obj)
   }
}
exports.tag = (nomor) => {
    const data = `${nomor}`
    return `@${data.split("@")[0]}`
}
exports.greeting = () => {
   let time = moment.tz(global.timezone).format('HH')
   let res = `Don't forget to sleep`
   if (time >= 3) res = `Good Evening`
   if (time > 6) res = `Good Morning`
   if (time >= 11) res = `Good Afternoon`
   if (time >= 18) res = `Good Night`
  return res
}