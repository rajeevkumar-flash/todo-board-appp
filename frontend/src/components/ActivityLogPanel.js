// frontend/src/components/ActivityLogPanel.js
import React, { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import socket from '../services/socket'; // [cite: 11]
import '../styles/ActivityLogPanel.css'; // Custom styles 

function ActivityLogPanel() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchActivities = async () => {
        try {
            const { data } = await API.get('/actions/latest'); // [cite: 14]
            setActivities(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching activities:', err);
            setError('Failed to load activities.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();

        // Listen for real-time activity updates [cite: 24]
        socket.on('actionLogged', (newAction) => {
            console.log('New action received:', newAction);
            setActivities(prevActivities => {
                const updated = [newAction, ...prevActivities];
                return updated.slice(0, 20); // Keep only the last 20 actions [cite: 14]
            });
        });

        return () => {
            socket.off('actionLogged');
        };
    }, []);

    const formatActivity = (activity) => {
        let details = '';
        if (activity.actionType === 'TASK_CREATED') {
            details = `created task "${activity.taskTitle}"`;
        } else if (activity.actionType === 'TASK_UPDATED') {
            details = `updated task "${activity.taskTitle}"`;
            if (activity.details.newStatus && activity.details.newStatus !== activity.details.oldStatus) {
                details += ` (status changed from ${activity.details.oldStatus} to ${activity.details.newStatus})`;
            }
            if (activity.details.newAssignedUser && activity.details.newAssignedUser !== activity.details.oldAssignedUser) {
                details += ` (assigned from ${activity.details.oldAssignedUser} to ${activity.details.newAssignedUser})`;
            }
            // Add more specific details for other updates if needed
        } else if (activity.actionType === 'TASK_DELETED') {
            details = `deleted task "${activity.taskTitle}"`;
        } else if (activity.actionType === 'TASK_ASSIGNED') {
            details = `assigned task "${activity.taskTitle}" from ${activity.details.from} to ${activity.details.to}`;
        } else if (activity.actionType === 'TASK_STATUS_CHANGED') {
            details = `changed status of task "${activity.taskTitle}" from ${activity.details.oldStatus} to ${activity.details.newStatus}`;
        } else if (activity.actionType === 'TASK_DRAGGED') {
            details = `dragged task "${activity.taskTitle}" from ${activity.details.oldStatus} to ${activity.details.newStatus}`;
        }
        return `[${new Date(activity.timestamp).toLocaleTimeString()}] ${activity.username} ${details}.`;
    };

    if (loading) return <div className="activity-log-panel">Loading activities...</div>;
    if (error) return <div className="activity-log-panel error">{error}</div>;

    return (
        <div className="activity-log-panel"> [cite: 23]
            <h3>Activity Log</h3> [cite: 23]
            <div className="activity-list">
                {activities.length === 0 ? (
                    <p>No recent activity.</p>
                ) : (
                    <ul>
                        {activities.map((activity) => (
                            <li key={activity._id} className="activity-item">
                                {formatActivity(activity)}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ActivityLogPanel;