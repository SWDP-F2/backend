const e = require('express');
const reservation = require('../models/Reservation');

//desc Get all reservations
//route GET /api/v1/reservations
//access Public
exports.getReservations = async (req, res, next) => {
    let query;
    if(req.user.role !== 'admin'){
        query = reservation.find({ user: req.user.id });
    } else {
        query = reservation.find();
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
        query = reservation.findById(req.params.id);
        if (query.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to access this reservation' });
        }
    } else {
        query = reservation.findById(req.params.id);
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
        const reservations = await reservation.find({ user: req.params.userId });
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
        const reservations = await reservation.find({ room: req.params.roomId });
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
        //Check that the room exists
        const roomExists = await reservation.findById(req.body.roomId);
        if (!roomExists) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        //Check that the room is available for the requested dates could be added here
        const existingReservation = await reservation.findOne({
            roomId: req.body.roomId,
            date: req.body.date
        });
        if (existingReservation) {
            return res.status(400).json({ success: false, message: 'Room is already booked for the selected date' });
        }
        const reservation = await reservation.create(req.body);
        res.status(201).json({ success: true, data: reservation });
    } catch (err) {
        res.status(400).json({ success: false });
    }
}

//desc Update reservation
//route PUT /api/v1/reservations/:id
//access Private
exports.updateReservation = async (req, res, next) => {
    try {
        let reservation = await reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false });
        }
        if (req.user.role !== 'admin' && reservation.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this reservation' });
        }
        reservation = await reservation.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({ success: true, data: reservation });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Cannot update reservation' });
    } 
}

//desc Delete reservation
//route DELETE /api/v1/reservations/:id
//access Private
exports.deleteReservation = async (req, res, next) => {
    try {
        const reservation = await reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, error: 'Reservation not found' });
        }
        if (req.user.role !== 'admin' && reservation.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this reservation' });
        }
        await reservation.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Cannot delete reservation' });
    }
}
