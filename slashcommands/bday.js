const run = async(client, interaction) => {
    let month = interaction.options.getInteger("month")
    let day = interaction.options.getInteger("day")
    if(!validDate(day, month)) {
        return interaction.reply("Please enter a valid date!")
    }
    return interaction.reply("valid date")
}

const validDate = (day, month) => {
    if(day <= 0 || day > 31) {
        return false
    }
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
    description: "Enter your birthday",
    options: [
        {
            name: "day",
            description: "Day of the month you were born.",
            type: "INTEGER",
            required: true
        },
        {
            name: "month",
            description: "Month you were born.",
            type: "INTEGER",
            required: "true"
        }
    ],
    run
}