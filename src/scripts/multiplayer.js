import { useGameStore } from '@/stores/game';
import { io } from 'socket.io-client';

var endpoint = 'http://localhost:3000'
var gameStore = null;
export var socket;

// -----------------------------------------------------------
//                   Socket.io stuff
// -----------------------------------------------------------

export function connectWSS(username) {
    gameStore = useGameStore()
    socket = io(endpoint);

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

export function disconnectWSS() {
    if (socket) {
        socket.disconnect();
        console.log('Disconnected from the server');
    }
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
        return status;
    });
}

// -----------------------------------------------------------
//                   Fetch stuff
// -----------------------------------------------------------

export async function getOnlineUsers() {
    const response = await fetch(endpoint + '/api/users/online');

    if (response.ok) {
        const data = await response.json();
        return data;
    }

    return null;
}

export async function getUser(username) {
    const response = await fetch(endpoint + `/api/user?username=${username}`);

    if (response.ok) {
        const data = await response.json();
        return data;
    }

    return null;
}

export async function login(username, password) {
    const response = await fetch(endpoint + '/api/user/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        connectWSS(data.username);
        return data;
    }

    return null;
}

export async function updateStats(stats) {
    const token = localStorage.getItem('jwt');
    const response = await fetch(endpoint + '/api/user/updateStats', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(stats)
    });
    
    if (response.ok) {
        const data = await response.json();
        return data;
    }
}

// export async function logout() {
//     const token = localStorage.getItem('jwt');
//     const response = await fetch(endpoint + '/api/user/logout', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': 'Bearer ' + token
//         }
//     });

//     if (response.ok) {
//         localStorage.removeItem('jwt');
//         return true;
//     }

//     return false;
// }

export async function renewLogin() {
    const token = localStorage.getItem('jwt');
    const response = await fetch(endpoint + '/api/user/renewLogin', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('jwt', data.jwt);
        return true;
    }

    return false;
}

export async function startLoginRenewalTimer() {
    /* Will implenent this later */
    /* let renewalTimerId = null;

export async function startLoginRenewalTimer() {
    // Clear any existing timer
    if (renewalTimerId) {
        clearInterval(renewalTimerId);
    }

    // Set up the interval (14 minutes)
    renewalTimerId = setInterval(async () => {
        const success = await renewLogin();
        if (!success) {
            clearInterval(renewalTimerId);
            renewalTimerId = null;
            console.warn('Token renewal failed, stopping renewal timer.');
        }
    }, 14 * 60 * 1000); // 14 minutes in ms

    // Stop timer on page unload
    window.addEventListener('beforeunload', () => {
        if (renewalTimerId) {
            clearInterval(renewalTimerId);
            renewalTimerId = null;
        }
    });
}*/
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