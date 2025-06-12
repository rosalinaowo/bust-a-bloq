import { Application, Assets, Container, Graphics, Sprite, Text, TextStyle, SCALE_MODES } from "pixi.js";
import { useGameStore } from "@/stores/game";
import { toRaw, watch } from "vue";

const isProd = import.meta.env.PROD;
const ASSET_BASE_PATH = isProd ? '/assets' : '/src/assets';

export class PixiGame {
    constructor(htmlContainer) {
        this.gameStore = useGameStore();

        this.WIDTH = 1000;
        this.HEIGHT = 800;
        this.CENTER_X = this.WIDTH / 2;
        this.CENTER_Y = this.HEIGHT / 2;
        this.FIELD_BORDER_WIDTH = 430;
        this.FIELD_BORDER_HEIGHT = 430;
        this.FIELD_CORNER_RADIUS = 10;
        this.FIELD_BORDER_STROKE_WIDTH = 15;
        this.FIELD_X = this.CENTER_X - this.FIELD_BORDER_WIDTH / 2;
        this.FIELD_Y = this.CENTER_Y - this.FIELD_BORDER_HEIGHT / 2;
        this.NEXT_PIECES_Y = this.FIELD_Y + this.FIELD_BORDER_HEIGHT;
        this.NEXT_PIECES_DISTANCE = 20;

        this.BLOCK_TEXTURE_BASE_PATH = `${ASSET_BASE_PATH}/textures/${this.gameStore.selectedTexturePack}/`;
        this.BLOCK_COLORS_NUMBER = 7;
        this.BLOCK_TEXTURE_PATHS = Array.from({ length: this.BLOCK_COLORS_NUMBER }, (_, i) => `${this.BLOCK_TEXTURE_BASE_PATH}block${i + 1}.png`);
        this.BLOCK_SIDE = 50;

        this.gameStore.blockColorsNumber = this.BLOCK_COLORS_NUMBER;
        this.gameStore.resetGame();

        this.dragTarget = null;

        this.app = new Application();

        //this.initMatPoints();

        this.init(htmlContainer);

        watch(() => this.gameStore.reset, (value) => {
            console.log('VIEW CHANGE');
            if (value) {
                console.log('VIEW RESET')
                this.updateView();
                this.gameStore.reset = false;
            }
        });
    }

    async loadBlockTextures() {
        for (let i = 1; i <= this.BLOCK_COLORS_NUMBER; i++) {
            Assets.add({ alias: 'block' + i, src: this.BLOCK_TEXTURE_PATHS[i - 1]});
        }
        
        return await Assets.load(Array.from({ length: this.BLOCK_COLORS_NUMBER }, (_, i) => 'block' + (i + 1)));
    }

    // initMatPoints() {    WALL OF SHAME, METODO DISASTROSO E DANNOSO, big ball o fmud
    //     for (let r = 0; r < this.gameStore.field.length; r++) {
    //         const rowPieces = [];
    //         for (let c = 0; c < this.gameStore.field[r].length; c++) {
    //             const p = new Sprite();
    //             p.x = c * this.BLOCK_SIDE + this.FIELD_X + this.FIELD_BORDER_STROKE_WIDTH;
    //             p.y = r * this.BLOCK_SIDE + this.FIELD_Y + this.FIELD_BORDER_STROKE_WIDTH;
    //             p.width = p.height = this.BLOCK_SIDE;


    //             // this.gameStore.fieldSprites.value[r][c] = p;
    //             rowPieces.push(p);
    //         }

    //         this.gameStore.fieldSprites.push(rowPieces);
    //     }
    // }

    getFieldContainer(mode) {
        const container = new Container();
        const graphics = new Graphics();

        graphics.roundRect(0, 0, this.FIELD_BORDER_WIDTH, this.FIELD_BORDER_HEIGHT, this.FIELD_CORNER_RADIUS);
        graphics.stroke({ width: this.FIELD_BORDER_STROKE_WIDTH, color: 0xabe3ff, alignment: 1 });

        container.addChild(graphics);

        let fieldMatrix = mode === 0 ? this.gameStore.field : this.gameStore.opponent.field;

        for (let r = 0; r < fieldMatrix.length; r++) {
            for (let c = 0; c < fieldMatrix[r].length; c++) {
                if (fieldMatrix[r][c] != 0) {
                    const texture = Assets.get('block' + (fieldMatrix[r][c]));
                    const block = Sprite.from(texture);
                    block.x = c * this.BLOCK_SIDE + this.FIELD_BORDER_STROKE_WIDTH;
                    block.y = r * this.BLOCK_SIDE + this.FIELD_BORDER_STROKE_WIDTH;
                    block.width = block.height = this.BLOCK_SIDE;
                    container.addChild(block);
                }
            }
        }

        return container;
    }

