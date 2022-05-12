const {Client, Collection, MessageAttachment, MessageEmbed, Permissions} = require("discord.js")
const Mongoose = require("mongoose")
const CronJob = require("cron").CronJob
const Bday = require("./models/Bday")
const Canvas = require("canvas")
const { collection } = require("./models/Bday")

require("dotenv").config()
const guildId = process.env.GUILDID
const bdayChannelId = process.env.BDAYCHANNELID
const welcomeChannelId = process.env.WELCOMECHANNELID
const testChannelId = process.env.TESTCHANNELID
const testUserId = process.env.TESTUSERID
const mongosrv = process.env.MONGOSRV

const client = new Client({
    intents: [
        "GUILDS",
        "GUILD_MEMBERS",
        "GUILD_SCHEDULED_EVENTS"
    ]
})

let bot = {client}

client.on("ready", () => {
    console.log("Bot online")
    client.user.setActivity("/help",
        {
            type: "LISTENING"
        }
    )
    DeploymentTest()
    StartBirthdayJob()
})

client.on("guildMemberAdd", (member) => {
    console.log("Added member")
    console.log(member.guild.id)
    if(member.guild.id === guildId) {
        const guild = client.guilds.cache.get(guildId)
        if(!guild) {
            return console.error("Target guild not found")
        }
        const welcomeChannel = guild.channels.cache.get(welcomeChannelId)
        if(!welcomeChannel) {
            return console.error("Welcome channel not found")
        }
        SendWelcomeEmbed(member.id, guild, welcomeChannel)
    }
})

client.on("guildScheduledEventCreate", (event) => {
    console.log("Created event")
    if(event.guild.id === guildId) {
        const guild = client.guilds.cache.get(guildId)
        if(!guild) {
            return console.error("Target guild not found")
        }
        guild.roles.create({name: event.name})
    }
})

client.on("guildScheduledEventUserAdd", (event, user) => {
    console.log("User added to event")
    if(event.guild.id === guildId) {
        const guild = client.guilds.cache.get(guildId)
        if(!guild) {
            return console.error("Target guild not found")
        }
        const logsChannel = guild.channels.cache.get("903529627945951262")
        if(!logsChannel) {
            return console.error("Logs channel not found")
        }
        const eventRole = guild.roles.cache.find(role => role.name === event.name)
        if(!eventRole) {
            return console.error("Event role not found")
        }
        guild.members.fetch(user.id).then((member) => {
            member.roles.add(eventRole)
            logsChannel.send(`Added role ${eventRole.name} to ${member.nickname}`)
        })
    }
})

client.on("guildScheduledEventUserRemove", (event, user) => {
    console.log("User removed from event")
    if(event.guild.id === guildId) {
        const guild = client.guilds.cache.get(guildId)
        if(!guild) {
            return console.error("Target guild not found")
        }
        const logsChannel = guild.channels.cache.get("903529627945951262")
        if(!logsChannel) {
            return console.error("Logs channel not found")
        }
        const eventRole = guild.roles.cache.find(role => role.name === event.name)
        if(!eventRole) {
            return console.error("Event role not found")
        }
        guild.members.fetch(user.id).then((member) => {
            member.roles.remove(eventRole)
            logsChannel.send(`Removed role ${eventRole.name} from ${member.nickname}`)
        })
    }
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

const DeploymentTest = () => {
    const guild = client.guilds.cache.get(guildId)
    if(!guild) {
        return console.error("Target guild not found")
    }
    const testChannel = guild.channels.cache.get(testChannelId)
    if(!testChannel) {
        return console.error("Test channel not found")
    }
    const bdayChannel = guild.channels.cache.get(bdayChannelId)
    if(!bdayChannel) {
        console.error("Birthdays channel not found")
    }
    const date = new Date()
    testChannel.send(`Deployment test at ${date.toLocaleString("en-US", {timeZone: "PST"})}`)
    SendBdayEmbed(testUserId, guild, testChannel)
    SendWelcomeEmbed(testUserId, guild, testChannel)
    const helpcmd = client.slashcommands.get("help")
    const helpEmbed = helpcmd.helpEmbed()
    testChannel.send({embeds: [helpEmbed]})
}

const StartBirthdayJob = () => {
    console.log("setting bday job...")
    const birthdayJob = new CronJob('1 0 * * *', () => {
        console.log("running bday job...")
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
            const bdayChannel = guild.channels.cache.get(bdayChannelId)
            if(!bdayChannel) {
                return console.error("Birthdays channel not found")
            }
            bdays.forEach((bday) => {
                SendBdayEmbed(bday.userId, guild, bdayChannel)
            })
            const testChannel = guild.channels.cache.get(testChannelId)
            if(!testChannel) {
                return console.error("Test channel not found")
            }
            testChannel.send("Test message for cron...")
            SendBdayEmbed(testUserId, guild, testChannel)
        })
    }, null, true, "America/Los_Angeles");
    birthdayJob.start();
}

