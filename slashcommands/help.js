const {MessageEmbed} = require("discord.js")

const run = async(client, interaction) => {
    const embed = new MessageEmbed()
    .setTitle("Help")
    .setDescription("Description")
    return interaction.reply({embeds: [embed]})
}

module.exports = {
    name: "help",
    description: "Show what Dodoco can do",
    options: [
    ],
    run
}