const express = require('express');
const router = express.Router();
const { getUsers, getUser, deleteUser } = require('../controllers/users');

router
    .route('/')
    .get(getUsers);
router
    .route('/:id')
    .get(getUser)
    .delete(deleteUser);
module.exports = router;