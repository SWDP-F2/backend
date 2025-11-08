const express = require('express');
const router = express.Router();
const {
    getRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom
} = require('../controllers/rooms');

const { protect, authorize } = require("../middleware/auth");

router
    .route('/')
    .get(protect, getRooms)
    .post(protect, authorize('admin'), createRoom);
router
    .route('/:id')
    .get(protect, getRoom)
    .put(protect, authorize('admin'), updateRoom)
    .delete(protect, authorize('admin'), deleteRoom);

module.exports = router;

