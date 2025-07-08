// frontend/src/components/Kanban/KanbanBoard.js
import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import API from '../../api/axiosConfig';
import socket from '../../services/socket';
import Column from './Column';
import AddTaskForm from './AddTaskForm';
import ActivityLogPanel from '../ActivityLogPanel';
import ConflictResolutionModal from './ConflictResolutionModal';
import '../../styles/KanbanBoard.css';
import '../../styles/Animations.css';

const COLUMN_NAMES = ['Todo', 'In Progress', 'Done'];

function KanbanBoard({ onLogout }) {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]); // To populate assignedUser dropdowns
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [conflictDetails, setConflictDetails] = useState(null); // State for conflict resolution
    const [editingTask, setEditingTask] = useState(null); // For editing existing tasks

    const currentUser = JSON.parse(localStorage.getItem('user'));

    // Fetch initial tasks and users
    const fetchBoardData = useCallback(async () => {
        try {
            const [tasksRes, usersRes] = await Promise.all([
                API.get('/tasks'),
                API.get('/auth/all') // You'll need to add a backend route to get all users (e.g., /api/users/all)
            ]);
            console.log('Tasks fetched:', tasksRes.data); // Add this line
            console.log('Users fetched:', usersRes.data);
            setTasks(tasksRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Error fetching board data:', error);
        }
    }, []);

    useEffect(() => {
        fetchBoardData();
           if (!socket.connected) {
        socket.connect();
    }

        // Connect Socket.IO
        

        // Listen for real-time updates
        socket.on('taskCreated', (newTask) => {
            console.log('taskCreated received:', newTask);
            setTasks(prevTasks => [...prevTasks, newTask]);
        });

        socket.on('taskUpdated', (updatedTask) => {
            console.log('taskUpdated received:', updatedTask);
            setTasks(prevTasks =>
                prevTasks.map(task => (task._id === updatedTask._id ? updatedTask : task))
            );
        });

        socket.on('taskDeleted', ({ taskId }) => {
            console.log('taskDeleted received for:', taskId);
            setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
        });

        return () => {
            // Clean up socket listeners and disconnect on unmount
            socket.off('taskCreated');
            socket.off('taskUpdated');
            socket.off('taskDeleted');
            socket.disconnect();
        };
    }, [fetchBoardData]);


    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const updatedTask = tasks.find(task => task._id === draggableId);
        if (!updatedTask) return;

        // const oldStatus = updatedTask.status; // No longer needed
        const newStatus = destination.droppableId;

        // Optimistically update UI
        setTasks(prevTasks => {
            const newTasks = Array.from(prevTasks);
            const taskIndex = newTasks.findIndex(task => task._id === draggableId);
            if (taskIndex > -1) {
                newTasks[taskIndex] = { ...newTasks[taskIndex], status: newStatus };
            }
            return newTasks;
        });

        // Send update to backend
        try {
            await API.put(`/tasks/${draggableId}`, {
                status: newStatus,
                // Include client's version for conflict detection
                clientVersion: updatedTask.version,
                clientLastModifiedAt: updatedTask.lastModifiedAt
            });
            // Backend will emit 'taskUpdated' which will update state via socket.
        } catch (error) {
            console.error('Error updating task status via drag-drop:', error);
            // If API call fails, revert optimistic update (re-fetch tasks or revert state)
            fetchBoardData(); // Revert to server's state on error
            if (error.response?.status === 409) { // Conflict detected
                setConflictDetails({
                    taskId: draggableId,
                    clientAttempt: { ...updatedTask, status: newStatus }, // What client tried to do
                    serverTask: error.response.data.serverTask // Server's current version
                });
            }
        }
    };

    const handleAddTask = async (taskData) => {
        try {
            await API.post('/tasks', taskData); // Removed `const { data }`
            // Task will be added via socket.on('taskCreated')
            setShowAddTaskForm(false);
        } catch (error) {
            console.error('Error adding task:', error);
            alert(error.response?.data?.message || 'Failed to add task.');
        }
    };

    const handleUpdateTask = async (taskId, updatedFields) => {
        const currentTask = tasks.find(t => t._id === taskId);
        if (!currentTask) return;

        try {
            const payload = {
                ...updatedFields,
                clientVersion: currentTask.version, // Pass current version for conflict detection
                clientLastModifiedAt: currentTask.lastModifiedAt
            };
            await API.put(`/tasks/${taskId}`, payload); // Removed `const { data }`
            // Task will be updated via socket.on('taskUpdated')
            setEditingTask(null); // Close edit form
        } catch (error) {
            console.error('Error updating task:', error);
            if (error.response?.status === 409) { // Conflict detected
                setConflictDetails({
                    taskId,
                    clientAttempt: { ...currentTask, ...updatedFields }, // What client tried to do
                    serverTask: error.response.data.serverTask // Server's current version
                });
            } else {
                alert(error.response?.data?.message || 'Failed to update task.');
            }
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await API.delete(`/tasks/${taskId}`);
                // Task will be removed via socket.on('taskDeleted')
            } catch (error) {
                console.error('Error deleting task:', error);
                alert(error.response?.data?.message || 'Failed to delete task.');
            }
        }
    };

    // For Smart Assign (Phase 3)
    const handleSmartAssign = async (taskId) => {
        try {
            await API.put(`/tasks/${taskId}/smart-assign`);
            // Task will be updated via socket.on('taskUpdated')
            alert('Task smart assigned!');
        } catch (error) {
            console.error('Error smart assigning task:', error);
            alert(error.response?.data?.message || 'Failed to smart assign task.');
        }
    };

    const resolveConflict = async (resolutionType, taskId, clientAttempt, serverTask) => {
        try {
            let mergedData = {};
            if (resolutionType === 'overwrite') {
                mergedData = clientAttempt; // Client's version wins
            } else { // 'merge' - simple merge example, can be more complex
                mergedData = { ...serverTask, ...clientAttempt }; // Client's changes on top of server's current state
                // For a more advanced merge, you'd iterate specific fields:
                // mergedData = {
                //    title: serverTask.title !== clientAttempt.title ? (prompt("Server title: " + serverTask.title + "\nClient title: " + clientAttempt.title + "\nChoose (server/client):") === 'server' ? serverTask.title : clientAttempt.title) : serverTask.title,
                //    description: ...
                // };
            }

            // Crucially, send the *server's latest version* to overwrite/merge correctly
            // This ensures the server logic for version increment works.
            const payload = {
                ...mergedData,
                // Pass server's version and timestamp to allow forced overwrite/merge
                clientVersion: serverTask.version,
                clientLastModifiedAt: serverTask.lastModifiedAt
            };

            await API.put(`/tasks/${taskId}`, payload); // Removed `const { data }`
            // Task will be updated via socket.on('taskUpdated')
            setConflictDetails(null); // Close conflict modal
            alert('Conflict resolved!');
        } catch (error) {
            console.error('Error resolving conflict:', error);
            alert(error.response?.data?.message || 'Failed to resolve conflict.');
        }
    };

    const getTasksByStatus = (status) => tasks.filter(task => task.status === status);

    return (
        <div className="kanban-dashboard">
            <header className="kanban-header">
                <h1>Collaborative To-Do Board</h1>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => setShowAddTaskForm(true)}>Add New Task</button>
                    {currentUser && <span className="user-info">Logged in as: {currentUser.username || currentUser.email}</span>}
                    <button className="btn-logout" onClick={onLogout}>Logout</button>
                </div>
            </header>

            {showAddTaskForm && (
                <div className="modal-overlay">
                    <AddTaskForm
                        onAddTask={handleAddTask}
                        onClose={() => setShowAddTaskForm(false)}
                        allUsers={users}
                    />
                </div>
            )}

            {conflictDetails && (
                <ConflictResolutionModal
                    conflict={conflictDetails}
                    onResolve={resolveConflict}
                    onClose={() => setConflictDetails(null)}
                />
            )}

            <div className="kanban-board-container">
                <DragDropContext onDragEnd={onDragEnd}>
                    {COLUMN_NAMES.map(columnName => (
                        <Column
                            key={columnName}
                            id={columnName}
                            title={columnName}
                            tasks={getTasksByStatus(columnName)}
                            allUsers={users}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onSmartAssign={handleSmartAssign}
                            setEditingTask={setEditingTask}
                            editingTask={editingTask}
                        />
                    ))}
                </DragDropContext>
                <ActivityLogPanel />
            </div>
        </div>
    );
}

export default KanbanBoard;