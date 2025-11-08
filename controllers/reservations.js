const e = require('express');
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');

//desc Get all reservations
//route GET /api/v1/reservations
//access Public
exports.getReservations = async (req, res, next) => {
    let query;
    if(req.user.role !== 'admin'){
        query = Reservation.find({ user: req.user.id });
    } else {
        query = Reservation.find();
    }

    try {
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
    let query;
    if(req.user.role !== 'admin'){
        query = Reservation.findById(req.params.id);
        if (query.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to access this reservation' });
        }
    } else {
        query = Reservation.findById(req.params.id);
    }

    try {
        const reservation = await query;
        if (!reservation) {
            return res.status(404).json({ success: false, error: 'Reservation not found' });
        }
        res.status(200).json({ success: true, data: reservation });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Cannot find reservation' });
    }
}

//desc Get reservations by userId
//route GET /api/v1/reservations/user/:userId
//access Public
exports.getReservationsByUser = async (req, res, next) => {
    try {
        const reservations = await Reservation.find({ user: req.params.userId });
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
        if (req.user.role !== 'admin' && req.body.user !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to create reservation for this user' });
        }
        // Process the date to remove time component
        if (req.body.date) {
            const inputDate = new Date(req.body.date);
            inputDate.setHours(0, 0, 0, 0); // Set time to 00:00:00
            req.body.date = inputDate;
        }
        //Check that the room exists
        const roomExists = await Room.findById(req.body.room);
        if (!roomExists) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        //Check that the room is available for the requested dates could be added here
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
        //Check that the user is not booking more that 3 reservations
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
        // Process the date to remove time component
        if (req.body.date) {
            const inputDate = new Date(req.body.date);
            inputDate.setHours(0, 0, 0, 0); // Set time to 00:00:00
            req.body.date = inputDate;
        }
        //Check that the room is available for the requested dates could be changed here
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
