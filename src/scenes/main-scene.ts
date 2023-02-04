export class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
    }

    preload() {
        this.load.tilemapCSV('map', 'assets/levels/example.csv');
        this.load.image("tiles1", "assets/tilemaps/medievalTiles.png");
        this.load.image("tiles2", "assets/tilemaps/towerDefenseTiles.png");
    }

    create() {
        // To use a map with an array
        // const dataMap = [[0,1,2], [17,18,19]];
        // const assetMap = this.make.tilemap({ data: dataMap, tileWidth: 128, tileHeight: 128 });

        // To use a level map made in CSV, the "key" corresponds to the csv tilemap key
        const assetMap = this.make.tilemap({ key: "map", tileWidth: 128, tileHeight: 128 });
        assetMap.addTilesetImage("tiles1");
        const layer = assetMap.createLayer(0, "tiles1", 0, 0);
    }

    update() {

    }
}
