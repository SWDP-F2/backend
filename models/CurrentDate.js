const mongoose = require('mongoose');

const CurrentDateSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: () => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return now;
        }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CurrentDate', CurrentDateSchema);