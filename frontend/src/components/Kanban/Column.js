// frontend/src/components/Kanban/Column.js
import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import '../../styles/Column.css'; // Custom styles

function Column({ id, title, tasks, allUsers, onUpdateTask, onDeleteTask, onSmartAssign, setEditingTask, editingTask }) {
    return (
        <div className="column">
            <h3>{title} ({tasks.length})</h3>
            <Droppable droppableId={id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    >
                        {tasks.map((task, index) => (
                            <TaskCard
                                key={task._id}
                                task={task}
                                index={index}
                                allUsers={allUsers}
                                onUpdateTask={onUpdateTask}
                                onDeleteTask={onDeleteTask}
                                onSmartAssign={onSmartAssign}
                                setEditingTask={setEditingTask}
                                editingTask={editingTask}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

export default Column;