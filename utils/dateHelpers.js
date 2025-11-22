const CurrentDate = require('../models/CurrentDate');
const Reservation = require('../models/Reservation');

// Helper to get the current date value from DB or today
async function getCurrentDateValue() {
    let currentDateDoc = await CurrentDate.findOne();
    let today;
    if (!currentDateDoc) {
        today = new Date();
        today.setHours(0, 0, 0, 0);
    } else {
        today = new Date(currentDateDoc.date);
        today.setHours(0, 0, 0, 0);
    }
    return today;
}

// Helper to update expired reservations
async function updateExpiredReservations() {
    try {
        const today = await getCurrentDateValue();
        const result = await Reservation.updateMany(
            {
                status: 'active',
                date: { $lt: today }
            },
            {
                status: 'inactive'
            }
        );
        return result;
    } catch (error) {
        console.error('Error updating expired reservations:', error);
        throw error;
    }
}

module.exports = {
    getCurrentDateValue,
    updateExpiredReservations
};
