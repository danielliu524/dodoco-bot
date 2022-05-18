const Mongoose = require("mongoose")

const Event = Mongoose.Schema({
    eventId: String,
    startTime: Number,
    name: String
})

module.exports = Mongoose.model("Event", Event)