const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = 3000;
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});
const loggedUsers = new Map();

io.on('connection', (socket) => {
    console.log(`[C] ${socket.id}`);

    socket.on('login', (user) => {
        if (!user.username || user.username.length < 1) {
            socket.emit('loginStatus', {
                message: 'usernameRequired'
            });
            return;
        }
        loggedUsers.forEach((id, u) => {
            if (u.username === user.username) {
                socket.emit('loginStatus', {
                    message: 'usernameAlreadyTaken'
                });
                return;
            }
        });

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

    socket.on('updateField', (data) => {
        console.log(`[U] Points: ${data.points} Field: ${data.field}`);
    });

    socket.on('getOpponentState', () => {
        const user = loggedUsers.get(socket.id);
        console.log(`[G] ${user.username} (${socket.id}) requested opponent state`);
        socket.emit('opponentState', {
            username: 'testUser',
            points: 1000,
            field: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => Math.floor(Math.random() * 7) + 1))
        });
    });
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});