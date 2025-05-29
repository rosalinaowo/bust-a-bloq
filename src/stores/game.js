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

    const texturePacks = ref([ 'default', 'blockMC', 'blockBandT' ]);
    const selectedTexturePack = texturePacks.value[0];
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
        const bestPieces = ref([]);
        const normalPieces = ref([]);
    
        //Ciclo per trovare pezzi adatti al campo
        for (let i = 0; i < blocks.value.length; i++) {
            const colorIdx = Math.floor(Math.random() * colorsCount) + 1;
            const selectedBlock = blocks.value[i];
            const blockCopy = toRawArray(selectedBlock);
            
            // Controlla se il pezzo è "migliore" nel campo
            if (fitsInField(blockCopy, colorIdx) === "bestPiece") {
                bestPieces.value.push({
                    pieceIdx: i,
                    colorIdx: colorIdx,
                    matrix: blockCopy,
                });     
            }
            else if (fitsInField(blockCopy, colorIdx) === "pieceFound")
            {
                normalPieces.value.push({
                    pieceIdx: i,
                    colorIdx: colorIdx,
                    matrix: blockCopy,
                });         
            }
        }
        
        let piecesNeeded = nextPiecesAmount.value;

        // Mischia i pezzi migliori e normali
        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        shuffle(bestPieces.value);
        shuffle(normalPieces.value);

        let bestIdx = 0;
        let normalIdx = 0;
        
        for (let k = 0; k < piecesNeeded; k++) {
            // Tutti e due i tipi di pezzi disponibili
            if (bestIdx < bestPieces.value.length && normalIdx < normalPieces.value.length) {
                if (Math.random() < 0.5) {
                    console.log("Adding best piece: ", bestPieces.value[bestIdx]);
                    nextPieces.value.push(bestPieces.value[bestIdx++]);
                } else {
                    console.log("Adding normal piece: ", normalPieces.value[normalIdx]);
                    nextPieces.value.push(normalPieces.value[normalIdx++]);
                }
            }
            // Solo pezzi migliori disponibili
            else if (bestIdx < bestPieces.value.length) {
                console.log("Adding best piece: ", bestPieces.value[bestIdx]);
                nextPieces.value.push(bestPieces.value[bestIdx++]);
            }
            // Solo pezzi normali disponibili
            else if (normalIdx < normalPieces.value.length) {
                console.log("Adding normal piece: ", normalPieces.value[normalIdx]);
                nextPieces.value.push(normalPieces.value[normalIdx++]);
            }
            // Fallback
            else {
                const fallbackPiece = toRawArray(blocks.value[Math.floor(Math.random() * blocks.value.length)]);
                console.log("Adding fallback piece: ", fallbackPiece);
                nextPieces.value.push({
                    pieceIdx: Math.floor(Math.random() * blocks.value.length),
                    colorIdx: Math.floor(Math.random() * colorsCount) + 1,
                    matrix: fallbackPiece,
                });
            }
        }
    }

    function fitsInField(piece) {
        let foundNormal = false;
        for (let i = 0; i <= rows.value - piece.length; i++) {
            for (let j = 0; j <= columns.value - piece[0].length; j++) {
                let fits = true;
                for (let x = 0; x < piece.length; x++) {
                    for (let y = 0; y < piece[x].length; y++) {
                        if (piece[x][y] !== 0 && field.value[i + x][j + y] !== 0) {
                            fits = false;
                            break;
                        }
                    }
                    if (!fits) break;
                }
                if (fits) {
                    if (isBestPiece(piece, i, j)) {
                        console.log('Best piece fits at ', i, j);
                        return "bestPiece";
                    } else {
                        foundNormal = true;
                    }
                }
            }
        }
        if (foundNormal) return "pieceFound";
        return "notFound";
    }

    function isBestPiece(piece, xCoord, yCoord) {
        var fieldData = field.value.map(row => [...row]);
        for (let i = 0; i < piece.length; i++) {
            for (let j = 0; j < piece[i].length; j++) {
                if (piece[i][j] === 1) {
                    fieldData[xCoord + i][yCoord + j] = 1;
                }
            }
        }
        return clearLines(fieldData) === true;
    }

    function clearLines(fieldGiven) {
        var fieldData = null;

        if (!fieldGiven){ // Se non viene passato un campo, usiamo quello di gioco
            fieldData = field.value.map(row => [...row]); //Deep copy del campo
        }
        else
        { // Se viene passato un campo, usiamo quello
            fieldData = fieldGiven
        }
    
        
        const fullRows = new Set(); //Array che contiene gli indici delle righe piene
        const fullCols = new Set(); //Array che contiene gli indici delle colonne piene
        const rowCounts = Array(rows.value).fill(0); //Array che contiene il numero di celle piene per riga
        const colCounts = Array(columns.value).fill(0); //Idem per colonne
        let cellsCount = rows.value * columns.value;
        let didItRemove = false; //Ritorna true se sono state rimosse righe o colonne

        //Controlla quali caselle sono piene
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
            if (rowCounts[i] === columns.value) {
                fullRows.add(i);
                didItRemove = true;
            }
        }
        for (let j = 0; j < columns.value; j++) {
            if (colCounts[j] === rows.value) {
                fullCols.add(j);
                didItRemove = true;
            }    
        }
    
        // Calcolo punti
        if (!fieldGiven) {
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

        sendUpdatedField();
        }
        return didItRemove;
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

    function checkLoss() {
        // True se nessuno dei pezzi successivi può essere piazzato
        for (let idx = 0; idx < nextPieces.value.length; idx++) {
            const piece = nextPieces.value[idx]?.matrix;
            if (!piece) continue;
            if (fitsInField(piece) !== "notFound") {
                return false; // Almeno un pezzo può essere piazzato
            }
        }
        console.log("The player has lost the game!");
        return true;
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

    async function register(requestedUsername, password) {
        try {
            const res = await mp.register(requestedUsername, password);
            if (res) {
                logged.value = true;
                username.value = res.username;
                await fetchUs();
                console.log('Registered and logged in as: ' + res.username);
                return res.jwt;
            } else {
                console.log('Registration failed');
                return null;
            }
        } catch (error) {
            console.log('Error registering: ' + error);
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

    function setOpponent(username) {
        return mp.setOpponent(username)
            .then((result) => {
                opponentUsername.value = username;
                console.log('Opponent set to: ' + opponentUsername.value);
                return result;
            }).catch((error) => {
                console.log('Error setting opponent: ' + error);
                return false;
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
        register,
        logout,
        loginWSS,
        setOpponent,
        sendUpdatedField,
        updateOpponentState,
        checkLoss
    }
});