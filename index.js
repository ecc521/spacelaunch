//A few notes for what we will be doing here:

//We will handle everything on a frame by frame basis, in order to make sure the same thing happens every time.
//We should also make sure that state is completely saved, so that the levels can be replayed and resumed.

const Phaser = require("./node_modules/phaser/dist/phaser.min.js")
const Shield = require("./Shield.js")
const MultipleCallback = require("./MultipleCallback.js")



let gameScene = new Phaser.Scene("Game")

gameScene.init = function init() {}
gameScene.preload = function preload() {
	this.load.image('background', 'assets/backgrounds/star-heavy-sky.png');
	this.load.image('spaceship', 'assets/players/triangle-ship.svg');
	this.load.image('shield', 'assets/energy-shield.png');

	this.load.image('mini-missile', 'assets/projectiles/mini-missile.svg');


}




function Player(scene, config = {}) {

	if (!scene) {
		throw "scene was not provided. "
	}

	if (!config.assetName) {
		throw "config.assetName was not provided. "
	}

	this.alpha = config.alpha || 1
	this.tint = config.tint || 0xFFFFFF
	this.scaleX = config.scaleX || 1
	this.scaleY = config.scaleY || 1

	//Initial Prep
	this.player = scene.physics.add.sprite(config.startX || 0, config.startY || 0, config.assetName)
	//TODO: Figure out how to set the player body for collisions.
	this.player.tint = this.tint
	this.player.alpha = this.alpha
	this.player.setScale(this.scaleX, this.scaleY)

	//Hold state even if multiple things are happening
	this.modifiers = {
		hidden: false,
		modifierArray: [] //Holds an object for each frame in the future that is modified. Each frame processed, the first element in modifierArray will be discarded.
	}

	this.frameCallback = (function() {}).bind(this)


	this.explodeAnimation = function() {

	}
}



gameScene.create = function create() {

	let background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'background');
	background.scale = 2
	background.alpha = 0.3
	background.rotation = Math.PI/2 //Make it width wise.

	let player = this.physics.add.sprite(80, this.cameras.main.centerY, 'spaceship');
	player.tint = 0xff0000
	player.scale = 0.3
	player.rotation = Math.PI/2

	let shield = new Shield(gameScene, {spriteToFollow:player, assetName:"shield", scaleRatio: 1.5})
	shield.reactivateAnimation(30)

	window.player = player
	window.background = background
	window.shield = shield

	mini_missile = this.physics.add.group();

	function hitMiniMissile(player, mini_missile) {
		shield.hitAnimation(30)
		//Make the player immune to velocity change
		player.body.velocity.x = player.body.newVelocity.x * 60
		player.body.velocity.y = player.body.newVelocity.y * 60

		//TODO: Fancy explosion...
		mini_missile.destroy()
	}

	for (let i=0;i<10;i++) {
	var bomb = mini_missile.create(600, 600, 'mini-missile');
	bomb.setBounce(1);
	bomb.setScale(0.3)
	bomb.body.mass = 1
	bomb.setCollideWorldBounds(true);
	bomb.setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-200, 200));
}

	let moving = false


	let angle = 0;
	this.input.on('pointermove', function (cursor) {
		if (!moving) {
		  angle = Phaser.Math.Angle.Between(player.x, player.y, cursor.x, cursor.y)
	  }
	}, this);

	let upSpeed = 140
	let downSpeed = 350
	this.input.on('pointerdown', (function() {
		if (!moving) {
			this.physics.add.collider(player, mini_missile, hitMiniMissile, null, this);
			//Calculate the ratio between the X and Y velocities.
			player.setVelocity(Math.cos(angle)*downSpeed, Math.sin(angle)*downSpeed)
			moving = true
		}
		else {
			player.setVelocity(player.body.velocity.x * downSpeed/upSpeed, player.body.velocity.y * downSpeed/upSpeed)
		}
	}).bind(gameScene))

	this.input.on('pointerup', function() {
		player.setVelocity(player.body.velocity.x * upSpeed/downSpeed, player.body.velocity.y * upSpeed/downSpeed)
	})

	function update() {

		if (!moving) {
			//Point towards the mouse.
			player.rotation = angle + Math.PI/2
		}
		else {
			//Point the ship towards where it is going.
			player.rotation = Math.atan(player.body.velocity.y/player.body.velocity.x) + Math.PI/2
			if (player.body.velocity.x < 0) {
				player.rotation -= Math.PI
			}
		}

		player.setBounce(1);
		player.setCollideWorldBounds(true);

		shield.frameCallback()
	}

	let updateCallback = new MultipleCallback()
	updateCallback.addCallback(update)
	updateCallback.addCallback(shield.frameCallback)
	window.updateCallback = updateCallback
	gameScene.update = updateCallback.callback
}



let config = {
	width: 1080,
	height: 720,
	type: Phaser.AUTO,
	scene: gameScene,
	physics: {
		default: 'arcade'
	}
}

let game = new Phaser.Game(config);

window.gameScene = gameScene