const StartEventJob = () => {
    console.log("setting event job...")
    const eventJob = new CronJob('15 * * * *', () => {
        console.log("running event job...")
        const guild = client.guilds.cache.get(guildId)
        if(!guild) {
            return console.error("Target guild not found")
        }
        const eventsCache = guild.scheduledEvents.cache
        const rolesCache = guild.roles.cache
        eventsCache.forEach((event) => {
            const eventRole = rolesCache.find(role => role.name === event.name)
            if(!eventRole) {
                guild.roles.create({name: event.name}).then((role) => {
                    AddSubscribersToRole(guild, event, role)
                })
            }
            else {
                AddSubscribersToRole(guild, event, eventRole)
            }
        })
    }, null, true, "America/Los_Angeles");
    eventJob.start();
}

const AddSubscribersToRole = (guild, event, role) => {
    event.fetchSubscribers().then((subscribers) => {
        subscribers.forEach((subscriber) => {
            guild.members.fetch(subscriber.user.id).then((member) => {
                member.roles.add(role)
            })
        })
    })
}

const SendBdayEmbed = (userId, guild, channel) => {
    console.log("Sending a BdayEmbed...")
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

        guild.members.fetch(userId)
        .then((user) => {
            Canvas.loadImage(user.displayAvatarURL({format: "jpg"})).then((avatar) => {
                context.drawImage(avatar, canvas.width/2 - avatarHeight/2, canvas.height/2 - avatarHeight/2 - 75, avatarHeight, avatarHeight)
                const attachment = new MessageAttachment(canvas.toBuffer(), "happybday.png")
                const embed = new MessageEmbed()
                .setColor(user.displayHexColor)
                .setTitle("🎂 HAPPY BIRTHDAY 🎂")
                .setDescription(`Everyone wish <@${userId}> a happy birthday! <:klee_heart:965992961064177754>`)
                .setImage("attachment://happybday.png")
                .setFooter({text: "Use /bday to register/update your birthday. Use /forget to remove your birthday."})
                channel.send({embeds: [embed], files: [attachment]})
            })
        }).catch((error) => {
            console.log("Couldn't find user")
            console.log(error)
        })
    })
}

const SendWelcomeEmbed = (userId, guild, channel) => {
    console.log("Sending a WelcomeEmbed...")
    const canvasWidth = 850
    const canvasHeight = 478
    const avatarHeight = 200
    Canvas.registerFont("./.fonts/ja-jp.ttf", {family: "ja-jp"})
    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight)
    const context = canvas.getContext("2d")
    Canvas.loadImage("./images/genshinwelcome.jpg")
    .then((background) => {
        context.globalAlpha = 1.0
        context.drawImage(background, 0, 0, canvas.width, canvas.height)
        context.globalAlpha = 0.05
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.globalAlpha = 1.0
        context.font = '64px ja-jp'
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.shadowColor="black";
        context.shadowBlur=10;
        context.lineWidth=8;
        let topText = "Welcome to"
        context.fillText(topText, canvas.width / 2, canvas.height * .15)
        context.shadowBlur=0;
        context.fillStyle="white";
        context.fillText(topText, canvas.width / 2, canvas.height * .15)
        context.shadowBlur=10;
        let botText = "UCLA Genshin Impact!"
        context.fillText(botText, canvas.width / 2, canvas.height * .85)
        context.shadowBlur=0;
        context.fillStyle="white";
        context.fillText(botText, canvas.width / 2, canvas.height * .85)

        context.beginPath()
        context.arc(canvas.width/2, canvas.height/2, avatarHeight/2, 0, Math.PI * 2, true)
        context.closePath()
        context.clip()

        guild.members.fetch(userId)
        .then((user) => {
            Canvas.loadImage(user.displayAvatarURL({format: "jpg"})).then((avatar) => {
                context.drawImage(avatar, canvas.width/2 - avatarHeight/2, canvas.height/2 - avatarHeight/2, avatarHeight, avatarHeight)
                const attachment = new MessageAttachment(canvas.toBuffer(), "welcome.png")
                channel.send({content: `Welcome <@${userId}> to UCLA Genshin Impact!`, files: [attachment]})
            })
        }).catch((error) => {
            console.log("Couldn't find user")
            console.log(error)
        })
    })
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