const User = require('../models/User');
const Reservation = require('../models/Reservation');

//desc Get all users
//route GET /api/v1/users
//access Private/Admin
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(400).json({ success: false });
    }
}

//desc Get single user
//route GET /api/v1/users/:id
//access Private/Admin
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to access this user' });
        }
        res.status(200).json({ success: true, data: user });
    }
    catch (err) {
        res.status(400).json({ success: false });
    }
}

//desc Delete user
//route DELETE /api/v1/users/:id
//access Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this user' });
        }
        await user.deleteOne();
        //Delete all reservations for this user
        await Reservation.deleteMany({ user: req.params.id });
        // logout if the user deletes their own account
        if (req.user.id === req.params.id) {
            res.clearCookie('token');
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false , error: err.message });
    }
}