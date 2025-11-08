const express = require('express');
const router = express.Router();
const { getUsers, getUser, deleteUser } = require('../controllers/users');

const { protect, authorize } = require("../middleware/auth");

router
    .route('/')
    .get(protect, authorize('admin'), getUsers);
router
    .route('/:id')
    .get(protect, getUser)
    .delete(protect, deleteUser);
module.exports = router;