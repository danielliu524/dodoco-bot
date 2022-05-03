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

client.on("ready", () => {
    const guild = client.guilds.cache.get(guildId)
    if (!guild)
        return console.error("Target guild not found")
    client.application.commands.fetch()
    .then((commands) => {
        var delCmd = 0
        commands.forEach((item) => {
            client.application.commands.delete(item.id)
            .then(() => {
                delCmd++
                if(delCmd === commands.size) {
                    client.application.commands.fetch().then((c) => {
                        console.log(c)
                    })
                    process.exit(0)
                }
            })
            .catch((error) => {
                console.log(error)
            })
        })
    })
})

client.login(process.env.TOKEN)