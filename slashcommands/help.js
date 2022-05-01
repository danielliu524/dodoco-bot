const run = async(client, interaction) => {
    return interaction.reply("Show help")
}

module.exports = {
    name: "help",
    description: "Show Dodoco's commands!",
    options: [
    ],
    run
}