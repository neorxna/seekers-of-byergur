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
  Loader,
  GraphicsGroup,
  AnimationStrategy
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
import fontTest from './assets/fonttest.png'
import dialogueBackground from './assets/dialogue_background.png'

import * as LevelRoguelike from 'roguelike/level/roguelike'

export const Resources = {
  mapchip: new ImageSource(mapchip),
  spritemap: new ImageSource(spritemap),
  dude: new AsepriteResource('/seekers-of-byergur/beard dude 5.json'),
  font: new ImageSource(fontTest),
  dialogueBackground: new ImageSource(dialogueBackground)
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

const SCALE_FACTOR = 2
const tileSize = 16 * SCALE_FACTOR

class Dialogue extends ScreenElement {
  constructor () {
    const width = 20 * 20 * 2 - 16
    const height = 8 * 3 * 2 * 2 * 2 + 32
    super({
      width,
      height,
      x: 8,
      y: 600 - height - 32
    })

    const textStr = 'sphinx of black quartz! judge\nmy vowE! hello world? H'
    //'soEyou seek the fabled land of byergur?\nwell!~\nyou will have to find it yourselfEH'

    const spriteFontSheet = SpriteSheet.fromImageSource({
      image: Resources.font,
      grid: {
        rows: 3,
        columns: 26,
        spriteWidth: 10,
        spriteHeight: 8 * 3
      },
      spacing: {
        originOffset: {
          x: 0,
          y: 0
        },
        margin: {
          x: 0,
          y: 0
        }
      }
    })

    const spriteFontSheetWide = SpriteSheet.fromImageSource({
      image: Resources.font,
      grid: {
        rows: 3,
        columns: 13,
        spriteWidth: 20,
        spriteHeight: 8 * 3
      },
      spacing: {
        originOffset: {
          x: 0,
          y: 8 * 6
        },
        margin: {
          x: 0,
          y: 0
        }
      }
    })

    const scriptFont = new SpriteFont({
      alphabet: 'ABDEGHIKLMNOPRSTU ',
      caseInsensitive: false,
      spriteSheet: spriteFontSheetWide
    })

    const spriteFont = new SpriteFont({
      alphabet: 'abcdefghijklmnopqrstuvwxyz .?!H~SE',
      caseInsensitive: false,
      spriteSheet: spriteFontSheet
    })

    const text = new Text({
      text: textStr,
      font: spriteFont,
      scale: new Vector(2, 2)
    })

    const script = new Text({
      text: 'HELLO SERGIO\nTHIS IS A TEST',
      font: scriptFont,
      scale: new Vector(2, 2)
    })

    const dialogueBackgroundSprite = new Sprite({
      image: Resources.dialogueBackground,
      scale: new Vector(2, 2)
    })

    const group = new GraphicsGroup({
      members: [
        { graphic: dialogueBackgroundSprite, pos: new Vector(0, 16) },
        { graphic: text, pos: new Vector(68, 32 + 8 * 3 * 2 * 2) }
        //{ graphic: script, pos: new Vector(56, 32 + 8 * 3 * 2 * 2) }
      ]
    })
    //this.graphics.add(text)
    this.graphics.add(group)
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

const loader = new Loader([...Object.values(Resources)])

function App () {
  const gameRef = useRef()
  useEffect(() => {
    if (gameRef.current) {
      const game = new Engine({
        width: 800,
        height: 600,
        canvasElement: gameRef.current,
        displayMode: DisplayMode.FitScreen,
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

        const roomSprite = spritesheet.getSprite(4, 0)

        const { world: map, enter, rooms } = buildRoom()

        const tilemap = new TileMap({
          rows: h,
          columns: w,
          tileWidth: tileSize,
          tileHeight: tileSize,
          pos: new Vector(0, 0)
        })

        let spawnPos = new Vector(enter.x, enter.y)

        const passable = [
          tileDef.DOOR,
          tileDef.ENTER,
          tileDef.EXIT,
          tileDef.FLOOR
        ]

        const doorSprite = spritesheet.getSprite(1, 9)

        const wallSprites = {
          topLeft: spritesheet.getSprite(18, 0),
          top: spritesheet.getSprite(19, 0),
          topRight: spritesheet.getSprite(20, 0),

          left: spritesheet.getSprite(18, 1),
          right: spritesheet.getSprite(20, 1),

          middle: spritesheet.getSprite(10, 17),

          bottomLeft: spritesheet.getSprite(18, 2),
          bottom: spritesheet.getSprite(19, 2),
          bottomRight: spritesheet.getSprite(20, 2)
        }
        Object.keys(wallSprites).forEach(wall => {
          wallSprites[wall].scale = new Vector(SCALE_FACTOR, SCALE_FACTOR)
        })

        map.forEach((cols, col) => {
          cols.forEach((cell, row) => {
            const grass = ROT.RNG.getItem([0, 0, 0, 0, 0, 0, 1, 1, 1, 6, 7])
            const trees = ROT.RNG.getItem([2, 2, 2, 2, 3])
            const grassSprite = spritesheet.getSprite(grass, 0)
            const treesSprite = spritesheet.getSprite(trees, 1)

            const spriteScale = new Vector(SCALE_FACTOR, SCALE_FACTOR)
            grassSprite.scale = spriteScale
            treesSprite.scale = spriteScale
            doorSprite.scale = spriteScale
            const tile = tilemap.getTile(row, col)
            if (tile) {
              const solid = !passable.includes(cell)
              const door = cell === tileDef.ENTER

              if (cell === tileDef.WALL) {
                tile.addGraphic(wallSprites.middle)
              } else {
                tile.addGraphic(door ? doorSprite : grassSprite)
              }
              tile.solid = solid
            }
          })
        })
        //    const display = new ROT.Display({width:w, height:h, fontSize:4});

        const player = new Dude(spawnPos)
        game.add(tilemap)

        /*player.on('precollision', () => {
          player.actions.clearActions()
        })*/

        game.input.keyboard.on('press', evt => {
          if (evt.key === 'KeyE') {
            player.wave()
            return
          }
        })

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
            // normalise so we don't move faster diagonally
            dir.normalize()

            //player.actions.moveBy(dir.x * tileSize, dir.y * tileSize, 100)

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
          //player.actions.moveTo(destination, 100)
          // /player.vel.y = 0.1 * player.pos.y - event.worldPos.y
        })

        //player.graphics.use(text)

        /*game.add(new Dude(spawnPos.add(new Vector(-1, 0))))
        game.add(new Dude(spawnPos.add(new Vector(1, 0))))
        game.add(new Dude(spawnPos.add(new Vector(0, 1))))
        game.add(new Dude(spawnPos.add(new Vector(1, 1))))
        */
        game.add(player)
        game.add(new Snek(spawnPos.add(new Vector(-2, 2))))
        game.currentScene.camera.strategy.lockToActor(player)

        //const dialogue = new Dialogue()
        //game.add(dialogue)
      })
    }
  }, [gameRef])

  return <canvas ref={gameRef}></canvas>
}

class Snek extends Actor {
  constructor (spawnPos) {
    super({
      x: spawnPos.x * tileSize + tileSize / 2,
      y: spawnPos.y * tileSize + tileSize / 2,
      width: 8,
      height: 8,
      color: Color.White,
      scale: new Vector(SCALE_FACTOR, SCALE_FACTOR),
      collisionType: CollisionType.Fixed
    })

    this.idleAnim = Resources.dude.getAnimation('snek')
    this.graphics.use(this.idleAnim)
  }
}

class Dude extends Actor {
  constructor (spawnPos) {
    super({
      x: spawnPos.x * tileSize + tileSize / 2,
      y: spawnPos.y * tileSize + tileSize / 2,
      width: 8,
      height: 8,
      color: Color.White,
      scale: new Vector(SCALE_FACTOR, SCALE_FACTOR),
      collisionType: CollisionType.Active
    })

    this.idleAnim = Resources.dude.getAnimation('idle')
    this.frontAnim = Resources.dude.getAnimation('front walk')
    this.sideAnim = Resources.dude.getAnimation('side walk')
    this.backAnim = Resources.dude.getAnimation('back run')
    this.waveAnim = Resources.dude.getAnimation('wave')

    this.waveAnim.strategy = AnimationStrategy.End
    this.graphics.use(this.idleAnim)
    this.graphics.offset = new Vector(0, -8)
    this.waving = false

    this.vel = new Vector(0, 0)
  }

  wave () {
    this.waving = true
    this.waveAnim.reset()
  }

  onPreUpdate () {
    const { vel, waving } = this

    if (waving && vel.x === 0 && vel.y === 0) {
      this.graphics.use(this.waveAnim)
      this.waveAnim.events.on('end', () => {
        this.waving = false
        this.graphics.use(this.idleAnim)
      })
      return
    } else if (waving) {
      // cancel animation if we moved while waving
      this.waving = false
    }

    if (vel.x !== 0) {
      this.graphics.use(this.sideAnim)
      if (vel.x > 0) {
        this.sideAnim.flipHorizontal = true
      } else {
        this.sideAnim.flipHorizontal = false
      }
    }
    if (vel.y !== 0 && Math.abs(vel.y) > Math.abs(vel.x)) {
      this.graphics.use(vel.y < 0 ? this.backAnim : this.frontAnim)
    }
    if (vel.x === 0 && vel.y === 0) this.graphics.use(this.idleAnim)

    const th = 10
    if (this.vel.x < th && this.vel.x > -1 * th) this.vel.x = 0
    if (this.vel.y < th && this.vel.y > -1 * th) this.vel.y = 0

    this.vel.x = this.vel.x * 0.9
    this.vel.y = this.vel.y * 0.9

    this.pos.x = Math.round(this.pos.x)
    this.pos.y = Math.round(this.pos.y)

    //center the player on the tile
    /*if (vel.x === 0 && vel.y === 0) {
      this.pos.x = Math.round(this.pos.x / tileSize) * tileSize
      this.pos.y = Math.round(this.pos.y / tileSize) * tileSize
    }*/
  }
}

export default App
