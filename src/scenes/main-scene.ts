export const TILE_WIDTH = 128;
export const TILE_HEIGHT = 128;

export class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
    }

    preload() {
        this.load.tilemapCSV('background', 'assets/levels/example-l0.csv');
        this.load.tilemapCSV('foreground', 'assets/levels/example-l1.csv');
        this.load.image("tiles", "assets/tilemaps/medievalTiles.png");
    }

    create() {
        const tilesMultiplier: number = 1; // Génère une map plus ou moins grande
        const mapWidth = tilesMultiplier * 16; // 64
        const mapHeight = tilesMultiplier * 9; // 36

        // To use a level map made in CSV, the "key" corresponds to the csv tilemap key
        const background = this.make.tilemap({ key: "background", tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT });
        background.addTilesetImage("tiles");
        const layerZero = background.createLayer(0, "tiles", 0, 0);
        // const foreground = this.make.tilemap({ key: "foreground", tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT });
        // foreground.addTilesetImage("tiles");
        // const layerOne = foreground.createLayer(1, "tiles", 0, 0);

        this.cameras.main.setBounds(0, 0, TILE_WIDTH * mapWidth, TILE_HEIGHT * mapHeight);
        this.cameras.main.centerOn(TILE_WIDTH * mapWidth / 2, TILE_HEIGHT * mapHeight / 2);

        switch (tilesMultiplier) {
            case 1:
                this.cameras.main.setZoom(0.1042);
                break;
            case 2:
                this.cameras.main.setZoom(0.1042);
                break;
            case 3:
                this.cameras.main.setZoom(0.1042);
                break;
            case 5:
                this.cameras.main.setZoom(0.1042);
                break;
            default:
                this.cameras.main.setZoom(0.1042);
                break;
        }
    }

    update() {

    }
}
