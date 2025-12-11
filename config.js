const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    // Session ID: Put your session ID here if config.env is not working
    SESSION_ID: process.env.SESSION_ID || "PUT_YOUR_SESSION_ID_HERE",

    // Alive Image URL
    ALIVE_IMG: process.env.ALIVE_IMG || "https://pomf2.lain.la/f/uzu4feg.jpg",

    // Alive Message
    ALIVE_MSG: process.env.ALIVE_MSG || "*🤖𝐇𝐞𝐲 𝐈'𝐦 💃bot name 🤍 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐁𝐨𝐭⚡*\n\n*🔔𝐈'𝐦 𝐀𝐥𝐢𝐯𝐞 𝐍𝐨𝐰🎠*\n\n*⚖️𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 - : Bot Name",

    // Auto Read Status (true/false)
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "true",

    // Default Prefix
    PREFIX: process.env.PREFIX || ".",

    // Owner Number
    OWNER_NUMBER: process.env.OWNER_NUMBER || "94718913389",
};
