import { toRawArray } from "@/scripts/utils";
import { defineStore } from "pinia";
import { reactive, ref } from "vue";

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

    let points = 0;
    const rows = ref(8);
    const columns = ref(8);
    const nextPiecesAmount = ref(3);
    const field = ref(Array.from({ length: rows.value }, () => Array.from({ length: columns.value }, () => 0)));
    //const fieldSprites = ref(Array.from({ length: rows.value }, () => Array.from({ length: columns.value }, () => null)));
    const fieldSprites = ref([]);
    const nextPieces = ref([]);

    const texturePacks = ref([ 'default', 'blockMC' ]);
    const selectedTexturePack = texturePacks.value[1];

    function loadExampleGame() {
        field.value = exampleGame.field;
    }

    function generateRandomPieces(colorsCount) {
        nextPieces.value = [];

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

            nextPieces.value.push(nextPiece);
        }

        // nextPieces.value = Array.from({ length: nextPiecesAmount.value }, () => {
        //     const idx = Math.floor(Math.random() * blocks.value.length);
        //     const selectedBlock = blocks.value[idx];
        //     let blockCopy = {...selectedBlock};
        //     console.dir(blockCopy);
        //     blockCopy = randomizePieceColors(toRawArray(blockCopy), colorsCount);
        //     console.dir(blockCopy);

        //     return blockCopy;
        // });
    }
  
    function clearLines() {
        let arrayRighe = [];
        let arrayColonne = [];

        for (let i = 0; i < rows.value; i++) { //Controlla ogni riga
            for (let j = 0; j < columns.value; j++) {//Controlla ogni colonna
                if(field.value[i][j] != 0) {//Controlla appena trova un 1 se ci sono righe/colonne da eliminare
                    for(let idxRiga = 0; idxRiga < rows.value; idxRiga++){
                        if(field.value[idxRiga][j] == 0 || arrayColonne.includes(j)) {
                            break;
                        }
                        else {
                            if(idxRiga == rows.value - 1) {
                                arrayColonne.push(j)
                                points += 80;
                                console.log('Colonna Nr.' + j + 'trovata');
                            }
                        }
                    }

                    for(let idxColonna = 0; idxColonna < columns.value; idxColonna++) {
                        if(field.value[i][idxColonna] == 0 || arrayRighe.includes(i)) {
                            break;
                        }
                        else {
                            if(idxColonna == columns.value - 1) {
                                arrayRighe.push(i)
                                points += 80;
                                console.log('Riga Nr.' + i + 'trovata');
                            }
                        }                       
                    }
                }
            }

        }

        deleteRowAndColumns(arrayRighe, arrayColonne);
    }

    function deleteRowAndColumns(righe, colonne){
        console.dir(righe);
        console.dir(colonne);
        if(colonne.length != 0) {
            for(let nrColonne = 0; nrColonne < colonne.length; nrColonne++) {
                for(let i = 0; i < rows.value; i++) {
                    field.value[i][colonne] = 0
                }
            }
        }
        if(righe.length != 0) {
            for(let nrRighe = 0; nrRighe < righe.length; nrRighe++) {
                for(let i = 0; i < columns.value; i++) {
                    field.value[righe][i] = 0
                }
            }
        }
    }

    return {
        texturePacks,
        selectedTexturePack,
        blocks,
        rows,
        columns,
        field,
        fieldSprites,
        nextPieces,
        loadExampleGame,
        generateRandomPieces,
        deleteRowOrColumn: deleteRowAndColumns,
        clearLines
    }
});