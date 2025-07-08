// backend/models/ActionLog.js
const mongoose = require('mongoose');

const ActionLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: { // Denormalized for easier display
        type: String,
        required: true
    },
    actionType: {
        type: String,
        required: true,
        enum: [
            'TASK_CREATED',
            'TASK_UPDATED_TITLE',
            'TASK_UPDATED_DESCRIPTION',
            'TASK_STATUS_CHANGED',
            'TASK_ASSIGNED',
            'TASK_PRIORITY_CHANGED',
            'TASK_DELETED',
            'TASK_DRAGGED' // For drag-drop operations
        ]
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    taskTitle: { // Denormalized
        type: String,
        required: true
    },
    details: { // Store old/new values, or other relevant info
        type: mongoose.Schema.Types.Mixed, // Can be any data type
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ActionLog', ActionLogSchema);