    async init(htmlContainer) {
        this.BLOCK_TEXTURES = await this.loadBlockTextures();

        await this.app.init({
            background: '#0d2154',
            width: this.WIDTH,
            height: this.HEIGHT,
            antialias: true,
            autoDensity: true,
            resolution: 1,
            eventMode: 'static'
        });

        this.app.stage.hitArea = this.app.screen;
        this.app.stage.on('pointerUp', this.onDragEnd);
        this.app.stage.on('pointerupoutside', this.onDragEnd);

        htmlContainer.appendChild(this.app.canvas);

        // Title
        const titleTextStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xffffff,
            stroke: {
                color: 0xde3249,
                width: 4,
                join: 'round'
            }
        });
        const titleText = new Text({ text: 'Bust-a-bloq', style: titleTextStyle });
        titleText.x = this.CENTER_X - titleText.width / 2;
        titleText.y = 0;
        this.app.stage.addChild(titleText);

        const pointsTextStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 36,
            fill: 0xffffff
        });
        const pointsText = new Text({ text: `Points: ${this.gameStore.points}`, style: pointsTextStyle });
        pointsText.x = 5;
        pointsText.y = 0;

        this.app.stage.addChild(pointsText);

        this.resetButton = this.getResetButton();
        this.resetButton.x = pointsText.x;
        this.resetButton.y = pointsText.y + pointsText.height + 5;
        this.app.stage.addChild(this.resetButton);

        this.disconnectButton = this.getDisconnectButton();
        this.disconnectButton.x = pointsText.x;
        this.disconnectButton.y = this.resetButton.y + this.resetButton.height + 5;
        this.disconnectButton.visible = false;
        this.app.stage.addChild(this.disconnectButton);

        watch(() => this.gameStore.points, (newPoints) => {
            pointsText.text = `Points: ${newPoints}`;
        });

        watch(() => this.gameStore.opponent, (opponent) => {
            this.updateOpponentView();
            // if (this.gameStore.opponent && this.gameStore.opponent.hasLost) {
            //     this.showPopup(false);
            // }
        });

        watch(() => this.gameStore.opponentHasLost, (hasLost) => {
            if (hasLost) {
                this.showPopup(false);
            }
        });

        this.fieldContainer = undefined;
        this.nextPiecesContainer = undefined;
        this.opponentContainer = undefined;

        this.updateView();
    }

    destroy() {
        this.app.destroy(true, { children: true, texture: true });
    }

    updateView() {
        this.app.stage.removeChild(this.fieldContainer);
        this.app.stage.removeChild(this.nextPiecesContainer);

        this.fieldContainer = this.getFieldContainer(0);
        this.fieldContainer.x = this.FIELD_X;
        this.fieldContainer.y = this.FIELD_Y;
        this.nextPiecesContainer = this.getNextPiecesContainer();
        this.nextPiecesContainer.x = this.FIELD_X;
        this.nextPiecesContainer.y = this.NEXT_PIECES_Y;

        this.app.stage.addChild(this.fieldContainer);
        this.app.stage.addChild(this.nextPiecesContainer);
    }

    updateOpponentView() {
        this.app.stage.removeChild(this.opponentContainer);
        this.resetButton.eventMode = 'none';
        if (!this.gameStore.opponent) {
            this.resetButton.eventMode = 'static';
            this.disconnectButton.visible = false;
            return;
        }

        this.disconnectButton.visible = true;

        const textStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 22,
            fill: 0xffffff
        });
        const usernameText = new Text({ text: `${this.gameStore.opponent.username} (Points: ${this.gameStore.opponent.points})`, style: textStyle });

        this.opponentContainer = new Container();
        this.opponentContainer.x = 5;
        this.opponentContainer.y = 150;
        this.opponentContainer.addChild(usernameText);

        const opFieldContainer = this.getFieldContainer(1);
        opFieldContainer.scale = 0.4;
        opFieldContainer.x = 0;
        opFieldContainer.y = 30;
        this.opponentContainer.addChild(opFieldContainer);

        this.app.stage.addChild(this.opponentContainer);
    }

    getResetButton() {
        const rectangle = new Graphics();
        const container = new Container();

        const textStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff,
            // stroke: {
            //     color: 0xff5d35,
            //     width: 4,
            //     join: 'round'
            // }
        });
        const text = new Text({ text: 'Reset', style: textStyle });
        text.eventMode = 'none';

        rectangle.roundRect(0, 0, text.width + 15, text.height + 10, 5);
        rectangle.fill({ color: 0xbb2d3b });

        text.x = rectangle.width / 2 - text.width / 2;
        text.y = rectangle.height / 2 - text.height / 2;
        
        container.addChild(rectangle);
        container.addChild(text);

        rectangle.eventMode = 'static';
        rectangle.cursor = 'pointer';
        rectangle.on('pointerdown', () => {
            this.gameStore.disconnectOpponent();
            this.gameStore.resetGame();
            this.updateView();
        });

        return container;
    }

    getDisconnectButton() {
        const rectangle = new Graphics();
        const container = new Container();

        const textStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff,
            // stroke: {
            //     color: 0xff5d35,
            //     width: 4,
            //     join: 'round'
            // }
        });
        const text = new Text({ text: 'Disconnect', style: textStyle });
        text.eventMode = 'none';

        rectangle.roundRect(0, 0, text.width + 15, text.height + 10, 5);
        rectangle.fill({ color: 0xbb2d3b });

        text.x = rectangle.width / 2 - text.width / 2;
        text.y = rectangle.height / 2 - text.height / 2;
        
        container.addChild(rectangle);
        container.addChild(text);

        rectangle.eventMode = 'static';
        rectangle.cursor = 'pointer';
        rectangle.on('pointerdown', () => {
            this.gameStore.disconnectOpponent();
            this.updateView();
        });

        return container;
    }

    getNextPiecesContainer() {
        const container = new Container();
        // container.x = this.FIELD_X;
        // container.y = this.NEXT_PIECES_Y;

        let lastPieceWidth = 0;

        for (let p = 0; p < this.gameStore.nextPieces.length; p++) {
            const piece = toRaw(this.gameStore.nextPieces[p]);
            if (!piece || piece.pieceIdx === undefined) continue;

            const pieceMatrix = piece.matrix;
            const texture = Assets.get('block' + piece.colorIdx);

            let maxCols = 0;
            const pieceContainer = new Container();
            pieceContainer.piece = piece;
            pieceContainer.x = lastPieceWidth;
            pieceContainer.y = 0;

            pieceContainer.eventMode = 'static';
            pieceContainer.cursor = 'pointer';
            pieceContainer.on('pointerdown', (event) => this.onDragStart(event, pieceContainer));
            this.app.stage.on('pointerup', (event) => this.onDragEnd(event));
            this.app.stage.on('pointerupoutside', (event) => this.onDragEnd(event));
            
            for (let r = 0; r < pieceMatrix.length; r++) {
                let lastBlockX = 0;
                if (pieceMatrix[r].length > maxCols) maxCols = pieceMatrix[r].length;
                
                for (let c = 0; c < pieceMatrix[r].length; c++) {
                    const block = Sprite.from(texture);
                    block.width = block.height = this.BLOCK_SIDE;
                        
                    block.x = lastBlockX;
                    block.y = r * this.BLOCK_SIDE;
                    lastBlockX = block.x + this.BLOCK_SIDE;

                    if (pieceMatrix[r][c] != 0) pieceContainer.addChild(block);
                }
            }

            lastPieceWidth += maxCols * this.BLOCK_SIDE + this.NEXT_PIECES_DISTANCE;

            let x = new Text({ text: 'x', style: { fontSize: 16, fill: 0xff0000}});
            pieceContainer.addChild(x);
            container.addChild(pieceContainer);
        }

        return container;
    }

    showPopup(hasLost) {
        // Remove existing popup if present
        if (this.lossPopup) {
            this.app.stage.removeChild(this.lossPopup);
            this.lossPopup = null;
        }

        const popup = new Container();
        popup.zIndex = 1000;

        // --- FULLSCREEN OVERLAY ---
        const overlay = new Graphics();
        overlay.rect(0, 0, this.WIDTH, this.HEIGHT);
        overlay.fill({ color: 0x000000, alpha: 0.4 }); // semi-transparent black
        overlay.eventMode = 'static'; // blocks pointer events
        overlay.cursor = 'default';
        popup.addChild(overlay);

        // --- POPUP CONTENT ---

        // Background rectangle (centered)
        const bgWidth = 300;
        const bgHeight = 150;
        const bg = new Graphics();
        bg.roundRect(0, 0, bgWidth, bgHeight, 20);
        bg.fill({ color: 0x222244, alpha: 0.95 });
        bg.x = this.CENTER_X - bgWidth / 2;
        bg.y = this.CENTER_Y - bgHeight / 2;
        popup.addChild(bg);

        // "You lost!" text (centered in bg)
        const textStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        const text = new Text({ text: hasLost ? 'You lost!' : 'You won!', style: textStyle });
        text.x = bg.x + bgWidth / 2 - text.width / 2;
        text.y = bg.y + 30;
        popup.addChild(text);

        // "OK" button (centered in bg)
        const buttonWidth = 100;
        const buttonHeight = 40;
        const button = new Graphics();
        button.roundRect(0, 0, buttonWidth, buttonHeight, 10);
        button.fill({ color: hasLost ?  0xbb2d3b : 0x2bbd3b }); // red for loss, green for win
        button.x = bg.x + bgWidth / 2 - buttonWidth / 2;
        button.y = bg.y + 90;
        button.eventMode = 'static';
        button.cursor = 'pointer';
        button.on('pointerdown', () => {
            this.app.stage.removeChild(popup);
            this.lossPopup = null;
            this.gameStore.resetGame();
            this.updateView();
            this.gameStore.opponentHasLost = false;
        });

        const buttonText = new Text({ text: 'OK', style: { fontSize: 22, fill: 0xffffff } });
        buttonText.eventMode = 'none';
        buttonText.x = button.width / 2 - buttonText.width / 2;
        buttonText.y = button.height / 2 - buttonText.height / 2;
        button.addChild(buttonText);

        popup.addChild(button);

        // Set popup position to (0, 0)
        popup.x = 0;
        popup.y = 0;

        this.app.stage.addChild(popup);
        this.lossPopup = popup;
    }

    checkIfPieceFits(pieceContainer, gridX, gridY) {
        const pieceMatrix = pieceContainer.piece.matrix;
        try {
            for (let r = 0; r < pieceMatrix.length; r++) {
                for (let c = 0; c < pieceMatrix[r].length; c++) {
                    if (pieceMatrix[r][c] != 0) {
                        if (this.gameStore.field[gridY + r][gridX + c] != 0) return false;
                    }
                }
            }

            return true;
        } catch { return false; }
    }

    placePieceInField(pieceContainer, gridX, gridY) {
        const pieceMatrix = pieceContainer.piece.matrix;
        const colorIdx = pieceContainer.piece.colorIdx;

        for (let r = 0; r < pieceMatrix.length; r++) {
            for (let c = 0; c < pieceMatrix[r].length; c++) {
                if (pieceMatrix[r][c] != 0) {
                    this.gameStore.field[gridY + r][gridX + c] = colorIdx;
                }
            }
        }

        // Remove the used piece from nextPieces
        const idx = this.gameStore.nextPieces.indexOf(pieceContainer.piece);
        if (idx !== -1) {
            this.gameStore.nextPieces.splice(idx, 1);
        }

        // If all pieces have been used, generate new ones
        if (this.gameStore.nextPieces.length === 0) {
            this.gameStore.generateRandomPiecesThatFit(this.BLOCK_COLORS_NUMBER);
        }
    }

    getMatrixCoordinates(dragTarget) {
        const gridX = Math.round((dragTarget.x - this.FIELD_BORDER_STROKE_WIDTH) / this.BLOCK_SIDE);
        const gridY = Math.round((dragTarget.y + this.NEXT_PIECES_Y - this.FIELD_Y - this.FIELD_BORDER_STROKE_WIDTH) / this.BLOCK_SIDE);

        return { gridX, gridY };
    }

    onDragMove(event) {
        if (this.dragTarget) {
            this.dragTarget.parent.toLocal(event.global, null, this.dragTarget.position);
        }
    }

    onDragStart(event, piece) {
        this.dragTarget = piece;  // Store reference to the dragged piece
        this.app.stage.on('pointermove', this.onDragMove, this);
    }

    onDragEnd() {
        if (!this.dragTarget) return;

        const { gridX, gridY } = this.getMatrixCoordinates(this.dragTarget);

        let doesItFit = this.checkIfPieceFits(this.dragTarget, gridX, gridY);

        if(doesItFit) {
            this.placePieceInField(this.dragTarget, gridX, gridY);
        }

        this.gameStore.clearLines();
        this.updateView();

        this.app.stage.off('pointermove', this.onDragMove);
        this.dragTarget = null;

        if (this.gameStore.checkLoss()) {
            console.log('Hai perso!');
            //alert('Hai perso! Riprova!');
            //this.gameStore.resetGame();
            //this.updateView();
            this.showPopup(true);
        }
        
    }
}