// backend/routes/tasks.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
    smartAssignTask // Will be created in Phase 3
} = require('../controllers/taskController');
const router = express.Router();

router.route('/')
    .post(protect, createTask)
    .get(protect, getAllTasks);

router.route('/:id')
    .get(protect, getTaskById)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

router.put('/:id/smart-assign', protect, smartAssignTask); // For Smart Assign

module.exports = router;