const {MessageEmbed} = require("discord.js")
const Bday = require("../models/Bday")

const bdaysEmbed = (month) => {
  return new Promise((resolve, reject) => {
    const query = {
      month: {$eq: month}
    }
    Bday.find(query).sort({day: 1})
    .then((bdays) => {
      let bdayArr = []
      bdays.forEach((bday) => {
        bdayArr.push(`${bday.month}/${bday.day} - <@${bday.userId}>`)
      })
      const embed = new MessageEmbed()
      .setColor("#fdf8c7")
      .setTitle(`Birthdays in month ${month}`)
      .setDescription(bdayArr.join("\n"))
      resolve(embed)
    }).catch((error) => {
      console.log(error)
      const embed = new MessageEmbed()
      .setColor("#fdf8c7")
      .setTitle(`Birthdays in month ${month}`)
      .setDescription("Failed to fetch")
      reject(embed)
    })
  })
}

const run = async(client, interaction) => {
  let month = interaction.options.getInteger("month")
  if(month <= 0 || month > 12) {
    return interaction.reply("Enter a valid month you fucking idiot")
  }
  bdaysEmbed(month).then((embed) => {
    return interaction.reply({embeds: [embed]})
  }).catch((error) => {
    return interaction.reply({embeds: [embed]})
  })
}

module.exports = {
  name: "bdays",
  description: "List all stored birthdays in a month",
  perm: "MANAGE_ROLES",
  options: [
      {
        name: "month",
        description: "1-12",
        type: "INTEGER",
        required: true
      }
  ],
  run,
  bdaysEmbed
}