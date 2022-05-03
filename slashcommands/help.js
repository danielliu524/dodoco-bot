const run = async(client, interaction) => {
    return interaction.reply("Building help...")
}

module.exports = {
    name: "help",
    description: "Show what Dodoco can do",
    options: [
    ],
    run
}