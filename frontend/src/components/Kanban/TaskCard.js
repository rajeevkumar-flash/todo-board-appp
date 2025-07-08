// frontend/src/components/Kanban/TaskCard.js
import React, { useState, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import '../../styles/TaskCard.css';
import '../../styles/Animations.css';

function TaskCard({ task, index, allUsers, onUpdateTask, onDeleteTask, onSmartAssign, setEditingTask, editingTask }) {
    // --- ALL HOOKS ARE CALLED UNCONDITIONALLY AT THE TOP LEVEL ---
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(''); // Initialize with a safe default
    const [editedDescription, setEditedDescription] = useState(''); // Initialize with a safe default
    const [editedAssignedUser, setEditedAssignedUser] = useState(''); // Initialize with a safe default
    const [editedPriority, setEditedPriority] = useState('Low'); // Initialize with a safe default

    // Use useEffect to synchronize local state with the 'task' prop
    // This effect runs whenever the 'task' prop changes
    useEffect(() => {
        if (task) { // Only update state if 'task' is defined
            setEditedTitle(task.title || '');
            setEditedDescription(task.description || '');
            // Safely access _id using optional chaining for assignedUser
            setEditedAssignedUser(task.assignedUser?._id || '');
            setEditedPriority(task.priority || 'Low');

            // Logic to close the edit form if the task was updated by someone else
            if (editingTask && editingTask._id === task._id && editingTask.version < task.version) {
                setIsEditing(false);
                setEditingTask(null);
            }
        }
    }, [task, editingTask, setEditingTask]); // Dependency array: re-run when task changes

    // --- CONDITIONAL RENDERING LOGIC STARTS HERE (AFTER ALL HOOKS) ---
    // If 'task' or its '_id' is still invalid, return null to prevent rendering
    if (!task || !task._id) {
        console.warn('TaskCard received an invalid or incomplete task prop after hooks, returning null:', task);
        return null;
    }

    // Now that we are sure 'task' is valid, we can safely access its properties
    const assignedUserName = allUsers.find(user => user._id === task.assignedUser?._id)?.username || 'Unassigned';

    const handleSave = () => {
        const updatedFields = {
            title: editedTitle,
            description: editedDescription,
            assignedUser: editedAssignedUser,
            priority: editedPriority,
            status: task.status
        };
        onUpdateTask(task._id, updatedFields);
        setIsEditing(false);
        setEditingTask(null);
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setEditingTask(task);
    };

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`task-card ${snapshot.isDragging ? 'dragging' : ''} ${isEditing ? 'editing-mode' : ''}`}
                >
                    {isEditing ? (
                        <div className="task-edit-form">
                            <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                placeholder="Task Title"
                            />
                            <textarea
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                placeholder="Description"
                            />
                            <select
                                value={editedAssignedUser}
                                onChange={(e) => setEditedAssignedUser(e.target.value)}
                            >
                                <option value="">Select User</option> {/* Added unassigned option */}
                                {allUsers.map(user => (
                                    <option key={user._id} value={user._id}>{user.username}</option>
                                ))}
                            </select>
                            <select
                                value={editedPriority}
                                onChange={(e) => setEditedPriority(e.target.value)}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                            <div className="task-edit-actions">
                                <button className="btn-save" onClick={handleSave}>Save</button>
                                <button className="btn-cancel" onClick={() => { setIsEditing(false); setEditingTask(null); }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h4>{task.title}</h4>
                            <p>{task.description}</p>
                            <div className="task-meta">
                                <span>Assigned: {assignedUserName}</span>
                                <span>Priority: {task.priority}</span>
                            </div>
                            <div className="task-actions">
                                <button className="btn-edit" onClick={handleEditClick}>Edit</button>
                                <button className="btn-delete" onClick={() => onDeleteTask(task._id)}>Delete</button>
                                <button className="btn-smart-assign" onClick={() => onSmartAssign(task._id)}>Smart Assign</button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </Draggable>
    );
}

export default TaskCard;