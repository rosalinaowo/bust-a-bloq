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
        const fieldData = field.value;

        for (let i = 0; i < rows.value; i++) { //Controlla ogni riga
                if(fieldData[i].every((cell) => cell != 0)) { //Se in una riga tutti i numeri sono diversi da 0 la elimina
                    arrayRighe.push(i);
                    count++;
                    points.value += 80;
                }
        }
        
        for (let j = 0; j < columns.value; j++) { // Controlla ogni colonna
            let colonna = fieldData.map(row => row[j]); // Estrai la colonna j-esima
            if (colonna.every(cell => cell != 0)) { // Se tutti i numeri nella colonna sono diversi da 0
                arrayColonne.push(j); // Salva l'indice della colonna
                count++;
                points.value += 80;
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
        if(colonne.length != 0) { //Se c'è una colonna piena
            for(let nrColonne = 0; nrColonne < colonne.length; nrColonne++) {
                for(let i = 0; i < rows.value; i++) {
                    field.value[i][colonne[nrColonne]] = 0;
                }
            }
        }
        if(righe.length != 0) { //Se c'è una riga piena
            for(let nrRighe = 0; nrRighe < righe.length; nrRighe++) {
                field.value[righe[nrRighe]].fill(0); // Riempi la riga con 0
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