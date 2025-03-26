import { defineStore } from "pinia";
import { reactive, ref } from "vue";

// Campo di gioco di esempio
const exampleGame = {
    "field": [
        [ 1, 1, 1, 0, 0, 0, 6, 6 ],
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

    const rows = ref(8);
    const columns = ref(8);
    const nextPiecesAmount = ref(3);
    const field = ref(Array.from({ length: rows }, () => Array.from({ length: columns }, () => 0)));
    const nextPieces = ref([]);

    function loadExampleGame() {
        field.value = exampleGame.field;
    }

    function getRandomPieces() {
        nextPieces.value = Array.from({ length: nextPiecesAmount.value }, () => {
            const idx = Math.floor(Math.random() * blocks.value.length);
            const selectedBlock = blocks.value[idx];
            const blockCopy = {...selectedBlock};

            return blockCopy;
        });
    }

    return { blocks, rows, columns, field, nextPieces, loadExampleGame, getRandomPieces }
});