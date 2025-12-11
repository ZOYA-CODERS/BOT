const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  makeInMemoryStore,
  jidDecode
} = require('@whiskeysockets/baileys')
const fs = require('fs')
const pino = require('pino')
const path = require('path')
const { Boom } = require('@hapi/boom')
const config = require('./config')
const {
  sms,
  downloadMediaMessage
} = require('./lib/msg')
const axios = require('axios')
const {
  File
} = require('megajs')
const express = require("express")

const app = express()
const port = process.env.PORT || 8000

// Store handling
const store = makeInMemoryStore({
  logger: pino().child({
    level: 'silent',
    stream: 'store'
  })
})

// Auto-Downloader logic for Session
async function downloadSession() {
  if (!fs.existsSync(__dirname + '/auth_info_baileys/creds.json')) {
    if (!config.SESSION_ID || config.SESSION_ID === "PUT_YOUR_SESSION_ID_HERE") {
      console.log('Please add your session to SESSION_ID in config.js !!')
      return false
    }
    console.log("Downloading session...")
    try {
      const sessdata = config.SESSION_ID
      const filer = File.fromURL(`https://mega.nz/file/${sessdata}`)
      await new Promise((resolve, reject) => {
        filer.download((err, data) => {
          if (err) return reject(err)
          fs.mkdirSync(__dirname + '/auth_info_baileys', {
            recursive: true
          })
          fs.writeFileSync(__dirname + '/auth_info_baileys/creds.json', data)
          console.log("Session downloaded ✅")
          resolve()
        })
      })
    } catch (err) {
      console.log("Failed to download session:", err)
      return false
    }
  }
  return true
}

async function connectToWA() {
  const sessionExists = await downloadSession()
  if (!sessionExists) return

  console.log("Connecting wa bot 🧬...")
  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(__dirname + '/auth_info_baileys/')

  // Clean up old log levels
  const logger = pino({ level: 'silent' })

  const conn = makeWASocket({
    logger: logger,
    printQRInTerminal: true, // Set to true so user can see QR if session is invalid
    browser: Browsers.macOS("Safari"),
    auth: state,
    syncFullHistory: true,
    generateHighQualityLinkPreview: true,
  })

  store.bind(conn.ev)

  conn.ev.on('connection.update', (update) => {
    const {
      connection,
      lastDisconnect
    } = update
    if (connection === 'close') {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode
      if (reason === DisconnectReason.badSession) {
        console.log(`Bad Session File, Please Delete Session and Scan Again`)
        process.exit()
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log("Connection closed, reconnecting....")
        connectToWA()
      } else if (reason === DisconnectReason.connectionLost) {
        console.log("Connection Lost from Server, reconnecting...")
        connectToWA()
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First")
        process.exit()
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(`Device Logged Out, Please Scan Again And Run.`)
        process.exit()
      } else if (reason === DisconnectReason.restartRequired) {
        console.log("Restart Required, Restarting...")
        connectToWA()
      } else if (reason === DisconnectReason.timedOut) {
        console.log("Connection TimedOut, Reconnecting...")
        connectToWA()
      } else {
        console.log(`Unknown DisconnectReason: ${reason}|${connection}`)
        connectToWA()
      }
    } else if (connection === 'open') {
      console.log('Bot connected to whatsapp ✅')
      loadPlugins(conn)

      const ownerNumber = config.OWNER_NUMBER || '94718913389' // Fallback
      let up = `Bot Connected ✅\n\nPREFIX: ${config.PREFIX || '.'}`;

      conn.sendMessage(ownerNumber + "@s.whatsapp.net", {
        image: {
          url: config.ALIVE_IMG
        },
        caption: up
      }).catch(e => { }) // Ignore if owner message fails
    }
  })

  conn.ev.on('creds.update', saveCreds)

  conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0]
      if (!mek.message) return
      mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
      if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_READ_STATUS === "true") {
        await conn.readMessages([mek.key])
      }

      if (mek.key.fromMe) return // Ignore my own messages? Depends on bot type. Usually yes.

      const m = sms(conn, mek)
      const body = (m.type === 'conversation') ? m.message.conversation : (m.type === 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.type == 'imageMessage') && m.message.imageMessage.caption ? m.message.imageMessage.caption : (m.type == 'videoMessage') && m.message.videoMessage.caption ? m.message.videoMessage.caption : ''
      const prefix = config.PREFIX || '.'
      const isCmd = body.startsWith(prefix)
      const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
      const args = body.trim().split(/ +/).slice(1)
      const q = args.join(' ')
      const from = m.key.remoteJid
      const isGroup = from.endsWith('@g.us')
      const sender = m.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (m.key.participant || m.key.remoteJid)
      const senderNumber = sender.split('@')[0]
      const botNumber = conn.user.id.split(':')[0]
      const isMe = botNumber.includes(senderNumber)
      const ownerNumber = ['94718913389'] // TODO: Move to config
      const isOwner = ownerNumber.includes(senderNumber) || isMe

      // Reply function
      const reply = (text) => {
        conn.sendMessage(from, { text: text }, { quoted: mek })
      }

      // Command Execution
      if (isCmd) {
        const events = require('./command')
        const cmd = events.commands.find((cmd) => cmd.pattern === (command)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(command))
        if (cmd) {
          if (cmd.react) await conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } })
          try {
            await cmd.function(conn, mek, m, { from, body, isCmd, command, args, q, isGroup, sender, senderNumber, pushname: m.pushName, isMe, isOwner, reply });
          } catch (e) {
            console.error(`[PLUGIN ERROR] ${command}:`, e)
            reply(`Error executing command: ${e.message}`)
          }
        }
      }

      // Non-command handlers (eval, etc if needed)

    } catch (e) {
      console.log(e)
    }
  })
}

function loadPlugins(conn) {
  const events = require('./command')
  const path = require('path')
  fs.readdirSync("./plugins/").forEach((plugin) => {
    if (path.extname(plugin).toLowerCase() == ".js") {
      try {
        require("./plugins/" + plugin);
        console.log(`Saved Plugin: ${plugin}`)
      } catch (e) {
        console.log(`Error Loading Plugin ${plugin}:`, e)
      }
    }
  });
  console.log('Plugins installed successful ✅')
}

// App Server
app.get("/", (req, res) => {
  res.send("Bot is Running ✅");
});
app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));

// Start
setTimeout(() => {
  connectToWA()
}, 3000);

// Global Error Handlers
process.on('uncaughtException', (err) => {
  console.log('Caught exception: ' + err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});
