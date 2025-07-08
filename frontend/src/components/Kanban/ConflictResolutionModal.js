// frontend/src/components/Kanban/ConflictResolutionModal.js
import React from 'react';
import '../../styles/ConflictModal.css'; // Custom styles

function ConflictResolutionModal({ conflict, onResolve, onClose }) {
    if (!conflict) return null;

    const { taskId, clientAttempt, serverTask } = conflict;

    // Helper to render task details for comparison
    const renderTaskDetails = (task, label) => (
        <div className="task-version-card">
            <h4>{label}</h4>
            <p><strong>Title:</strong> {task.title}</p>
            <p><strong>Description:</strong> {task.description}</p>
            <p><strong>Status:</strong> {task.status}</p>
            <p><strong>Priority:</strong> {task.priority}</p>
            <p><strong>Assigned To:</strong> {task.assignedUser?.username || 'N/A'}</p>
            <p className="version-info">Version: {task.version}, Last Modified: {new Date(task.lastModifiedAt).toLocaleString()}</p>
        </div>
    );

    return (
        <div className="modal-overlay">
            <div className="conflict-modal">
                <h3>Conflict Detected for Task: "{serverTask.title}"</h3>
                <p>Another user has updated this task. Please choose how to resolve the conflict.</p>

                <div className="conflict-versions">
                    {renderTaskDetails(clientAttempt, "Your Changes")}
                    {renderTaskDetails(serverTask, "Current Server Version")}
                </div>

                <div className="modal-actions">
                    <button
                        className="btn-primary"
                        onClick={() => onResolve('overwrite', taskId, clientAttempt, serverTask)}
                    >
                        Overwrite with My Changes
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => onResolve('merge', taskId, clientAttempt, serverTask)}
                    >
                        Merge (Prefer My Changes for common fields)
                    </button>
                    <button
                        className="btn-cancel"
                        onClick={onClose}
                    >
                        Cancel (Discard My Changes)
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConflictResolutionModal;