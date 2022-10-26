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
  SpriteFont,
  DisplayMode,
  Sprite,
  ScreenElement,
  Text,
  Loader
} from 'excalibur'
import { useEffect, useState, useRef } from 'react'
import * as ROT from 'rot-js'
import { ImageSource } from 'excalibur'
import {
  AsepriteResource,
  AsepriteSpriteSheet
} from '@excaliburjs/plugin-aseprite'

import mapchip from './assets/colored_packed.png'
import spritemap from './assets/colored_transparent.png'
import * as LevelRoguelike from 'roguelike/level/roguelike'

export const Resources = {
  mapchip: new ImageSource(mapchip),
  spritemap: new ImageSource(spritemap),
  dude: new AsepriteResource('/seekers-of-byergur/beard dude 2.json')
}

const tileDef = {
  VOID: 0,
  FLOOR: 1,
  WALL: 2,
  DOOR: 3,
  SPECIALDOOR: 4,
  ENTER: 5,
  EXIT: 6
}

const w = 64
const h = 48

class Dialogue extends ScreenElement {
  constructor () {
    super({
      width: 600,
      height: 100,
      x: 0,
      y: 600 - 100,
      color: Color.Yellow
    })
  }

  onInitialize () {
    this.graphics.add('idle', Resources.StartButtonBackground)
    this.graphics.add('hover', Resources.StartButtonHovered)

    this.on('pointerup', () => {
      alert("I've been clicked")
    })

    this.on('pointerenter', () => {
      this.graphics.show('hover')
    })

    this.on('pointerleave', () => {
      this.graphics.show('idle')
    })
  }
}

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

const tileSize = 32

const loader = new Loader([...Object.values(Resources)])

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
      game.start(loader).then(() => {
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

        const spriteFontSheet = SpriteSheet.fromImageSource({
          image: Resources.spritemap,
          grid: {
            rows: 4,
            columns: 13,
            spriteWidth: 13,
            spriteHeight: 16
          },
          spacing: {
            originOffset: {
              x: 35 * 16,
              y: 17 * 16
            },
            margin: {
              x: 3,
              y: 0
            }
          }
        })

        const spriteFont = new SpriteFont({
          alphabet: '0123456789:.%abcdefghijklmnopqrstuvwxyz#+-*/=@ ',
          caseInsensitive: true,
          spriteSheet: spriteFontSheet
        })

        const text = new Text({
          text:
            'ahh.. you seek the fabled land of byergur.\n well.. you will have to find it yourself...',
          font: spriteFont,
          scale: new Vector(2, 2)
        })

        const roomSprite = spritesheet.getSprite(4, 0)

        const { world: map, enter, rooms } = buildRoom()

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
        let spawnPos = new Vector(enter.x, enter.y)

        const passable = [
          tileDef.DOOR,
          tileDef.ENTER,
          tileDef.EXIT,
          tileDef.FLOOR
        ]

        map.forEach((cols, col) => {
          cols.forEach((cell, row) => {
            const grass = ROT.RNG.getItem([28])
            const trees = ROT.RNG.getItem([2, 2, 2, 2, 3])
            const grassSprite = spritesheet.getSprite(grass, 0)
            const treesSprite = spritesheet.getSprite(trees, 1)
            const doorSprite = spritesheet.getSprite(1, 9)
            const spriteScale = new Vector(2, 2)
            grassSprite.scale = spriteScale
            treesSprite.scale = spriteScale
            doorSprite.scale = spriteScale
            const tile = tilemap.getTile(row, col)
            if (tile) {
              const solid = !passable.includes(cell)
              const door = cell === tileDef.ENTER
              if (solid)
                tile.addGraphic(
                  door ? doorSprite : solid ? treesSprite : grassSprite
                )
              tile.solid = solid
            }
          })
        })
        //    const display = new ROT.Display({width:w, height:h, fontSize:4});

        const player = new Dude(spawnPos)
        game.add(tilemap)

        player.on('precollision', () => {
          player.actions.clearActions()
        })

        // control player with wasd keys
        game.input.keyboard.on('hold', evt => {
          const speed = 10
          const dir = new Vector(0, 0)
          switch (evt.key) {
            case 'KeyW':
              dir.y = -1
              break
            case 'KeyS':
              dir.y = 1
              break
            case 'KeyA':
              dir.x = -1
              break
            case 'KeyD':
              dir.x = 1
              break
          }
          if (dir.x !== 0 || dir.y !== 0) {
            player.actions.clearActions()
            player.vel.x += dir.x * speed
            player.vel.y += dir.y * speed
            //player.actions.moveBy(dir.x * tileSize, dir.y * tileSize, speed)
          }
        })

        // control player with pointer
        game.input.pointers.primary.on('down', event => {
          player.actions.clearActions()

          const { worldPos } = event
          const cell = new Vector(
            Math.floor(worldPos.x / tileSize),
            Math.floor(worldPos.y / tileSize)
          )
          const destination = new Vector(
            cell.x * tileSize + tileSize / 2,
            cell.y * tileSize + tileSize / 2
          )
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

        //player.graphics.use(text)

        game.add(player)
        game.currentScene.camera.strategy.lockToActor(player)

        const dialogue = new Dialogue()
        //game.add(dialogue)
      })
    }
  }, [gameRef])

  return <canvas ref={gameRef}></canvas>
}

class Dude extends Actor {
  constructor (spawnPos) {
    super({
      x: spawnPos.x * tileSize + tileSize / 2,
      y: spawnPos.y * tileSize + tileSize / 2,
      width: 1,
      height: 1,
      color: Color.White
    })
    this.idleAnim = Resources.dude.getAnimation('idle')
    this.frontAnim = Resources.dude.getAnimation('front walk')
    this.sideAnim = Resources.dude.getAnimation('side walk')
    this.backAnim = Resources.dude.getAnimation('back run')
    
    this.graphics.use(this.idleAnim)
  }
  onPreUpdate () {
    const { vel } = this


    if (vel.y !== 0)
      this.graphics.use(vel.y < 0 ? this.backAnim : this.frontAnim)
    if (vel.x === 0 && vel.y === 0) this.graphics.use(this.idleAnim)
    
    if (vel.x !== 0) {
      this.graphics.use(this.sideAnim)
      if (vel.x > 0) {
        this.sideAnim.flipHorizontal = true
      } else {
        this.sideAnim.flipHorizontal = false
      }
    }

    if ( this.vel.x < 5 && this.vel.x > -5) this.vel.x = 0
    if ( this.vel.y < 5 && this.vel.y > -5) this.vel.y = 0
    
    this.vel.x = this.vel.x * 0.9
    this.vel.y = this.vel.y * 0.9
    
  }
}

// enemy class
class Enemy extends Actor {
  constructor () {
    this.hp = 100
    this.maxHp = 100
    this.attack = 10
    this.defense = 10
    this.speed = 10
    this.exp = 10
    this.gold = 10
    this.name = 'Enemy'
    this.sprite = null
    this.spriteScale = new Vector(2, 2)
    this.spriteOffset = new Vector(0, 0)
    this.pos = new Vector(0, 0)
    this.width = 1
    this.height = 1
    this.color = Color.Red
    this.collisionType = CollisionType.Active
    this.body = new BodyComponent({
      collider: new Collider({
        mass: 1000,
        friction: 0.9
      })
    })
  }

  onPreUpdate (engine, delta) {
    super.onPreUpdate(engine, delta)
  }
}

export default App
