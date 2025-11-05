const express = require('express');
const router = express.Router();
const {
    getRooms,
} = require('../controllers/rooms');

router
    .route('/')
    .get(getRooms);

module.exports = router;

