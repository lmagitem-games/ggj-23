import { CONST } from '../const/const';

export class MainMenuScene extends Phaser.Scene {
  private keyA?: Phaser.Input.Keyboard.Key | any;
  private keyZ?: Phaser.Input.Keyboard.Key | any;
  private keyE?: Phaser.Input.Keyboard.Key | any;
  private keyR?: Phaser.Input.Keyboard.Key | any;
  private keyT?: Phaser.Input.Keyboard.Key | any;
  private keyY?: Phaser.Input.Keyboard.Key | any;
  private keyU?: Phaser.Input.Keyboard.Key | any;
  private bitmapTexts: Phaser.GameObjects.BitmapText[] = [];

  constructor() {
    super({
      key: 'MainMenuScene'
    });
  }

  init(): void {
    this.keyA = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.A
    );
    this.keyZ = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.Z
    );
    this.keyE = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );
    this.keyR = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.R
    );
    this.keyT = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.T
    );
    this.keyY = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.Y
    );
    this.keyU = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.U
    );

    if (CONST.SCORE > CONST.HIGHSCORE) {
      CONST.HIGHSCORE = CONST.SCORE;
    }
    CONST.SCORE = 0;

    this.cameras.main.setZoom(2);
  }

  preload(): void {
    this.load.bitmapFont(
      'snakeFont',
      './assets/font/snakeFont.png',
      './assets/font/snakeFont.fnt'
    );
  }

  create(): void {
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 - 22,
        'snakeFont',
        'A : PLAY MAP 1',
        8
      )
      .setInteractive()
      .on('pointerdown', () => this.keyA = { isDown: true })
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 - 10,
        'snakeFont',
        'Z : PLAY MAP 2',
        8
      )
      .setInteractive()
      .on('pointerdown', () => this.keyZ = { isDown: true })
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 + 2,
        'snakeFont',
        'E : PLAY MAP 3',
        8
      )
      .setInteractive()
      .on('pointerdown', () => this.keyE = { isDown: true })
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 + 14,
        'snakeFont',
        'R : PLAY MAP 4',
        8
      )
      .setInteractive()
      .on('pointerdown', () => this.keyR = { isDown: true })
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 + 26,
        'snakeFont',
        'T : PLAY MAP 5',
        8
      )
      .setInteractive()
      .on('pointerdown', () => this.keyT = { isDown: true })
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 + 38,
        'snakeFont',
        'Y : PLAY MAP 6',
        8
      )
      .setInteractive()
      .on('pointerdown', () => this.keyY = { isDown: true })
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 + 50,
        'snakeFont',
        'U : PLAY MAP 7',
        8
      )
      .setInteractive()
      .on('pointerdown', () => this.keyU = { isDown: true })
    );

    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 100,
        this.sys.canvas.height / 2 - 70,
        'snakeFont',
        'Thirsty Roots',
        16
      )
    );

    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 45,
        this.sys.canvas.height / 2 + 80,
        'snakeFont',
        'HIGHSCORE: ' + CONST.HIGHSCORE,
        8
      )
    );
  }

  update(): void {
    if (!!this.keyA && this.keyA.isDown) {
      this.startMainScene({ tileMultiplier: 1, map: 1 });
    }
    if (!!this.keyZ && this.keyZ.isDown) {
      this.startMainScene({ tileMultiplier: 1, map: 2 });
    }
    if (!!this.keyE && this.keyE.isDown) {
      this.startMainScene({ tileMultiplier: 2, map: 3, soundParam: 1 });
    }
    if (!!this.keyR && this.keyR.isDown) {
      this.startMainScene({ tileMultiplier: 2, map: 4, soundParam: 2 });
    }
    if (!!this.keyT && this.keyT.isDown) {
      this.startMainScene({ tileMultiplier: 3, map: 5 });
    }
    if (!!this.keyY && this.keyY.isDown) {
      this.startMainScene({ tileMultiplier: 4, map: 6 });
    }
    if (!!this.keyU && this.keyU.isDown) {
      this.startMainScene({ tileMultiplier: 5, map: 7 });
    }
  }

  private startMainScene(data: any = {}) {
    setTimeout(() => this.scene.start('MainScene', data));
  }
}
