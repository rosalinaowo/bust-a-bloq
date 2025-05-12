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
    const pointsMultiplier = ref([ 1.1, 1.2, 1.5 ]);
    const points = ref(0);

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
    }
  
    function clearLines() {
        let count = 0;
        let arrayRighe = [];
        let arrayColonne = [];

        /*for (let i = 0; i < rows.value; i++) { //Controlla ogni riga
            for (let j = 0; j < columns.value; j++) {//Controlla ogni colonna
                if(field.value[i][j] != 0) {//Controlla appena trova un 1 se ci sono righe/colonne da eliminare
                    for(let idxRiga = 0; idxRiga < rows.value; idxRiga++){
                        if(field.value[idxRiga][j] == 0 || arrayColonne.includes(j)) {
                            break;
                        }
                        else {
                            if(idxRiga == rows.value - 1) {
                                arrayColonne.push(j);
                                count++;
                                points.value += 80;
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
                                arrayRighe.push(i);
                                count++;
                                points.value += 80;
                                console.log('Riga Nr.' + i + 'trovata');
                            }
                        }                       
                    }
                }
            }*/

        for (let i = 0; i < rows.value; i++) { //Controlla ogni riga
            {
                if(field.value[i].every((cell) => cell != 0)) { //Se in una riga tutti i numeri sono diversi da 0 la elimina
                    arrayRighe.push(i);
                    count++;
                    points.value += 80;
                    console.log('Riga Nr.' + i + 'trovata');
                }
            }
        }
        for (let j = 0; j < columns.value; j++) { // Controlla ogni colonna
            let colonna = field.value.map(row => row[j]); // Estrai la colonna j-esima
            if (colonna.every(cell => cell != 0)) { // Se tutti i numeri nella colonna sono diversi da 0
                arrayColonne.push(j); // Salva l'indice della colonna
                count++;
                points.value += 80;
                console.log('Colonna Nr.' + j + ' trovata');
            }
        }

        switch (count) {
            case 0: case 1: break;
            case 2: case 3: points.value = Math.floor(points.value * pointsMultiplier.value[0]); break;
            case 4: case 5: points.value = Math.floor(points.value * pointsMultiplier.value[1]); break;
            default: points.value = Math.floor(points.value * pointsMultiplier.value[2]); break;
        }

        deleteRowAndColumns(arrayRighe, arrayColonne);
    }

    function deleteRowAndColumns(righe, colonne){
        console.dir(righe);
        console.dir(colonne);
        if(colonne.length != 0) {
            for(let nrColonne = 0; nrColonne < colonne.length; nrColonne++) {
                for(let i = 0; i < rows.value; i++) {
                    field.value[i][colonne[nrColonne]] = 0;
                }
            }
        }
        if(righe.length != 0) {
            for(let nrRighe = 0; nrRighe < righe.length; nrRighe++) {
                for(let i = 0; i < columns.value; i++) {
                    console.log(`RIGAAAAA: ${righe}`)
                    field.value[righe[nrRighe]][i] = 0;
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
        points,
        loadExampleGame,
        generateRandomPieces,
        deleteRowAndColumns,
        clearLines
    }
});