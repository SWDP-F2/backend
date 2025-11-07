const express = require("express");
const {getReservations, getReservation, getReservationsByUser, getReservationsByRoom, createReservation, updateReservation, deleteReservation} = require("../controllers/reservations");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router.route("/")
    .get(protect, getReservations)
    .post(protect, createReservation);

router.route("/:id")
    .get(protect, getReservation)
    .put(protect, updateReservation)
    .delete(protect, deleteReservation);

router.route("/user/:userId")
    .get(protect, getReservationsByUser);

router.route("/room/:roomId")
    .get(protect, getReservationsByRoom);

module.exports = router;