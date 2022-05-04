const {MessageEmbed} = require("discord.js")

const helpEmbed = () => {
    const helpArr = [
        "`/bday` - Register/update your birthday",
        "`/forget` - Remove your birthday"
    ]
    const embed = new MessageEmbed()
    .setColor("#fdf8c7")
    .setTitle("ℹ️ Dodoco Help")
    .setDescription(helpArr.join("\n"))
    return embed
}

const run = async(client, interaction) => {
    const embed = helpEmbed()
    return interaction.reply({embeds: [embed]})
}

module.exports = {
    name: "help",
    description: "Show what Dodoco can do",
    options: [
    ],
    run,
    helpEmbed
}