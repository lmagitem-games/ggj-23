import { CONST } from '../const/const';

export class MainMenuScene extends Phaser.Scene {
  private key1?: Phaser.Input.Keyboard.Key;
  private key2?: Phaser.Input.Keyboard.Key;
  private key3?: Phaser.Input.Keyboard.Key;
  private key4?: Phaser.Input.Keyboard.Key;
  private key5?: Phaser.Input.Keyboard.Key;
  private key6?: Phaser.Input.Keyboard.Key;
  private key7?: Phaser.Input.Keyboard.Key;
  private bitmapTexts: Phaser.GameObjects.BitmapText[] = [];

  constructor() {
    super({
      key: 'MainMenuScene'
    });
  }

  init(): void {
    this.key1 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.A
    );
    this.key2 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.Z
    );
    this.key3 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );
    this.key4 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.R
    );
    this.key5 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.T
    );
    this.key6 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.Y
    );
    this.key7 = this.input.keyboard.addKey(
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
        this.sys.canvas.width / 2 - 112,
        this.sys.canvas.height / 2 - 22,
        'snakeFont',
        'A : PLAY MAP 1',
        8
      )
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 112,
        this.sys.canvas.height / 2 - 10,
        'snakeFont',
        'Z : PLAY MAP 2 (normal sound)',
        8
      )
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 112,
        this.sys.canvas.height / 2 + 2,
        'snakeFont',
        'E : PLAY MAP 2 (sound variant 1)',
        8
      )
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 112,
        this.sys.canvas.height / 2 + 14,
        'snakeFont',
        'R : PLAY MAP 2 (sound variant 2',
        8
      )
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 112,
        this.sys.canvas.height / 2 + 26,
        'snakeFont',
        'T : PLAY MAP 3',
        8
      )
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 112,
        this.sys.canvas.height / 2 + 38,
        'snakeFont',
        'Y : PLAY MAP 4',
        8
      )
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 112,
        this.sys.canvas.height / 2 + 50,
        'snakeFont',
        'U : PLAY MAP 5',
        8
      )
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
    if (!!this.key1 && this.key1.isDown) {
      this.startMainScene({ tileMultiplier: 1 });
    }
    if (!!this.key2 && this.key2.isDown) {
      this.startMainScene({ tileMultiplier: 2 });
    }
    if (!!this.key3 && this.key3.isDown) {
      this.startMainScene({ tileMultiplier: 2, soundParam: 1 });
    }
    if (!!this.key4 && this.key4.isDown) {
      this.startMainScene({ tileMultiplier: 2, soundParam: 2 });
    }
    if (!!this.key5 && this.key5.isDown) {
      this.startMainScene({ tileMultiplier: 3 });
    }
    if (!!this.key6 && this.key6.isDown) {
      this.startMainScene({ tileMultiplier: 4 });
    }
    if (!!this.key7 && this.key7.isDown) {
      this.startMainScene({ tileMultiplier: 5 });
    }
  }

  private startMainScene(data: any = {}) {
    setTimeout(() => this.scene.start('MainScene', data));
  }
}
