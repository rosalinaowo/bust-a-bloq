const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = Joi.object({
    username: Joi.string().alphanum().min(1).max(30).required(),
    passwordHash: Joi.string().required(),
    maxPoints: Joi.number().integer().min(0).required().options({ convert: false }),
});
const userUpdateSchema = Joi.object({
    maxPoints: Joi.number().integer().min(0).required().options({ convert: false }),
});

const confPath = './config.json';
const dbPath = './db.json';
const app = express().use(cors).use(express.json());
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});
const usersBySocket = new Map();
const socketByUsername = new Map();
var games = [];
const config = getConfig();
var db = {};
const saltRounds = 10;

function getConfig() {
    if (!fs.existsSync(confPath)) {
        console.error(`Config file not found at ${confPath}`);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(confPath));
}

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

app.post('/api/users', (req, res) => {
    const { dbPassword } = req.body;
    if (dbPassword !== config.DB_PASSWORD) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json(db.users);
});

app.delete('/api/user', (req, res) => {
    const { dbPassword, username } = req.body;
    if (dbPassword !== config.DB_PASSWORD) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    const userIndex = db.users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    db.users.splice(userIndex, 1);
    saveData();
    res.json({ message: 'User deleted successfully' });
});

app.get('/api/user', (req, res) => {
    const { username: requestedUsername } = req.query;
    if (!requestedUsername) {
        return res.status(400).json({ message: 'Username is required' });
    }

    const user = db.users.find(u => u.username === requestedUsername);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const { username, maxPoints } = user || {};
    const cleanUser = { username, maxPoints };

    res.json(cleanUser);
});

app.post('/api/user/register', (req, res) => {
    const newUser = {
        username: req.body.username,
        passwordHash: bcrypt.hashSync(req.body.password, saltRounds),
        maxPoints: 0
    }

    const user = db.users.find(u => u.username === newUser.username);
    if (user) {
        return res.status(409).json({ message: 'Username already taken' });
    }

    const { error, value } = userSchema.validate(newUser);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    db.users.push(newUser);
    saveData();

    const { username, maxPoints } = newUser;
    const cleanUser = { username, maxPoints };

    res.status(201).json(cleanUser);
});

app.post('/api/user/login', (req, res) => {
    const { username: requestedUsername, password } = req.body;
    if (!requestedUsername) {
        return res.status(400).json({ message: 'Username is required' });
    }

    const user = db.users.find(u => u.username === requestedUsername);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const match = bcrypt.compareSync(password, user.passwordHash);
    if (!match) {
        return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ username: user.username }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRATION });
    const { username, maxPoints } = user || {};
    const cleanUser = { token, username, maxPoints };

    res.json(cleanUser);
});

app.put('/api/user/update', (req, res) => {
    const authHeader = req.headers.authorization;
    const user = req.body;

    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        if (user.username !== decoded.username) {
            return res.status(403).json({ message: 'Forbidden' });
        }
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const updatedFields = {
        maxPoints: user.maxPoints
    };

    const { error, value } = userUpdateSchema.validate(updatedFields);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    
    const userIndex = db.users.findIndex(u => u.username === user.username);
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    Object.assign(db.users[userIndex], updatedFields);
    saveData();
    res.json(db.users[userIndex]);
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

server.listen(config.PORT, () => {
    console.log(`Server is running on http://localhost:${config.PORT}`);
});