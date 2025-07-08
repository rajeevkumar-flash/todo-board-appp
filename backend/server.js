// backend/server.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // For cross-origin requests
const http = require('http'); // For Socket.IO
const { Server } = require('socket.io'); // For Socket.IO

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const actionRoutes = require('./routes/actions'); // If you create a separate action route (recommended)

const app = express();
const server = http.createServer(app); // Create HTTP server for Socket.IO

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL, // Your frontend URL (e.g., http://localhost:3000)
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Pass io instance to controllers that need to emit events
app.set('socketio', io);

// Socket.IO Connection Handler
// This logs when a client connects and disconnects.
// It's crucial for confirming your real-time setup is working.
io.on('connection', (socket) => {
    console.log(`Socket.IO: A user connected with ID: ${socket.id}`);

    // You can add more listeners here for events sent from the client if needed
    // Example: socket.on('joinRoom', (roomName) => { socket.join(roomName); });

    socket.on('disconnect', () => {
        console.log(`Socket.IO: User disconnected with ID: ${socket.id}`);
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err)); // More specific error logging

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL, // Allow requests from your frontend
    credentials: true
}));
app.use(express.json()); // Body parser for JSON data

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/actions', actionRoutes); // Example if you have separate action routes

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); // Use server.listen for Socket.IO