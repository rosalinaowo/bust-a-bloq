import { Application, Assets, Container, FillGradient, Graphics, GraphicsContext, nextPow2, Sprite, Text, TextStyle, TilingSprite, SCALE_MODES } from "pixi.js";
import { useGameStore } from "@/stores/game";
import { toRawArray } from "@/scripts/utils";

export class PixiGame {
    constructor(htmlContainer) {
        this.gameStore = useGameStore();

        this.gameStore.loadExampleGame();
        this.gameStore.getRandomPieces();
        //console.dir(this.gameStore.nextPieces);

        this.WIDTH = 800;
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

        this.BLOCK_TEXTURE_BASE_PATH = `/src/assets/textures/${this.gameStore.selectedTexturePack}/`;
        this.BLOCK_COLORS_NUMBER = 7;
        this.BLOCK_TEXTURE_PATHS = Array.from({ length: this.BLOCK_COLORS_NUMBER }, (_, i) => `${this.BLOCK_TEXTURE_BASE_PATH}block${i + 1}.png`);
        this.BLOCK_SIDE = 50;

        this.dragTarget = null;

        this.app = new Application();

        this.initMatPoints();

        this.init(htmlContainer);
    }

    async loadBlockTextures() {
        for (let i = 0; i < this.BLOCK_COLORS_NUMBER; i++) {
            Assets.add({ alias: 'block' + i, src: this.BLOCK_TEXTURE_PATHS[i] });
        }
        
        return await Assets.load(Array.from({ length: this.BLOCK_COLORS_NUMBER }, (_, i) => 'block' + i));
    }

    initMatPoints() {
        for (let r = 0; r < this.gameStore.field.length; r++) {
            for (let c = 0; c < this.gameStore.field[r].length; c++) {
                const p = new Sprite();
                p.x = c * this.BLOCK_SIDE + this.FIELD_X + this.FIELD_BORDER_STROKE_WIDTH;
                p.y = r * this.BLOCK_SIDE + this.FIELD_Y + this.FIELD_BORDER_STROKE_WIDTH;
                p.width = p.height = this.BLOCK_SIDE;

                this.gameStore.fieldSprites.value[r][c] = p;
            }
        }
    }

    getFieldGraphic() {
        const container = new Container();
        const graphics = new Graphics();

        // Border
        graphics.roundRect(this.FIELD_X, this.FIELD_Y, this.FIELD_BORDER_WIDTH, this.FIELD_BORDER_HEIGHT, this.FIELD_CORNER_RADIUS);
        graphics.stroke({ width: this.FIELD_BORDER_STROKE_WIDTH, color: 0xabe3ff, alignment: 1 });

        container.addChild(graphics);

        // Pieces
        for (let r = 0; r < this.gameStore.field.length; r++) {
            for (let c = 0; c < this.gameStore.field[r].length; c++) {
                const texture = Assets.get('block' + (this.gameStore.field[r][c] - 1));
                const block = Sprite.from(texture);
                block.x = c * this.BLOCK_SIDE + this.FIELD_X + this.FIELD_BORDER_STROKE_WIDTH;
                block.y = r * this.BLOCK_SIDE + this.FIELD_Y + this.FIELD_BORDER_STROKE_WIDTH;
                block.width = block.height = this.BLOCK_SIDE;

                const p = new Sprite();


                if (this.gameStore.field[r][c] != 0) container.addChild(block);
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

        this.app.stage.addChild(this.getFieldGraphic());

        this.app.stage.addChild(this.drawNextPieces());
    }

    destroy() {
        this.app.destroy(true, { children: true, texture: true });
    }

    drawNextPieces() {
        const container = new Container();
        container.x = this.FIELD_X;
        container.y = this.NEXT_PIECES_Y;

        let lastPieceWidth = 0;

        for (let p = 0; p < this.gameStore.nextPieces.length; p++) {
            let maxCols = 0;
            const pieceContainer = new Container();
            pieceContainer.x = lastPieceWidth;
            pieceContainer.y = 0;

            pieceContainer.eventMode = 'static'
            pieceContainer.cursor = 'pointer';
            pieceContainer.on('pointerdown', (event) => this.onDragStart(event, pieceContainer));
            this.app.stage.on('pointerup', (event) => this.onDragEnd(event));
            this.app.stage.on('pointerupoutside', (event) => this.onDragEnd(event));


            const piece = toRawArray(this.gameStore.nextPieces[p]);
            const textureColor = Math.floor(Math.random() * this.BLOCK_COLORS_NUMBER);
            const texture = Assets.get('block' + textureColor);
            
            for (let r = 0; r < piece.length; r++) {
                let lastBlockX = 0;
                if (piece[r].length > maxCols) maxCols = piece[r].length;
                
                for (let c = 0; c < piece[r].length; c++) {
                    const block = Sprite.from(texture);
                    block.width = block.height = this.BLOCK_SIDE;
                        
                    block.x = lastBlockX;
                    block.y = r * this.BLOCK_SIDE;
                    lastBlockX = block.x + this.BLOCK_SIDE;

                    if (piece[r][c] != 0) pieceContainer.addChild(block);
                }
            }

            lastPieceWidth += maxCols * this.BLOCK_SIDE + this.NEXT_PIECES_DISTANCE;

            let x = new Text({ text: 'x', style: { fontSize: 16, fill: 0xff0000}});
            pieceContainer.addChild(x);

            pieceContainer.pivot.set(pieceContainer.width / 2, pieceContainer.height / 2);
            container.addChild(pieceContainer);
        }

        return container;
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
        if (this.dragTarget) {
            this.app.stage.off('pointermove', this.onDragMove);
            this.dragTarget = null;
        }
    }
}