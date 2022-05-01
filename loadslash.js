const Discord = require("discord.js")
require("dotenv").config()

const client = new Discord.Client({
    intents: [
        "GUILDS"
    ]
})

let bot = {client}

const guildId = "776823126490087426"

client.slashcommands = new Discord.Collection()

client.loadSlashCommands = (bot, reload) => require("./handlers/slashcommands")(bot, reload)
client.loadSlashCommands(bot, false)

client.on("ready", () => {
    const guild = client.guilds.cache.get(guildId)
    console.log("Loading slash commands...")
    if(!guild) {
        return console.error("Target guild not found")
    }
    guild.commands.set([...client.slashcommands.values()])
    .then(() => {
        console.log(`Successfully loaded in ${client.slashcommands.size} command(s)`)
    })
})

client.login(process.env.TOKEN);