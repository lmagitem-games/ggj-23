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
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE
    );
    this.key2 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO
    );
    this.key3 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE
    );
    this.key4 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR
    );
    this.key5 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_FIVE
    );
    this.key6 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_SIX
    );
    this.key7 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_SEVEN
    );

    if (CONST.SCORE > CONST.HIGHSCORE) {
      CONST.HIGHSCORE = CONST.SCORE;
    }
    CONST.SCORE = 0;
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
        this.sys.canvas.height / 2 - 10,
        'snakeFont',
        '1 : PLAY MAP 1',
        8
      )
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 + 2,
        'snakeFont',
        '2 : PLAY MAP 2 - normal dirt v2',
        8
      )
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 + 14,
        'snakeFont',
        '3 : PLAY MAP 2 - dirt v2 + modulation aleatoire',
        8
      )
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 + 26,
        'snakeFont',
        '4 : PLAY MAP 2 - normal dirt v2 bis',
        8
      )
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 + 38,
        'snakeFont',
        '5 : PLAY MAP 3',
        8
      )
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 + 50,
        'snakeFont',
        '6 : PLAY MAP 4',
        8
      )
    );
    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 52,
        this.sys.canvas.height / 2 + 62,
        'snakeFont',
        '7 : PLAY MAP 5',
        8
      )
    );

    this.bitmapTexts.push(
      this.add.bitmapText(
        this.sys.canvas.width / 2 - 100,
        this.sys.canvas.height / 2 - 60,
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
      this.scene.start('MainScene', { tileMultiplier: 1 });
    }
    if (!!this.key2 && this.key2.isDown) {
      this.scene.start('MainScene', { tileMultiplier: 2 });
    }
    if (!!this.key3 && this.key3.isDown) {
      this.scene.start('MainScene', { tileMultiplier: 2, soundParam: 1 });
    }
    if (!!this.key4 && this.key4.isDown) {
      this.scene.start('MainScene', { tileMultiplier: 2, soundParam: 2 });
    }
    if (!!this.key5 && this.key5.isDown) {
      this.scene.start('MainScene', { tileMultiplier: 3 });
    }
    if (!!this.key6 && this.key6.isDown) {
      this.scene.start('MainScene', { tileMultiplier: 4 });
    }
    if (!!this.key7 && this.key7.isDown) {
      this.scene.start('MainScene', { tileMultiplier: 5 });
    }
  }
}
