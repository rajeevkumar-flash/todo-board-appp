// frontend/src/services/socket.js
import io from 'socket.io-client';


localStorage.debug = '*';

const socket = io(process.env.REACT_APP_SOCKET_URL, {
    transports: ['websocket'], // Prefer websocket for real-time
    autoConnect: false // Don't auto-connect, connect when authenticated
});

export default socket;