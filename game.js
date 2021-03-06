const tileNames = {
    "EMPTY" : 0,
    "WATER" : 1,
    "GRASS" : 2,
    "STONEWALL" : 3,
    "ROCK" : 4,
    "DIRT" : 5,
    "STONEFLOOR" : 6,
    "TALLGRASS" : 7,
    "FLOOR" : 8,
    "SAND" : 9,
    "TINVIEN" : 10,
    "COPPERVIEN" : 11,
    "FISHING" : 12,
    "EMPTYVIEN": 13
}

const ORE_RESPAWN_RATE = 5000;
const MAX_INVENTORY_SIZE = 30;

let inventory = {}

class Hero {
    constructor(sprite) {
        this.sprite = sprite
        this.sprite.anchor.set(0.5);
        this.isMoving = false
        this.mx = this.sprite.x
        this.my = this.sprite.y

        this.inventory = {}
        inventory = this.inventory
    }

    add_item_to_inventory(item, count) {
        if(this.inventory[item] !== undefined) {
            this.inventory[item] += count
            return
        }

        if(Object.keys(this.inventory).length >= MAX_INVENTORY_SIZE) {
            //No more room in inventory
            return
        }

        this.inventory[item] = count
    }

    update(game) {
        this.sprite.body.velocity.x = 0;
        this.sprite.body.velocity.y = 0;

        if(game.input.activePointer.leftButton.isDown) {
            this.mx = game.input.worldX;
            this.my = game.input.worldY;
            this.isMoving = true;
        }

        if( (this.sprite.x <= this.mx + 50)  && (this.sprite.x >= this.mx - 50) && (this.sprite.y >= this.my - 50) && (this.sprite.y <= this.my + 50) ) {
            this.isMoving = false;
        }

        if(this.sprite.x > this.mx + 50) {
            this.sprite.body.velocity.x = -100;
        } else if(this.sprite.x < this.mx - 50) {
            this.sprite.body.velocity.x = 200;
        }

        if(this.sprite.y > this.my +50) {
            this.sprite.body.velocity.y = -100;
        } else if(this.sprite.y < this.my -50){
            this.sprite.body.velocity.y = 200;
        }
    }
}

class Map {
    constructor(map) {
        this.map = map;
        this.map.addTilesetImage('maptiles', 'tiles');
        this.map.setCollision([1,3]);
        this.map.activeTile = undefined;
    
        //map.setTileIndexCallback(4, hitCoin, this);

        this.ground = this.map.createLayer('Tile Layer 1');
        //this.ground.debug = true;
        this.ground.resizeWorld();

        this.resources = this.map.createLayer('resources');
        this.map.putTile(11, 1, 1, this.resources);
    }

    replaceResource(tile, x, y) {
        this.map.putTile(tile, (x === undefined) ? this.activeTile.x : x, (y === undefined) ? this.activeTile.y : y, this.resources)
    }
}

class Main extends Phaser.State {
    preload()  {
        this.load.tilemap('desert', 'map.json', null, Phaser.Tilemap.TILED_JSON)
        this.load.image('tiles', 'maptiles.png')
        this.load.image('hero', 'Hero.png')

        this.gameObjects = {}
    }

    create() {
        //Start physics engine
        this.physics.startSystem(Phaser.Physics.ARCADE);

        //Create the map
        this.gameObjects.map = new Map(this.add.tilemap('desert'));

        //Create hero
        this.gameObjects.hero = new Hero(this.add.sprite(60,60, 'hero'));
        //Enable physics for hero
        this.physics.enable(this.gameObjects.hero.sprite);
        this.gameObjects.hero.sprite.body.collideWorldBounds = true;
        //Camera now follows hero
        this.camera.follow(this.gameObjects.hero.sprite);

        this.input.mouse.capture = true;
        this.gameObjects.map.map.replace(4,5);

        this.gameObjects.map.activeTile
    }

    update() {
        this.physics.arcade.collide(this.gameObjects.hero.sprite, this.gameObjects.map.ground);
        this.gameObjects.hero.update(this)

        if(this.input.activePointer.leftButton.isDown) {
            let mx = this.input.worldX
            let my = this.input.worldY
            this.gameObjects.map.activeTile = this.gameObjects.map.map.getTileWorldXY(mx, my, 64, 64, this.gameObjects.map.resources)
        }

        if(!this.gameObjects.hero.isMoving && this.gameObjects.map.activeTile) {
            let that = this;
            const at = Object.assign({}, this.gameObjects.map.activeTile);

            switch(this.gameObjects.map.activeTile.index) {
                case tileNames["COPPERVIEN"]:
                case tileNames["TINVIEN"]:
                    //mining
                    this.gameObjects.map.replaceResource(tileNames["EMPTYVIEN"])

                    setTimeout(function() {
                        that.gameObjects.map.replaceResource(at.index, at.x, at.y)
                    }, ORE_RESPAWN_RATE)

                    this.gameObjects.hero.add_item_to_inventory(at.index, 1)
                    break;
            }

            this.gameObjects.map.activeTile = undefined;
        }
    }
}

class Game extends Phaser.Game {
    constructor() {
        super(1280, 1024, Phaser.AUTO, '');
        this.state.add('Main', Main)
        this.state.start('Main')
    }
}

new Game()
