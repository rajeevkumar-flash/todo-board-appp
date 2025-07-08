import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import KanbanBoard from './components/Kanban/KanbanBoard';
import './styles/App.css';
import './styles/index.css'; // Global styles
import socket from './services/socket'; // ✅ Import socket

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            setIsAuthenticated(true);
            socket.connect(); // ✅ Reconnect on refresh if already logged in
        }
        setLoading(false);
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
         setTimeout(() => {
        socket.connect(); // ✅ Connect socket after login
        }, 300); 
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        socket.disconnect(); // ✅ Optional: disconnect socket on logout
    };

    if (loading) {
        return <div className="loading-screen">Loading application...</div>;
    }
    

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/board" /> : <Login onLogin={handleLogin} />} />
                    <Route path="/register" element={isAuthenticated ? <Navigate to="/board" /> : <Register />} />
                    <Route
                        path="/board"
                        element={isAuthenticated ? <KanbanBoard onLogout={handleLogout} /> : <Navigate to="/login" />}
                    />
                    <Route path="*" element={<Navigate to="/board" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
