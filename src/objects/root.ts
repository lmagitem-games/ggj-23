import { Tile, TileTypeForBehavior } from "./tile";

export enum Behavior {
    LEFT = -1,
    AHEAD = 0,
    RIGHT = 1
}

export enum Direction {
    NORTH = 0,
    EAST = 1,
    SOUTH = 2,
    WEST = 3
}

export class Root {
    private previousTile: Tile;
    private currentTile: Tile;

    constructor(private startingTile: Tile, private direction: Direction, private behavior: Map<TileTypeForBehavior, Behavior>) {
        this.previousTile = startingTile;
        this.currentTile = startingTile;
    }

    public setCurrentTile(tile: Tile): void {
        console.log(`Setting ${this.currentTile.getCoord().x}:${this.currentTile.getCoord().y} as old tile and ${tile.getCoord().x}:${tile.getCoord().y} as new`)
        this.previousTile = this.currentTile;
        this.currentTile = tile;
    }

    public setDirection(direction: Direction): void {
        this.direction = direction;
    }

    public getCurrentTile(): Tile {
        return this.currentTile;
    }

    public getPreviousTile(): Tile {
        return this.previousTile;
    }

    public getStartingTile(): Tile {
        return this.startingTile;
    }

    public getDirection(): Direction {
        return this.direction;
    }

    public getBehaviorFor(tile: TileTypeForBehavior): Behavior {
        return this.behavior.get(tile);
    }
}
