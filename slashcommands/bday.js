const Bday = require("../models/Bday")

const run = async(client, interaction) => {
    let month = interaction.options.getInteger("month")
    let day = interaction.options.getInteger("day")
    if(!validDate(day, month)) {
        return interaction.reply("Please enter a valid date! <:klee_sad:968364857839738880>")
    }
    let userId = interaction.user.id
    Bday.replaceOne(
        { userId: {$eq: userId} },
        {
            userId: userId,
            month: month,
            day: day
        },
        { upsert: true },
        (error, docs) => {
            if(error) {
                console.log(error)
                return interaction.reply("Failed to register birthday... <:klee_sad:968364857839738880> <@374576776426553354>")
            }
            return interaction.reply(`${docs.matchedCount ? "Updated" : "Registered"} <@${userId}>'s birthday! <:klee_hug:965992961173254145>`)
        }
    )
}

const validDate = (day, month) => {
    if(day <= 0 || day > 31) return false
    switch(month) {
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:
            break
        case 4:
        case 6:
        case 9:
        case 11:
            if(day > 30) return false
            break
        case 2:
            if(day > 29) return false
            break
        default:
            return false
    }
    return true
}


module.exports = {
    name: "bday",
    description: "Have Dodoco remind everyone when it's your birthday! ",
    options: [
        {
            name: "month",
            description: "1-12",
            type: "INTEGER",
            required: "true"
        },
        {
            name: "day",
            description: "1-31",
            type: "INTEGER",
            required: true
        }
    ],
    run
}