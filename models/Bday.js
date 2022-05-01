const Mongoose = require("mongoose")

const Bday = Mongoose.Schema({
    userId: String,
    month: Number,
    day: Number
})

module.exports = Mongoose.model("Bday", Bday)