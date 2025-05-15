import { useGameStore } from '@/stores/game';
import { io } from 'socket.io-client';

var gameStore = null;
export var socket;

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
}

export function sendUpdatedField() {
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