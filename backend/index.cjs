const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);
const loggedUsers = new Map();

io.on('connection', (socket) => {
    console.log(`[C] ${socket.id}`);

    socket.on('login', (user) => {
        loggedUsers.set(socket.id, user);
        socket.emit('loginStatus', {
            message: 'success'
        });
        console.log(`[+] ${user.username} (${socket.id})`);
    });

    socket.on('disconnect', () => {
        const user = loggedUsers.get(socket.id);
        if (user) {
            console.log(`[-] ${user.username} (${socket.id})`);
            loggedUsers.delete(socket.id);
        }
    });
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});