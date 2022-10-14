import {
  Actor,
  Animation,
  Color,
  Engine,
  Body,
  Circle,
  Collider,
  BodyComponent,
  CollisionType,
  Polygon,
  vec,
  RotationType,
  TileMap,
  Vector,
  SpriteSheet,
  DisplayMode,
  Sprite
} from 'excalibur'
import { useEffect, useState, useRef } from 'react'
import * as ROT from 'rot-js'
import { ImageSource } from 'excalibur'

import mapchip from './assets/colored_packed.png'
import spritemap from './assets/colored_transparent.png'
import * as LevelRoguelike from 'roguelike/level/roguelike'

export const Resources = {
  mapchip: new ImageSource(mapchip),
  spritemap: new ImageSource(spritemap)
}

const tileDef = {
  'VOID': 0,
  'FLOOR': 1,
  'WALL': 2,
  'DOOR': 3,
  'SPECIALDOOR': 4,
  'ENTER': 5,
  'EXIT': 6
}

Resources.mapchip.load()
Resources.spritemap.load()


const w = 64
const h = 48

function buildRoom () {
  return LevelRoguelike({
    width: w, // Max Width of the world
    height: h, // Max Height of the world
    retry: 100, // How many times should we try to add a room?
    //special: true, // Should we generate a "special" room?
    room: {
      ideal: 14, // Give up once we get this number of rooms
      min_width: 3,
      max_width: 17,
      min_height: 3,
      max_height: 17
    }
  })
}

function App () {
  const gameRef = useRef()
  useEffect(() => {
    if (gameRef.current) {
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
          spriteWidth: 16
        }
      })
      
      const spritesheet = SpriteSheet.fromImageSource({
        image: Resources.mapchip,
        grid: {
          rows: 22,
          columns: 49,
          spriteHeight: 16,
          spriteWidth: 16
        }
      })

      const roomSprite = spritesheet.getSprite(4, 0)

      const { world: map, enter, rooms } = buildRoom()

      const tileSize = 32

      const tilemap = new TileMap({
        rows: h,
        columns: w,
        tileWidth: tileSize,
        tileHeight: tileSize,
        pos: new Vector(0, 0)
      })

      //const tile = tilemap.getTile(2,4);
      //tile.data.set('foo', 'bar')
      //tile.solid = true
      //tile.addGraphic(roomSprite)
      /* cells with 1/2 probability */
      let spawnPos = new Vector(enter.x,  enter.y)

      const passable = [tileDef.DOOR, tileDef.ENTER, tileDef.EXIT, tileDef.FLOOR]

      map.forEach((cols, col) => {
        cols.forEach((cell, row) => {
          const grass = ROT.RNG.getItem([5, 6, 7])
          const trees = ROT.RNG.getItem([2, 3])
          const grassSprite = spritesheet.getSprite(grass, 0)
          const treesSprite = spritesheet.getSprite(trees, 1)
          const doorSprite = spritesheet.getSprite(1,9)
          const spriteScale = new Vector(2,2)
          grassSprite.scale = spriteScale
          treesSprite.scale = spriteScale
          doorSprite.scale = spriteScale
          const tile = tilemap.getTile(row, col)
          if (tile) {
            const solid = !passable.includes(cell)
            const door = cell === tileDef.ENTER
            tile.addGraphic(door ? doorSprite : solid ? treesSprite : grassSprite)
            tile.solid = solid
          }
        })
      })
      //    const display = new ROT.Display({width:w, height:h, fontSize:4});

      game.add(tilemap)

      const player = new Actor({
        x: spawnPos.x * tileSize + tileSize/2,
        y: spawnPos.y * tileSize + tileSize/2,
        width: 1,
        height: 1,
        color: Color.White,
        /*collisionType: CollisionType.Active,
        body: new BodyComponent({
          collider: new Collider({
            mass: 1000,
            friction: 0.9
          })
        })*/
      })
      const playerSprite = entitySpritesheet.getSprite(25, 0)
      playerSprite.scale = new Vector(2, 2)
      player.graphics.use(playerSprite)

      player.on('precollision', () => {
        player.actions.clearActions()
      })

      //game.currentScene.camera.strategy.lockToActor(player)
      game.input.pointers.primary.on('down', event => {
        player.actions.clearActions()

        const { worldPos } = event
        const cell = new Vector(Math.floor(worldPos.x / tileSize), Math.floor(worldPos.y / tileSize))
        const destination = new Vector(cell.x * tileSize + tileSize/2, cell.y * tileSize + tileSize/2 )
        /*
        const a = event.worldPos
        const b = player.pos
        const angle = Math.atan2(a.y - b.y, a.x - b.x)
        const passable = (x, y) => {
          return !map[y][x]
        }
        */

        /* prepare path to given coords */
        //const dijkstra = new ROT.Path.Dijkstra(98, 38, passable)

        //player.rotation = angle
        //player.actions.rotateBy(angle - player.rotation, Math.PI, RotationType.ShortestPath)
        player.actions.moveTo(destination, 100)
        // /player.vel.y = 0.1 * player.pos.y - event.worldPos.y
      })
      game.add(player)
      game.currentScene.camera.strategy.lockToActor(player)
      game.start()
    }
  }, [gameRef])

  return <canvas ref={gameRef}></canvas>
}

export default App
