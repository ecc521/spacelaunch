//A few notes for what we will be doing here:

//We will handle everything on a frame by frame basis, in order to make sure the same thing happens every time.
//We should also make sure that state is completely saved, so that the levels can be replayed and resumed.

const Phaser = require("./node_modules/phaser/dist/phaser.min.js")

let gameScene = new Phaser.Scene("Game")

gameScene.init = function init() {}
gameScene.preload = function preload() {
	this.load.image('background', 'assets/backgrounds/star-heavy-sky.png');
	this.load.image('spaceship', 'assets/players/triangle-ship.svg');
	this.load.image('sheild', 'assets/energy-sheild.png');

	this.load.image('mini-missile', 'assets/projectiles/mini-missile.svg');


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

	let shield = this.physics.add.sprite(80, this.cameras.main.centerY, "sheild")
	shield.scale = 0.6
	window.player = player
	window.shield = shield
	window.background = background

	mini_missile = this.physics.add.group();

	function hitMiniMissile(player, mini_missile) {
		shieldHit()
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

	let repeats;
	let timer;

	let shieldHit = (function shieldHit() {
		//We will flash the sheild color to indicate a hit.

		repeats = 32
		if (timer) {return;} //We don't want multiple async writes at once. Just reset the count and leave.

		let originalShieldTint = shield.tint
		let originalShieldAlpha = shield.alpha

		timer = this.time.addEvent({
		    delay: 16,
		    callback: () => {
				if (repeats === 0) {
					timer.remove()
					timer = undefined
					shield.tint = originalShieldTint
					shield.alpha = originalShieldAlpha
					return
				}
		    	shield.tint = Math.random() * 0xFFFFFF
				shield.alpha = Math.random()
				repeats--
		    },
		    loop: true
		})

	}).bind(gameScene)


	window.shieldHit = shieldHit

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


	gameScene.update = function update() {
		shield.x = player.x
		shield.y = player.y

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



	}
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
