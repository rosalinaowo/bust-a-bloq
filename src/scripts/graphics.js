import { Application, Assets, Container, FillGradient, Graphics, GraphicsContext, Sprite, Text, TextStyle, TilingSprite } from "pixi.js";
import { useGameStore } from "@/stores/game";

export class PixiGame {
    constructor(htmlContainer) {
        this.gameStore = useGameStore();

        this.gameStore.loadExampleGame();
        this.gameStore.getRandomPieces();
        //console.dir(this.gameStore.nextPieces);

        this.WIDTH = 600;
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

        this.BLOCK_TEXTURE_BASE_PATH = '/src/assets/textures/block/';
        this.BLOCK_COLORS_NUMBER = 7;
        this.BLOCK_TEXTURE_PATHS = Array.from({ length: this.BLOCK_COLORS_NUMBER }, (_, i) => `${this.BLOCK_TEXTURE_BASE_PATH}block${i + 1}.png`);
        this.BLOCK_SIDE = 50;


        this.app = new Application();

        this.init(htmlContainer);
    }

    async loadBlockTextures() {
        for (let i = 0; i < this.BLOCK_COLORS_NUMBER; i++) {
            Assets.add({ alias: 'block' + i, src: this.BLOCK_TEXTURE_PATHS[i] });
        }
        
        return await Assets.load(Array.from({ length: this.BLOCK_COLORS_NUMBER }, (_, i) => 'block' + i));
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
                if (this.gameStore.field[r][c] != 0) {
                    const texture = Assets.get('block' + (this.gameStore.field[r][c] - 1));
                    const block = Sprite.from(texture);
                    block.x = c * this.BLOCK_SIDE + this.FIELD_X + this.FIELD_BORDER_STROKE_WIDTH;
                    block.y = r * this.BLOCK_SIDE + this.FIELD_Y + this.FIELD_BORDER_STROKE_WIDTH;
                    block.width = block.height = this.BLOCK_SIDE;

                    //console.log(`Adding block at ${block.x}, ${block.y}`);

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
            width: 600,
            height: 800,
            antialias: true,
            autoDensity: true,
            resolution: 1
        });

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

        this.drawNextPieces();
    }

    destroy() {
        this.app.destroy(true, { children: true, texture: true });
    }

    drawNextPieces() {
        for (let p = 0; p < this.gameStore.nextPieces.length; p++) {
            const container = new Container();
            container.x = this.FIELD_X;
            container.y = this.NEXT_PIECES_Y;

            const piece = this.gameStore.nextPieces[p];
            const texture = Assets.get(Math.floor(Math.random() * this.BLOCK_COLORS_NUMBER));
            let currentWidth = 0;

            for (let r = 0; r < piece.length; r++) {
                for (let c = 0; c < piece[r].length; c++) {
                    if (piece[r][c] = 0) {
                        const block = Sprite.from(texture);
                        const pieceWidth = this.BLOCK_SIDE * piece[r].length;
                        block.x = currentWidth + this.NEXT_PIECES_DISTANCE;
                        block.y = 0;
                        currentWidth += pieceWidth + this.NEXT_PIECES_DISTANCE;

                        console.log(`Created next block piece`);

                        container.addChild(block);
                    }
                }
            }

            this.app.stage.addChild(container);
        }
    }
}