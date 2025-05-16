import { useGameStore } from '@/stores/game';
import { io } from 'socket.io-client';

var gameStore = null;
export var socket;

// -----------------------------------------------------------
//                   Socket.io stuff
// -----------------------------------------------------------

export function connect(username) {
    gameStore = useGameStore()
    socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.log(`Connected to the server with ID: ${socket.id}`);
        socket.emit('login', { username: username });
    });

    socket.on('connect_error', (error) => {
        console.error(`Connection error:`, error);
    });

    socket.on('disconnect', (reason, details) => {
        console.log(`Disconnected from the server. Reason: ${reason}`);
        gameStore.logged = false;
    });

    socket.on('loginStatus', (status) => {
        if (status.message === 'success') {
            console.log('Login successful');
            gameStore.logged = true;
        } else if (status.message === 'usernameAlreadyTaken') {
            console.log('Username already taken');
            gameStore.logged = false;
        }
    });

    socket.on('opponentUpdateField', (data) => {
        console.log('Received opponent field update');
        gameStore.opponent = data;
    });
}

export function setOpponent(username) {
    return new Promise((resolve, reject) => {
        socket.emit('setOpponent', username);
        socket.once('setOpponentStatus', (status) => {
            console.log(`Set opponent status: ${status.message}`);
            switch (status.message) {
                // case 'userNotFound': reject(false); break;
                // case 'opponentNotFound': reject(false); break;
                case 'success': resolve(true); break;
                default: reject(false); break;
            }
        });
    });
}

export function sendUpdatedField() {
    console.log('Sending updated field');
    socket.emit('updateField', {
        field: gameStore.field,
        points: gameStore.points
    });
}

export function getOpponentStatus() {
    console.log('Requesting opponent state');
    socket.emit('getOpponentState');
    socket.once('opponentState', (status) => {
        gameStore.opponent = status;
    });
}

// -----------------------------------------------------------
//                   Fetch stuff
// -----------------------------------------------------------

export async function login(username, password) {
    const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('jwt', data.token);
        gameStore.username = username;
        return true;
    }

    return false;
}

/*
const token = localStorage.getItem('jwt');
fetch('/api/update', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(userData)
});
*/