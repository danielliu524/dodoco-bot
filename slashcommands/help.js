const {MessageEmbed} = require("discord.js")

const run = async(client, interaction) => {
    const helpArr = [
        "`/bday` - Register/update your birthday",
        "`/forget` - Remove your birthday"
    ]
    const embed = new MessageEmbed()
    .setColor("#fdf8c7")
    .setTitle("ℹ️ Do#fff8c5doco Help")
    .setDescription(helpArr.join("\n"))
    return interaction.reply({embeds: [embed]})
}

module.exports = {
    name: "help",
    description: "Show what Dodoco can do",
    options: [
    ],
    run
}