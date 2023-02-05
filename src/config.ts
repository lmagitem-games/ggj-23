import { BootScene } from './scenes/boot-scene';
import { MainMenuScene } from './scenes/main-menu-scene';
import { MainScene } from './scenes/main-scene';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Root',
  url: 'https://github.com/digitsensitive/phaser3-typescript',
  version: '2.0',
  width: 854,
  height: 480,
  zoom: 1,
  parent: 'game',
  type: Phaser.AUTO,
  scene: [BootScene, MainMenuScene, MainScene],
  backgroundColor: '#000000',
  render: { pixelArt: true, antialias: true }
};
