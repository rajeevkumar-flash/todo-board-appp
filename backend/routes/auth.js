// backend/routes/auth.js
const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const router = express.Router();
const User = require('../models/User'); // Assuming you have a User model defined here

router.post('/register', registerUser);
router.post('/login', loginUser);

// New route to get all users
// In a real application, you'd want to add authentication/authorization middleware here
// to ensure only authorized users can fetch all user data.
router.get('/all', async (req, res) => {
    try {
        // Fetch all users, excluding their password and __v (Mongoose version key)
        const users = await User.find().select('-password -__v');
        res.json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;