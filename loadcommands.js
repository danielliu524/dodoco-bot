const Discord = require("discord.js")

require("dotenv").config()

const client = new Discord.Client({
    intents: [
        "GUILDS",
        "GUILD_MEMBERS"
    ]
})

let bot = {
    client
}



const guildId = "740128488622915595"

client.slashcommands = new Discord.Collection() 

client.loadSlashCommands = (bot, reload) => require("./handlers/slashcommands")(bot, reload)
client.loadSlashCommands(bot, false)

client.on("ready", async () => {
    const guild = client.guilds.cache.get(guildId)
    if (!guild)
        return console.error("Target guild not found")
    
    await client.application.commands.set([...client.slashcommands.values()])
    console.log(`Successfully loaded in ${client.slashcommands.size}`)
    process.exit(0)
})

client.login(process.env.TOKEN)