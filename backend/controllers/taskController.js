const Task = require('../models/Task');
const User = require('../models/User');
const ActionLog = require('../models/ActionLog');

const COLUMN_NAMES = ['Todo', 'In Progress', 'Done']; // For validation

// Helper function to emit real-time updates
const emitTaskUpdate = (io, eventType, data) => {
    io.emit(eventType, data);
    console.log(`Emitted ${eventType} event:`, data);
};

// Helper function to log action
const logAction = async (userId, username, actionType, taskId, taskTitle, details = {}) => {
    try {
        await ActionLog.create({
            userId,
            username,
            actionType,
            taskId,
            taskTitle,
            details,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error logging action:', error);
    }
};

// Create a new task
const createTask = async (req, res) => {
    const { title, description, assignedUser, status, priority } = req.body;
    const io = req.app.get('socketio');

    if (!title || !assignedUser || !status || !priority) {
        return res.status(400).json({ message: 'Please provide title, assigned user, status, and priority' });
    }

    try {
        const existingTask = await Task.findOne({ title });
        if (existingTask) {
            return res.status(400).json({ message: 'Task title must be unique per board.' });
        }

        if (COLUMN_NAMES.includes(title)) {
            return res.status(400).json({ message: `Task title cannot be "${title}", as it matches a column name.` });
        }

        const task = await Task.create({
            title,
            description,
            assignedUser,
            status,
            priority,
            createdBy: req.user._id,
            lastModifiedBy: req.user._id,
            lastModifiedAt: new Date(),
            version: 1
        });
        await task.populate('assignedUser', 'username email');

        await logAction(req.user._id, req.user.username, 'TASK_CREATED', task._id, task.title, {
            assignedTo: task.assignedUser
        });

        emitTaskUpdate(io, 'taskCreated', task);
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all tasks
const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find({})
            .populate('assignedUser', 'username email')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single task by ID
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedUser', 'username email')
            .populate('createdBy', 'username');

        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (error) {
        console.error('Error fetching task by ID:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a task (with conflict handling and field-specific logging)
const updateTask = async (req, res) => {
    const { title, description, assignedUser, status, priority, clientVersion, clientLastModifiedAt } = req.body;
    const io = req.app.get('socketio');

    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (clientVersion && task.version > clientVersion) {
            return res.status(409).json({
                message: 'Conflict: Task has been updated by another user. Please resolve.',
                serverTask: task.toObject(),
                clientAttempt: { title, description, assignedUser, status, priority }
            });
        }

        const updates = {};
        const changes = {};

        if (title && title !== task.title) {
            const existing = await Task.findOne({ title, _id: { $ne: task._id } });
            if (existing) return res.status(400).json({ message: 'Task title must be unique per board.' });
            if (COLUMN_NAMES.includes(title)) {
                return res.status(400).json({ message: `Task title cannot be "${title}", as it matches a column name.` });
            }
            changes.oldTitle = task.title;
            updates.title = title;
            changes.newTitle = title;
        }

        if (description !== undefined && description !== task.description) {
            changes.oldDescription = task.description;
            updates.description = description;
            changes.newDescription = description;
        }

        if (assignedUser && assignedUser !== String(task.assignedUser)) {
            const oldAssignedUser = await User.findById(task.assignedUser).select('username');
            const newAssignedUser = await User.findById(assignedUser).select('username');
            changes.oldAssignedUser = oldAssignedUser ? oldAssignedUser.username : 'Unknown';
            updates.assignedUser = assignedUser;
            changes.newAssignedUser = newAssignedUser ? newAssignedUser.username : 'Unknown';
        }

        if (status && status !== task.status) {
            changes.oldStatus = task.status;
            updates.status = status;
            changes.newStatus = status;
        }

        if (priority && priority !== task.priority) {
            changes.oldPriority = task.priority;
            updates.priority = priority;
            changes.newPriority = priority;
        }

        updates.lastModifiedBy = req.user._id;
        updates.lastModifiedAt = new Date();
        updates.version = task.version + 1;

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('assignedUser', 'username email');

        if (Object.keys(changes).length > 0) {
            if (changes.oldTitle || changes.newTitle) {
                await logAction(req.user._id, req.user.username, 'TASK_UPDATED_TITLE', updatedTask._id, updatedTask.title, changes);
            }
            if (changes.oldDescription || changes.newDescription) {
                await logAction(req.user._id, req.user.username, 'TASK_UPDATED_DESCRIPTION', updatedTask._id, updatedTask.title, changes);
            }
            if (changes.oldStatus || changes.newStatus) {
                await logAction(req.user._id, req.user.username, 'TASK_STATUS_CHANGED', updatedTask._id, updatedTask.title, changes);
            }
            if (changes.oldPriority || changes.newPriority) {
                await logAction(req.user._id, req.user.username, 'TASK_PRIORITY_CHANGED', updatedTask._id, updatedTask.title, changes);
            }
            if (changes.oldAssignedUser || changes.newAssignedUser) {
                await logAction(req.user._id, req.user.username, 'TASK_ASSIGNED', updatedTask._id, updatedTask.title, changes);
            }
        }

        emitTaskUpdate(io, 'taskUpdated', updatedTask);
        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a task
const deleteTask = async (req, res) => {
    const io = req.app.get('socketio');
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        await Task.deleteOne({ _id: req.params.id });

        await logAction(req.user._id, req.user.username, 'TASK_DELETED', task._id, task.title);
        emitTaskUpdate(io, 'taskDeleted', { taskId: req.params.id });

        res.json({ message: 'Task removed' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Smart Assign: assign task to user with fewest active tasks
const smartAssignTask = async (req, res) => {
    const io = req.app.get('socketio');
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'User not authenticated for this action.' });
        }

        if (!task.createdBy) {
            task.createdBy = req.user._id;
        }

        const usersWithTaskCounts = await User.aggregate([
            {
                $lookup: {
                    from: 'tasks',
                    localField: '_id',
                    foreignField: 'assignedUser',
                    as: 'assignedTasks'
                }
            },
            {
                $project: {
                    username: 1,
                    email: 1,
                    activeTasksCount: {
                        $size: {
                            $filter: {
                                input: '$assignedTasks',
                                as: 'task',
                                cond: { $ne: ['$$task.status', 'Done'] }
                            }
                        }
                    }
                }
            },
            { $sort: { activeTasksCount: 1 } },
            { $limit: 1 }
        ]);

        if (usersWithTaskCounts.length === 0) {
            return res.status(500).json({ message: 'No users available for smart assignment.' });
        }

        const lowestTaskUser = usersWithTaskCounts[0];
        if (lowestTaskUser._id.equals(task.assignedUser)) {
            return res.status(200).json({ message: 'Task is already assigned to the user with the fewest active tasks.', task });
        }

        const oldAssignedUser = await User.findById(task.assignedUser).select('username');
        const oldAssignedUsername = oldAssignedUser ? oldAssignedUser.username : 'Unknown';
        const newAssignedUsername = lowestTaskUser.username;

        task.assignedUser = lowestTaskUser._id;
        task.lastModifiedBy = req.user._id;
        task.lastModifiedAt = new Date();
        task.version += 1;

        await task.save();

        await logAction(
            req.user._id,
            req.user.username,
            'TASK_ASSIGNED',
            task._id,
            task.title,
            { from: oldAssignedUsername, to: newAssignedUsername, assignedBy: 'Smart Assign' }
        );

        const updatedTask = await task.populate('assignedUser', 'username email');
        emitTaskUpdate(io, 'taskUpdated', updatedTask);

        res.json(updatedTask);
    } catch (error) {
        console.error('Error in smart assign:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message, errors: error.errors });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
    smartAssignTask
};
