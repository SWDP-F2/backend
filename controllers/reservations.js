const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const CurrentDate = require('../models/CurrentDate');

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

// Function to update expired reservations
const updateExpiredReservations = async () => {
    try {
        const today = await exports.getCurrentDate();
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
};

//desc Get all reservations
//route GET /api/v1/reservations
//access Public
exports.getReservations = async (req, res, next) => {
    try {
        await updateExpiredReservations();
        
        let query;
        if(req.user.role !== 'admin'){
            query = Reservation.find({ user: req.user.id });
        } else {
            query = Reservation.find();
        }

        const reservations = await query;
        res.status(200).json({ success: true, count: reservations.length, data: reservations });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Cannot find reservations' });
    }
}

//desc Get active reservations
//route GET /api/v1/reservations/active
//access Public
exports.getActiveReservations = async (req, res, next) => {
    try {
        await updateExpiredReservations();

        let query;
        if(req.user.role !== 'admin'){
            query = Reservation.find({ user: req.user.id, status: 'active' });
        } else {
            query = Reservation.find({ status: 'active' });
        }

        const reservations = await query;
        res.status(200).json({ success: true, count: reservations.length, data: reservations });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Cannot find reservations' });
    }
}

//desc Get single reservation 
//route GET /api/v1/reservations/:id
//access Public
exports.getReservation = async (req, res, next) => {
    try {
        await updateExpiredReservations();
        
        let query;
        if(req.user.role !== 'admin'){
            query = Reservation.findById(req.params.id);
            const reservation = await query;
            if (!reservation) {
                return res.status(404).json({ success: false, error: 'Reservation not found' });
            }
            if (reservation.user.toString() !== req.user.id) {
                return res.status(401).json({ success: false, message: 'Not authorized to access this reservation' });
            }
            res.status(200).json({ success: true, data: reservation });
        } else {
            query = Reservation.findById(req.params.id);
            const reservation = await query;
            if (!reservation) {
                return res.status(404).json({ success: false, error: 'Reservation not found' });
            }
            res.status(200).json({ success: true, data: reservation });
        }
    } catch (err) {
        res.status(400).json({ success: false, error: 'Cannot find reservation' });
    }
}

//desc Get reservations by userId
//route GET /api/v1/reservations/user/:userId
//access Public
exports.getReservationsByUser = async (req, res, next) => {
    try {
        await updateExpiredReservations();
        
        let query;
        if(req.user.role === 'admin'){
            query = Reservation.find({ user: req.params.userId });
        } else {
            if(req.user.id !== req.params.userId){
                return res.status(401).json({ success: false, message: 'Not authorized to access these reservations' });
            }
            query = Reservation.find({ user: req.params.userId });
        }
        
        const reservations = await query;
        res.status(200).json({ success: true, count: reservations.length, data: reservations });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Cannot find reservations' });
    }
}

//desc Get Reservations by roomId
//route GET /api/v1/reservations/room/:roomId
//access Public
exports.getReservationsByRoom = async (req, res, next) => {
    try {
        await updateExpiredReservations();
        
        const reservations = await Reservation.find({ room: req.params.roomId });
        res.status(200).json({ success: true, count: reservations.length, data: reservations });
    } catch (err) {
        res.status(400).json({ success: false });
    }
}

//desc Create new reservation
//route POST /api/v1/reservations
//access Private
exports.createReservation = async (req, res, next) => {    
    try {
        await updateExpiredReservations();
        
        if (req.user.role !== 'admin' && req.body.user !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to create reservation for this user' });
        }
        if (req.body.date) {
            const inputDate = new Date(req.body.date);
            inputDate.setHours(0, 0, 0, 0);
            req.body.date = inputDate;
        }
        const currentDate = await exports.getCurrentDate();
        if (req.body.date < currentDate) {
            return res.status(400).json({ success: false, message: 'Cannot create reservation for a past date' });
        }
        const roomExists = await Room.findById(req.body.room);
        if (!roomExists) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        const existingReservation = await Reservation.findOne({
            room: req.body.room,
            date: req.body.date
        });
        if (existingReservation) {
            if (existingReservation.user.toString() === req.body.user) {
                return res.status(400).json({ success: false, message: 'You have already booked this room for the selected date' });
            }
            return res.status(400).json({ success: false, message: 'Room is already booked for the selected date' });
        }
        const userReservationsCount = await Reservation.countDocuments({ user: req.body.user, status: 'active' });
        if (userReservationsCount >= 3) {
            return res.status(400).json({ success: false, message: 'User cannot have more than 3 active reservations' });
        }
        const reservation = await Reservation.create(req.body);
        res.status(201).json({ success: true, data: reservation });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}

//desc Update reservation
//route PUT /api/v1/reservations/:id
//access Private
exports.updateReservation = async (req, res, next) => {
    try {
        await updateExpiredReservations();
        
        let reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false });
        }
        if (req.user.role !== 'admin' && reservation.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this reservation' });
        }
        if (req.body.user && req.body.user !== reservation.user.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot change the user of the reservation' });
        }
        if (req.body.room && req.body.room !== reservation.room.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot change the room of the reservation' });
        }
        if (req.body.date) {
            const inputDate = new Date(req.body.date);
            inputDate.setHours(0, 0, 0, 0);
            req.body.date = inputDate;
        }
        const currentDate = await exports.getCurrentDate();
        if (req.body.date < currentDate) {
            return res.status(400).json({ success: false, message: 'Cannot set reservation to a past date' });
        }
        const existingReservation = await Reservation.findOne({
            room: reservation.room,
            date: req.body.date
        });
        if (existingReservation) {
            if (existingReservation.user.toString() === req.user.id) {
                return res.status(400).json({ success: false, message: 'You have already booked this room for the selected date' });
            }
            return res.status(400).json({ success: false, message: 'Room is already booked for the selected date' });
        }
        reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({ success: true, data: reservation });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    } 
}

//desc Delete reservation
//route DELETE /api/v1/reservations/:id
//access Private
exports.deleteReservation = async (req, res, next) => {
    try {
        await updateExpiredReservations();
        
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, error: 'Reservation not found' });
        }
        if (req.user.role !== 'admin' && reservation.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this reservation' });
        }
        await Reservation.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Cannot delete reservation' });
    }
}


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
