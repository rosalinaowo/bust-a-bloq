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
const usersBySocket = new Map();
const socketByUsername = new Map();
var games = [];

function addGame(p1Username, p2Username) {
    games.push({
        p1: p1Username,
        p2: p2Username
    });
}

function removeGame(username) {
    let removedGame = null;
    games = games.filter(game => {
        if (!removedGame && (game.p1 === username || game.p2 === username)) {
            removedGame = game;
            return false; // Remove this game
        }
        return true; // Keep other games
    });
    return removedGame;
}

function getOpponent(username) {
    const game = games.find(g => g.p1 === username || g.p2 === username);
    if (!game) return null;
    return game.p1 === username ? game.p2 : game.p1;
}

io.on('connection', (socket) => {
    console.log(`[C] ${socket.id}`);

    socket.on('login', (user) => {
        if (!user.username || user.username.length < 1 || user.username.trim().length < 1) {
            socket.emit('loginStatus', {
                message: 'usernameRequired'
            });
            return;
        }

        if (socketByUsername.has(user.username)) {
            socket.emit('loginStatus', {
                message: 'usernameAlreadyTaken'
            });
            return;
        }

        usersBySocket.set(socket.id, user);
        socketByUsername.set(user.username, socket.id);

        socket.emit('loginStatus', {
            message: 'success'
        });
        console.log(`[+] ${user.username} (${socket.id})`);
    });

    socket.on('disconnect', () => {
        const user = usersBySocket.get(socket.id);
        if (user) {
            let removedGame = removeGame(user.username);
            if (removedGame !== null) {
                console.log(`[G] ${user.username} (${socket.id}) left the game`);
            }
            console.log(`[-] ${user.username} (${socket.id})`);
            socketByUsername.delete(user.username);
            usersBySocket.delete(socket.id);
        }
    });

    socket.on('updateField', (data) => {
        const opponentUsername = getOpponent(usersBySocket.get(socket.id).username);
        const opponentSocketId = socketByUsername.get(opponentUsername);
        console.log(`[U] Points: ${data.points} Field: ${data.field}`);
        
        if (opponentSocketId) {
            console.log('Sending field update to opponent ' + opponentSocketId);
            io.to(opponentSocketId).emit('opponentUpdateField', {
                username: opponentUsername,
                points: data.points,
                field: data.field
            });
        }
    });

    socket.on('setOpponent', (username) => {
        if (!socketByUsername.has(username)) {
            socket.emit('setOpponentStatus', {
                message: 'userNotFound'
            });
        }
        games.forEach((game) => {
            if (game.p1 === username || game.p2 === username) {
                socket.emit('setOpponentStatus', {
                    message: 'userAlreadyInGame'
                });
                return;
            }
        });

        addGame(usersBySocket.get(socket.id).username, username);
        console.log(`[G] ${usersBySocket.get(socket.id).username} (${socket.id}) set opponent to ${username}`);
        socket.emit('setOpponentStatus', {
            message: 'success'
        });
    });

    socket.on('getOpponentState', () => {
        const user = usersBySocket.get(socket.id);
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