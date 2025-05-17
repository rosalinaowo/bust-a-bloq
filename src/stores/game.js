import { PixiGame } from '@/scripts/graphics';
import { toRawArray, isTokenValid } from "@/scripts/utils";
import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import * as mp from '@/scripts/multiplayer';
import { jwtDecode } from 'jwt-decode';

// Campo di gioco di esempio
const exampleGame = {
    "field": [
        [ 1, 1, 1, 1, 1, 0, 6, 6 ],
        [ 1, 3, 3, 0, 0, 0, 0, 6 ],
        [ 1, 0, 0, 0, 0, 0, 0, 0 ],
        [ 0, 0, 0, 0, 0, 0, 0, 0 ],
        [ 0, 0, 0, 0, 0, 0, 0, 0 ],
        [ 4, 0, 0, 0, 0, 0, 0, 0 ],
        [ 4, 0, 0, 0, 0, 0, 0, 0 ],
        [ 4, 0, 0, 0, 0, 0, 0, 0 ]
    ]
}

// Creaiamo ed esportiamo uno store, lo usamio per gestire lo stato dell'app
export const useGameStore = defineStore('game', () => {
    var pixiGame = ref(null);
    const blocks = ref([
        [[1, 1]], // 2x1
        [[1, 1, 1]], // 3x1
        [[1, 1, 1, 1]], // 4x1
        [[1, 1, 1, 1, 1]], // 5x1
        [[1, 1], [1, 1]], // 2x2
        [[1, 1, 1, 1], [1, 1, 1, 1]], // 4x2
        [[1, 1, 1], [1, 1, 1], [1, 1, 1]], // 3x3
        [[1, 1, 1], [1, 0, 0], [1, 0, 0]], // corner
        [[1, 1], [1, 0]], // small corner
        [[1, 1, 1], [1, 0, 0]], // L
        [[1, 1, 1], [0, 0, 1]], // J
        [[1, 1, 1], [0, 1, 0]], // T
        [[1, 1], [0, 1], [0, 1]], // S
        [[1, 1], [1, 0], [1, 0]] // Z
    ]);
    const pointsMultiplier = ref([ 1.1, 1.2, 1.5 ]);
    const points = ref(0);

    const rows = ref(8);
    const columns = ref(8);
    const nextPiecesAmount = ref(3);
    const field = ref(Array.from({ length: rows.value }, () => Array.from({ length: columns.value }, () => 0)));
    //const fieldSprites = ref(Array.from({ length: rows.value }, () => Array.from({ length: columns.value }, () => null)));
    //const fieldSprites = ref([]);
    const nextPieces = ref([]);

    const texturePacks = ref([ 'default', 'blockMC' ]);
    const selectedTexturePack = texturePacks.value[1];
    const blockColorsNumber = ref(0);
    const reset = ref(0);

    const username = ref(isTokenValid() ? jwtDecode(localStorage.getItem('jwt')).username : "");
    const user = ref(null);
    const opponentUsername = ref("");
    const logged = ref(isTokenValid());
    const opponent = ref(null);

    if (logged.value) {
        mp.connectWSS(username.value);
        fetchUs();
    }

    function initPixiGame(htmlContainer) {
        if (!pixiGame.value) {
            pixiGame.value = new PixiGame(htmlContainer);
        }
    }

    function destroyPixiGame() {
        if (pixiGame.value) {
            pixiGame.value.destroy();
            pixiGame.value = null;
        }
    }

    function loadExampleGame() {
        //field.value = exampleGame.field;
        field.value = exampleGame.field.map(row => [...row]);
    }

    function generateRandomPieces(colorsCount) { // Completely random
        nextPieces.value = [];
        
        let nextP = [];
        for (let i = 0; i < nextPiecesAmount.value; i++) {
            const colorIdx = Math.floor(Math.random() * colorsCount) + 1;
            const idx = Math.floor(Math.random() * blocks.value.length);
            const selectedBlock = blocks.value[idx];
            let blockCopy = toRawArray(selectedBlock);

            let nextPiece = {
                pieceIdx: i,
                colorIdx: colorIdx,
                matrix: blockCopy
            }

            nextP.push(nextPiece);
        }

        nextPieces.value = nextP;
    }

    function generateRandomPiecesThatFit(colorsCount) {
        nextPieces.value = [];
        const fittingPieces = ref(findPiecesThatFit());
    
        for (let i = 0; i < nextPiecesAmount.value; i++) {
            let pieceFound = false;
            for (let attempt = 0; attempt < blocks.value.length; attempt++) {
                const colorIdx = Math.floor(Math.random() * colorsCount) + 1;
                const idx = Math.floor(Math.random() * blocks.value.length);
                const selectedBlock = blocks.value[idx];
                const blockCopy = toRawArray(selectedBlock);
                console.log('Attempting to fit piece: ', blockCopy);
    
                if (idx == fittingPieces.value[i].pieceIdx) {
                    console.log('Found a fitting piece: ', blockCopy);
                    nextPieces.value.push({
                        pieceIdx: i,
                        colorIdx: colorIdx,
                        matrix: blockCopy,
                    });
                    pieceFound = true;
                    break;
                }
            }
    
            if (!pieceFound) {
                // Fallback: Adjust the previous piece or generate a random one
                const fallbackPiece = toRawArray(blocks.value[Math.floor(Math.random() * blocks.value.length)]);    
                nextPieces.value.push({
                    pieceIdx: i,
                    colorIdx: Math.floor(Math.random() * colorsCount) + 1,
                    matrix: fallbackPiece,
                });
            }
        }
    }

    function fitsInField(piece) {
        for (let i = 0; i <= rows.value - piece.length; i++) {
            for (let j = 0; j <= columns.value - piece[0].length; j++) {
                let fits = true;
                for (let x = 0; x < piece.length; x++) {
                    for (let y = 0; y < piece[x].length; y++) {
                        if (piece[x][y] === 1 && field.value[i + x][j + y] !== 0) {
                            fits = false;
                            break;
                        }
                    }
                    if (!fits) break;
                }
                if (fits) return true;
            }
        }
        return false;
    }

    function findPiecesThatFit() {
        const piecesThatFit = ref([]);
        for(let i = 0; i < blocks.value.length; i++) {
            const block = blocks.value[i];
            const blockCopy = toRawArray(block);
            if (fitsInField(blockCopy)) {
                piecesThatFit.value.push({
                    pieceIdx: i,
                    matrix: blockCopy
                });
            }
        }
        console.log('Pieces that fit: ', piecesThatFit.value);
        return piecesThatFit.value;
    }

    function clearLines(fieldGiven) {
        console.time("clearLines");
        var fieldData = null;

        if (!fieldGiven){ // Se non viene passato un campo, usiamo quello di gioco
            fieldData = field.value.map(row => [...row]); //Deep copy del campo
        }
        else
        { // Se viene passato un campo, usiamo quello
            fieldData = fieldGiven
        }
    
        
        const fullRows = new Set();
        const fullCols = new Set();
        const rowCounts = Array(rows.value).fill(0);
        const colCounts = Array(columns.value).fill(0);
        let cellsCount = rows.value * columns.value;
    
        // Una sola iterazione su tutto il campo
        for (let i = 0; i < rows.value; i++) {
            for (let j = 0; j < columns.value; j++) {
                if (fieldData[i][j] !== 0) {
                    rowCounts[i]++;
                    colCounts[j]++;
                }
            }
        }
    
        // Identifica righe e colonne piene
        for (let i = 0; i < rows.value; i++) {
            if (rowCounts[i] === columns.value) fullRows.add(i);
        }
        for (let j = 0; j < columns.value; j++) {
            if (colCounts[j] === rows.value) fullCols.add(j);
        }
    
        // Calcolo punti
        let count = fullRows.size + fullCols.size;
        points.value += count * 80;
    
        if (count >= 2 && count <= 3) {
            points.value = Math.floor(points.value * pointsMultiplier.value[0]);
        } else if (count >= 4 && count <= 5) {
            points.value = Math.floor(points.value * pointsMultiplier.value[1]);
        } else if (count > 5) {
            points.value = Math.floor(points.value * pointsMultiplier.value[2]);
        }
    
        // Cancellazione
        for (const i of fullRows) {
            fieldData[i].fill(0);
        }
        for (const j of fullCols) {
            for (let i = 0; i < rows.value; i++) {
                fieldData[i][j] = 0;
            }
        }

        field.value = fieldData;
    
        console.timeEnd("clearLines");

        sendUpdatedField();
    }

    function resetGame() {
        if (logged.value && user.value) {
            if (points.value > user.value.maxPoints) {
                const stats = { username: user.value.username, maxPoints: points.value };
                console.dir(stats);
                mp.updateStats(stats)
                    .then((result) => {
                        if (result) {
                            Object.assign(user.value, stats);
                            console.log('Stats updated');
                        } else {
                            console.log('Stats not updated');
                        }
                    }).catch((error) => {
                        console.log('Error updating stats: ' + error);
                    });
            }
        }
        points.value = 0;
        field.value = Array.from({ length: rows.value }, () => Array.from({ length: columns.value }, () => 0));
        nextPieces.value = [];
        loadExampleGame();
        generateRandomPiecesThatFit(blockColorsNumber.value);
        reset.value = 1;
        reset.value = 0;
    }

    async function fetchUs() {
        user.value = await mp.getUser(username.value);
    }

    async function login(requestedUsername, password) {
        try {
            const res = await mp.login(requestedUsername, password);
            if (res) {
                logged.value = true;
                username.value = res.username;
                await fetchUs();
                console.log('Logged in as: ' + res.username);
                return res.jwt;
            } else {
                console.log('Login failed');
                return null;
            }
        } catch (error) {
            console.log('Error logging in: ' + error);
            return null;
        }
    }

    function logout() {
        // mp.logout()
        //     .then((result) => {
        //         if (result) {
        //             logged.value = false;
        //             console.log('Logged out');
        //         } else {
        //             console.log('Logout failed');
        //         }
        //     }).catch((error) => {
        //         console.log('Error logging out: ' + error);
        //     });
        mp.disconnectWSS();
        localStorage.removeItem('jwt');
        logged.value = false;
    }

    function loginWSS() {
        if (username.value.length < 1) {
            console.log('Username required');
            return;
        }
        mp.connectWSS(username.value);
    }

    function setOpponent() {
        mp.setOpponent(opponentUsername.value)
            .then((result) => {
                console.log('Opponent set to: ' + opponentUsername.value);
            }).catch((error) => {
                console.log('Error setting opponent: ' + error);
            });
    }

    function sendUpdatedField() {
        if (logged.value === true) {
            mp.sendUpdatedField();
        }
    }

    function updateOpponentState() {
        console.log('Requesting opponent state');
        opponent.value = mp.getOpponentStatus();
    }

    return {
        pixiGame,
        texturePacks,
        selectedTexturePack,
        blockColorsNumber,
        blocks,
        rows,
        columns,
        field,
        nextPieces,
        points,
        reset,
        username,
        user,
        opponentUsername,
        logged,
        opponent,
        initPixiGame,
        destroyPixiGame,
        loadExampleGame,
        generateRandomPieces,
        generateRandomPiecesThatFit,
        clearLines,
        resetGame,
        login,
        logout,
        loginWSS,
        setOpponent,
        sendUpdatedField,
        updateOpponentState
    }
});