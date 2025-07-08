// backend/routes/actions.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const ActionLog = require('../models/ActionLog');
const router = express.Router();

// @desc    Get last 20 actions
// @route   GET /api/actions/latest
// @access  Private
router.get('/latest', protect, async (req, res) => {
    try {
        // Find all action logs, sort by timestamp descending, and limit to 20
        const actions = await ActionLog.find({})
            .sort({ timestamp: -1 }) // Sort descending by timestamp
            .limit(20); // Limit to the last 20 actions

        res.json(actions);
    } catch (error) {
        console.error('Error fetching latest actions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;