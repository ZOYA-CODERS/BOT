const { cmd, commands } = require('../command')
const { fetchJson } = require('../lib/functions')

cmd({
    pattern: "song",
    desc: "Download song from ytmp3",
    category: "download",
    react: "🎵",
    filename: __filename
},
    async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
        try {
            if (!q) return reply("Please provide a song name or url.")

            const searchUrl = `https://api-site-a7om3njog-zoya-coders-projects.vercel.app/api/search?query=${q}`
            const searchResult = await fetchJson(searchUrl)

            if (!searchResult || searchResult.length === 0) return reply("No results found.")

            const firstResult = searchResult[0]
            const downloadUrl = `https://api-site-a7om3njog-zoya-coders-projects.vercel.app/api/download?url=${firstResult.url_suffix ? 'https://www.youtube.com' + firstResult.url_suffix : firstResult.url}`

            const downloadResult = await fetchJson(downloadUrl)

            if (!downloadResult || !downloadResult.success || !downloadResult.download_link) {
                return reply("Failed to fetch download link.")
            }

            await conn.sendMessage(from, {
                audio: { url: downloadResult.download_link },
                mimetype: 'audio/mpeg',
                fileName: downloadResult.title + '.mp3',
                caption: `*Title:* ${downloadResult.title}\n*Powered by:* Zoya Coders`
            }, { quoted: mek })

        } catch (e) {
            console.log(e)
            reply(`Error: ${e}`)
        }
    })
