const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },tel: {
        type: String,
        required: true
    },openHours: {
        type: String,
        required: true
    },closeHours: {
        type: String,
        required: true
    }
},{ toJSON: { virtuals: true }, toObject: { virtuals: true } });

roomSchema.virtual('reservation', {
    ref: 'Reservation',
    localField: '_id',
    foreignField: 'room',
    justOne: false
});

module.exports = mongoose.model('Room', roomSchema);