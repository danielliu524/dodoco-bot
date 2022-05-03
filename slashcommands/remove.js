const Bday = require("../models/Bday")

const run = async(client, interaction) => {
    let userId = interaction.user.id
    Bday.deleteOne(
        { userId: {$eq: userId} },
        (error, docs) => {
            if(error) {
                console.log(error)
                return interaction.reply("Failed to delete birthday... <:klee_sad:968364857839738880> <@374576776426553354>")
            }
            console.log(docs)
            if(docs.deletedCount) {
                return interaction.reply(`Removed <@${userId}>'s birthday... <:klee_sad:968364857839738880>`)
            }
            else {
                return interaction.reply(`You do not have a registered birthday! <:klee_pout:964626152830406720>`)
            }
        }
    )
}

module.exports = {
    name: "remove",
    description: "Dodoco will forget your birthday",
    options: [
    ],
    run
}