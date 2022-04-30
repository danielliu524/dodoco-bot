const Discord = require("discord.js")
require("dotenv").config()

const client = new Discord.Client({
    intents: [
        "GUILDS",
        "GUILD_MESSAGES"
    ]
})

let bot = {client}

client.on("ready", () => {
    console.log("Logged in")
})

client.slashcommands = new Discord.Collection()

client.loadSlashCommands = (bot, reload) => require("./handlers/slashcommands")(bot, reload)
client.loadSlashCommands(bot, false)

client.on("interactionCreate", (interaction) => {
    if(!interaction.isCommand()) return
    if(!interaction.inGuild()) return interaction.reply("This command can only be used in a server")

    const slashcmd = client.slashcommands.get(interaction.commandName)
    if(!slashcmd) return interaction.reply("Invalid slash command")

    if(slashcmd.perm && !interaction.member.permissions.has(slashcmd.perm)) {
        return interaction.reply("No permission to run this command")
    }

    slashcmd.run(client, interaction)
})

client.login(process.env.TOKEN);