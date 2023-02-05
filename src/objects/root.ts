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
    private nextTile: Tile;
    private nextDirection: Direction;

    constructor(
        public readonly id: number,
        private startingTile: Tile,
        private direction: Direction,
        private behavior: Map<TileTypeForBehavior, Behavior>
    ) {
        this.previousTile = startingTile;
        this.currentTile = startingTile;
    }

    public getPreviousTile(): Tile {
        return this.previousTile;
    }

    public getCurrentTile(): Tile {
        return this.currentTile;
    }

    public getNextTile(): Tile {
        return this.nextTile;
    }

    public getStartingTile(): Tile {
        return this.startingTile;
    }

    public getDirection(): Direction {
        return this.direction;
    }

    public getNextDirection(): Direction {
        return this.nextDirection;
    }

    public getBehaviorFor(tile: TileTypeForBehavior): Behavior {
        return this.behavior.get(tile);
    }

    public setPreviousTile(tile: Tile): void {
        this.previousTile = tile;
    }

    public setCurrentTile(tile: Tile): void {
        this.currentTile = tile;
    }

    public setNextTile(tile: Tile): void {
        this.nextTile = tile;
    }

    public setDirection(direction: Direction): void {
        this.direction = direction;
    }

    public setNextDirection(direction: Direction): void {
        this.nextDirection = direction;
    }
}
