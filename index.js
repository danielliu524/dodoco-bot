const {Client, Collection, MessageAttachment, MessageEmbed} = require("discord.js")
const Mongoose = require("mongoose")
const CronJob = require("cron").CronJob
const Bday = require("./models/Bday")
const Canvas = require("canvas")

require("dotenv").config()
const guildId = process.env.GUILDID
const announceChannelId = process.env.CHANNELID
const mongosrv = process.env.MONGOSRV

const client = new Client({
    intents: [
        "GUILDS",
        "GUILD_MEMBERS"
    ]
})

let bot = {client}

client.on("ready", () => {
    const guild = client.guilds.cache.get(guildId)
    console.log("Loading slash commands...")
    if(!guild) {
        return console.error("Target guild not found")
    }
    guild.commands.set([...client.slashcommands.values()])
    .then(() => {
        console.log(`Successfully loaded in ${client.slashcommands.size} command(s)`)
        console.log("Bot online")
        client.user.setActivity("/help",
            {
                type: "LISTENING"
            }
        )
        StartBirthdayJob()
    })
})

client.slashcommands = new Collection()

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

const StartBirthdayJob = () => {
    const birthdayJob = new CronJob('* * * * *', () => {
        const date = new Date()
        let monthNow = date.getMonth() + 1
        let dayNow = date.getDate()
        const query = {
            month: {$eq: monthNow},
            day: {$eq: dayNow}
        }
        Bday.find(query)
        .then((bdays) => {
            const guild = client.guilds.cache.get(guildId)
            if(!guild) {
                return console.error("Target guild not found")
            }
            const announce = guild.channels.cache.get(announceChannelId)
            if(!announce) {
                return console.error("Target channel not found")
            }
            bdays.forEach((bday) => {
                const canvasWidth = 850
                const canvasHeight = 510
                const avatarHeight = 230
                Canvas.registerFont("./.fonts/ja-jp.ttf", {family: "ja-jp"})
                const canvas = Canvas.createCanvas(canvasWidth, canvasHeight)
                const context = canvas.getContext("2d")
                Canvas.loadImage("./images/paimonbday.jpg")
                .then((background) => {
                    context.drawImage(background, 0, 0, canvas.width, canvas.height)
                    context.font = '72px ja-jp'
                    context.textAlign = "center"
                    context.textBaseline = "middle"
                    context.shadowColor="black";
                    context.shadowBlur=10;
                    context.lineWidth=8;
                    var ctext = "HAPPY BIRTHDAY"
                    context.fillText(ctext, canvas.width / 2, canvas.height * .85)
                    context.shadowBlur=0;
                    context.fillStyle="white";
                    context.fillText(ctext, canvas.width / 2, canvas.height * .85)

                    context.beginPath()
                    context.arc(canvas.width/2, canvas.height/2 - 75, avatarHeight/2, 0, Math.PI * 2, true)
                    context.closePath()
                    context.clip()

                    guild.members.fetch(bday.userId)
                    .then((user) => {
                        Canvas.loadImage(user.displayAvatarURL({format: "jpg"})).then((avatar) => {
                            context.drawImage(avatar, canvas.width/2 - avatarHeight/2, canvas.height/2 - avatarHeight/2 - 75, avatarHeight, avatarHeight)
                            const attachment = new MessageAttachment(canvas.toBuffer(), "happybday.png")
                            const embed = new MessageEmbed()
                            .setColor(user.displayHexColor)
                            .setTitle("🎂 HAPPY BIRTHDAY 🎂")
                            .setDescription(`Happy birthday to <@${bday.userId}>!`)
                            .setImage("attachment://happybday.png")
                            announce.send({embeds: [embed], files: [attachment]})
                        })
                    }).catch((error) => {
                        console.log("Couldn't find user")
                        console.log(error)
                    })
                })
            })
        })
    }, null, true, 'America/Los_Angeles');
    birthdayJob.start();
}

Mongoose.connect(mongosrv, {
    wtimeoutMS:2500,
    useNewUrlParser:true
}).then(() => {
    console.log("Connected to database")
    client.login(process.env.TOKEN);
}).catch((error) => {
    console.log(error)
})