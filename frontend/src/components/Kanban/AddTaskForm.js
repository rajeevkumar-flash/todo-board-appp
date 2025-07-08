// frontend/src/components/Kanban/AddTaskForm.js
import React, { useState, useEffect } from 'react';
import '../../styles/AddTaskForm.css'; // Custom styles

function AddTaskForm({ onAddTask, onClose, allUsers }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedUser, setAssignedUser] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [status, setStatus] = useState('Todo'); // Default status

    useEffect(() => {
        if (allUsers.length > 0) {
            setAssignedUser(allUsers[0]._id); // Set first user as default
        }
    }, [allUsers]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !assignedUser) {
            alert('Title and Assigned User are required!');
            return;
        }
        onAddTask({ title, description, assignedUser, status, priority });
        // Reset form
        setTitle('');
        setDescription('');
        setAssignedUser(allUsers.length > 0 ? allUsers[0]._id : '');
        setPriority('Medium');
        setStatus('Todo');
    };

    return (
        <div className="add-task-form-container">
            <form onSubmit={handleSubmit} className="add-task-form">
                <h3>Add New Task</h3>
                <div className="form-group">
                    <label htmlFor="title">Title:</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="assignedUser">Assigned To:</label>
                    <select
                        id="assignedUser"
                        value={assignedUser}
                        onChange={(e) => setAssignedUser(e.target.value)}
                        required
                    >
                        {allUsers.length === 0 && <option value="">Loading users...</option>}
                        {allUsers.map(user => (
                            <option key={user._id} value={user._id}>{user.username}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="priority">Priority:</label>
                    <select
                        id="priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                    >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="status">Initial Status:</label>
                    <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                    </select>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn-primary">Add Task</button>
                    <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                </div>
            </form>
        </div>
    );
}

export default AddTaskForm;