const {Client, Collection, MessageAttachment, MessageEmbed, Permissions} = require("discord.js")
const Mongoose = require("mongoose")
const CronJob = require("cron").CronJob
const Bday = require("./models/Bday")
const Canvas = require("canvas")

require("dotenv").config()
const guildId = process.env.GUILDID
const bdayChannelId = process.env.BDAYCHANNELID
const testChannelId = process.env.TESTCHANNELID
const testUserId = process.env.TESTUSERID
const mongosrv = process.env.MONGOSRV

const client = new Client({
    intents: [
        "GUILDS",
        "GUILD_MEMBERS"
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
    // StartEventJob()
})

client.on("guildMemberAdd", (member) => {
    console.log("Added member")
    console.log(member.guild.id)
    if(member.guild.id === "776823126490087426") {
        const guild = client.guilds.cache.get("776823126490087426")
        if(!guild) {
            return console.error("Target guild not found")
        }
        const welcomeChannel = guild.channels.cache.get("916438949612883998")
        if(!welcomeChannel) {
            return console.error("Welcome channel not found")
        }
        SendWelcomeEmbed(member.id, guild, welcomeChannel)
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
        console.log("running job...")
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
    // Every hour check database for events that have passed for at least 1 day, delete them
    // Every hour check database 
    const guild = client.guilds.cache.get("776823126490087426")
    if(!guild) {
        return console.error("Target guild not found")
    }
    const everyoneRole = guild.roles.everyone
    const rolesCache = guild.roles.cache
    const eventsCache = guild.scheduledEvents.cache
    const channelsCache = guild.channels.cache
    const category = channelsCache.find(channel => (channel.id === "776823126490087427"))
    if(!category) {
        return console.error("Category not found")
    }
    eventsCache.forEach((event) => {
        const channelName = event.name.replace(/\s+/g, '-').toLowerCase();
        const eventRole = rolesCache.find(role => role.name === event.name)
        // If no role for event, create role
        if(!eventRole) {
            guild.roles.create({"name": event.name}).then((role) => {
                const eventChannel = channelsCache.find(channel => channel.name === channelName)
                // If no channel for event, create channel
                if(!eventChannel) {
                    guild.channels.create(channelName, {
                        topic: `Channel created for the ${event.name} event`,
                        permissionOverwrites: [
                            {
                                id: role.id,
                                allow: [
                                    Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES
                                ]
                            },
                            {
                                id: everyoneRole.id,
                                deny: [
                                    Permissions.FLAGS.VIEW_CHANNEL
                                ]
                            }
                        ]
                    }).then((channel) => {
                        channel.setParent(category.id, {lockPermissions: false}).then(() => {
                            channel.setPosition(0)
                        })
                    })
                }
                // If channel already exists, set appropriate permissions
                else {
                    console.log(eventChannel)
                }
            }).catch((error) => {console.error(error)})
        }
        // There exists role for this event already
        else {
            const eventChannel = channelsCache.find(channel => channel.name === channelName)
            // If no channel for event, create channel
            if(!eventChannel) {
                guild.channels.create(channelName, {
                    topic: `Channel created for the ${event.name} event`,
                    permissionOverwrites: [
                        {
                            id: eventRole.id,
                            allow: [
                                Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES
                            ]
                        },
                        {
                            id: everyoneRole.id,
                            deny: [
                                Permissions.FLAGS.VIEW_CHANNEL
                            ]
                        }
                    ]
                }).then((channel) => {
                    channel.setParent(category.id, {lockPermissions: false}).then(() => {
                        channel.setPosition(0)
                    })
                })
            }
            else {
                console.log(eventChannel)
            }
        }
        event.fetchSubscribers().then((subscribers) => {
            subscribers.forEach((subscriber) => {
                const subscriberId = subscriber.user.id
                console.log(subscriberId)
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
        context.drawImage(background, 0, 0, canvas.width, canvas.height)
        context.font = '64px ja-jp'
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.shadowColor="black";
        context.shadowBlur=10;
        context.lineWidth=8;
        let topText = "Welcome To"
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