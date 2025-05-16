const fs = require('fs');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Joi = require('joi');

const userSchema = Joi.object({
    username: Joi.string().alphanum().min(1).max(30).required(),
    maxPoints: Joi.number().integer().min(0).required().options({ convert: false }),
});

const PORT = 3000;
const dbPath = './db.json';
const dbPwd = '1234';
const app = express().use(express.json());
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});
const usersBySocket = new Map();
const socketByUsername = new Map();
var games = [];
var db = {};

function getData() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ users: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(dbPath));
}

function saveData() {
    fs.writeFile(dbPath, JSON.stringify(db, null, 2), (err) => {
        if (err) console.error(err);
    });
}

db = getData();

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

// -----------------------------------------------------------
//                   Socket.io stuff
// -----------------------------------------------------------

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

// -----------------------------------------------------------
//                      HTTP stuff
// -----------------------------------------------------------

app.get('/api/users', (req, res) => {
    const { p } = req.query;
    if (p !== dbPwd) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json(db.users);
});

app.get('/api/user', (req, res) => {
    const { username } = req.query;
    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    const user = db.users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
});

app.post('/api/user', (req, res) => {
    const u = {
        username: req.body.username,
        maxPoints: 0
    }

    const { error, value } = userSchema.validate(u);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const newUser = {
        username: value.username,
        maxPoints: value.maxPoints
    };

    db.users.push(newUser);
    saveData();
    res.status(201).json(newUser);
});

app.put('/api/user', (req, res) => {
    const user = req.body
    const { error, value } = userSchema.validate(user);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    
    const userIndex = db.users.findIndex(u => u.username === user.username);
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    db.users[userIndex] = user;
    saveData();
    res.json(db.users[userIndex]);
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});