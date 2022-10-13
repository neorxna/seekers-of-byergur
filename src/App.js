import { Actor, Animation, Color, Engine, Body, Circle, Collider, BodyComponent, CollisionType, Polygon, vec, RotationType, TileMap, Vector, SpriteSheet, DisplayMode, Sprite } from 'excalibur'
import { useEffect, useState, useRef } from 'react';
import * as ROT from 'rot-js'
import { ImageSource } from "excalibur";

import mapchip from "./assets/colored_packed.png";
import spritemap from './assets/colored_transparent.png';

export const Resources = {
  mapchip: new ImageSource(mapchip),
  spritemap: new ImageSource(spritemap)
};

Resources.mapchip.load()
Resources.spritemap.load()


function App() {
  const gameRef = useRef()
  useEffect(() => {
    if(gameRef.current) {
      const game = new Engine({
      width: 800,
      height: 600,
      canvasElement: gameRef.current,
      displayMode: DisplayMode.FillScreen,
      backgroundColor: Color.Black
    })

    const entitySpritesheet = SpriteSheet.fromImageSource({
      image: Resources.spritemap,
      grid: {
        rows: 22,
        columns: 49,
        spriteHeight: 16,
        spriteWidth: 16,
      },
    });

    const spritesheet = SpriteSheet.fromImageSource({
      image: Resources.mapchip,
      grid: {
        rows: 22,
        columns: 49,
        spriteHeight: 16,
        spriteWidth: 16,
      },
    });
    const roomSprite = spritesheet.getSprite(4,0)


    const w = 64; const h = 64;
    const map = new ROT.Map.Cellular(w, h);

    const tilemap = new TileMap({
      rows: 64,
      columns: 64,
      tileWidth: 64,
      tileHeight: 64,
      pos: new Vector(0,0)
      })


  //const tile = tilemap.getTile(2,4);
  //tile.data.set('foo', 'bar')
  //tile.solid = true
  //tile.addGraphic(roomSprite)
  /* cells with 1/2 probability */
    map.randomize(0.5);
    map._map.forEach((rows, row) => {
      rows.forEach((cell, col) => {
        const grass = ROT.RNG.getItem([5,6,7])
        const trees = ROT.RNG.getItem([0,1,2,3,4,5])
        console.log(grass)
        const foo = spritesheet.getSprite(grass, 0)
        const bar = spritesheet.getSprite(trees,1)
        foo.scale = new Vector(4,4)
        bar.scale = new Vector(4,4)

        const tile = tilemap.getTile(row, col)
        if(tile) {
          tile.addGraphic(cell ? foo : bar)
          tile.solid = !cell
        }
        
      })
    })
//    const display = new ROT.Display({width:w, height:h, fontSize:4});

game.add(tilemap)


    const player = new Actor({
      x: game.drawWidth / 2,
      y: game.drawHeight / 2,
      width: 32,
      height: 32,
      color: Color.White,
      collisionType: CollisionType.Active,
      body: new BodyComponent({
        collider: new Collider({
          mass: 1000,
          friction: 0.9,
        })
      }),
    })
    const playerSprite = entitySpritesheet.getSprite(25, 0)
    playerSprite.scale = new Vector(4,4)
    player.graphics.use(playerSprite)

    player.on('precollision', () => {player.actions.clearActions()});

    //game.currentScene.camera.strategy.lockToActor(player)
    game.input.pointers.primary.on('down', event => {
      player.actions.clearActions()
      const a = event.worldPos
      const b = player.pos
      const angle = Math.atan2(a.y - b.y, a.x - b.x)
      //player.rotation = angle
      //player.actions.rotateBy(angle - player.rotation, Math.PI, RotationType.ShortestPath)
      player.actions.moveTo(a, 100)
      // /player.vel.y = 0.1 * player.pos.y - event.worldPos.y
      
    })
    game.add(player)
    game.currentScene.camera.strategy.lockToActor(player)
    game.start()
    }
  
  }, [gameRef])
  
  return (
    <canvas ref={gameRef}>
    </canvas>
  );
}

export default App;
