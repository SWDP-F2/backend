const CurrentDate = require('../models/CurrentDate');
const { updateExpiredReservations } = require('../utils/dateHelpers');

// Helper function to get current date from MongoDB
exports.getCurrentDate = async (req, res) => {
    try {
        let query = await CurrentDate.findOne();
        if (!query) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return res.status(200).json({ success: true, currentDate: now });
        }
        return res.status(200).json({ success: true, currentDate: query.date });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};



//desc Set current date for testing
//route PUT /api/v1/reservations/current-date
//access 
exports.putCurrentDate = async (req, res, next) => {
    try {
        const { date } = req.body;
        let dateRecord = await CurrentDate.findOne();
        
        if (!dateRecord) {
            dateRecord = new CurrentDate();
        }
        
        if (date) {
            const newDate = new Date(date);
            newDate.setHours(0, 0, 0, 0);
            dateRecord.date = newDate;
        } else {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            dateRecord.date = now;
        }
        
        await dateRecord.save();
        await updateExpiredReservations();

        res.status(200).json({ 
            success: true, 
            message: date ? 'Current date set for testing' : 'Reset to real current date',
            data: dateRecord
        });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Failed to set current date' });
    }
}