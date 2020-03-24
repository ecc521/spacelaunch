//A few notes for what we will be doing here:

//We will handle everything on a frame by frame basis, in order to make sure the same thing happens every time.
//We should also make sure that state is completely saved, so that the levels can be replayed and resumed.

const Phaser = require("./node_modules/phaser/dist/phaser.min.js")

let gameScene = new Phaser.Scene("Game")

gameScene.init = function init() {}
gameScene.preload = function preload() {
	this.load.image('background', 'assets/backgrounds/star-heavy-sky.png');
	this.load.image('spaceship', 'assets/players/triangle-ship.svg');
	this.load.image('shield', 'assets/energy-shield.png');

	this.load.image('mini-missile', 'assets/projectiles/mini-missile.svg');


}



function createShieldFlexValues(steps, maxFlex = 0.1) {
	//Creates the scale ratios for flexing shields on hit.
	//TODO: Allow multiple flexes
	steps--
	let arr = []
	for (let i=0;i<=steps;i++) {
		let value = 1 + (maxFlex * Math.sin(i/steps * Math.PI * 2))
		arr.push(value)
	}
	return arr
}




/*function Shield(gameScene, spriteToFollow, assetName = "shield", scaleRatio = 1, originalAlpha = 1, originalTint = 0xFFFFFF) {
	let obj = {
		scaleRatio, originalAlpha, originalTint
	}

	let shield = gameScene.physics.add.sprite(spriteToFollow.x, spriteToFollow.y, assetName)
	shield.alpha = obj.originalAlpha
	shield.tint = obj.originalTint

	obj.shield = shield
	obj.frameCallback = function() {
		//This will be called every frame.
		shield.x = spriteToFollow.x
		shield.y = spriteToFollow.y
		shield.scale = spriteToFollow.scale * scaleRatio
	}

	obj.hitAnimationDuration = 0
	obj.runHitAnimation = function(frameDuration) {
		//Choose the largest duration
		hitAnimationDuration = Math.max(frameDuration, obj.hitAnimationDuration)
	}

	obj._processHitAnimation = function() {
		if (obj.hitAnimationDuration <= 0) {
			//Reset
			return
		}
		//We can flicker tint, alpha, and flex scale a bit on this.
	}

	obj.setTint = function() {

	}
	obj.setAlpha = function() {

	}
	obj.hide = function() {}
	obj.show = function() {}
	return obj
}*/


function Shield(scene, config = {}) {

	if (!config.spriteToFollow) {
		throw "config.spriteToFollow was not provided. "
	}

	this.spriteToFollow = config.spriteToFollow

	if (!scene) {
		throw "scene was not provided. "
	}

	if (!config.assetName) {
		throw "config.assetName was not provided. "
	}

	this.alpha = config.alpha || 1
	this.tint = config.tint || 0xFFFFFF
	this.scaleRatioX = config.scaleRatioX || config.scaleRatio || 1
	this.scaleRatioY = config.scaleRatioY || config.scaleRatio || 1

	//Initial Prep
	this.shield = scene.physics.add.sprite(this.spriteToFollow.x, this.spriteToFollow.y, config.assetName)
	this.shield.body.setCircle(true) //Not tested or used... But should probably be done.
	this.shield.tint = this.tint
	this.shield.alpha = this.alpha
	this.shield.setScale(this.spriteToFollow.scaleX * this.scaleRatioX, this.spriteToFollow.scaleY * this.scaleRatioY)

	//Hold state even if multiple things are happening
	this.modifiers = {
		hidden: false,
		modifierArray: [] //Holds an object for each frame in the future that is modified. Each frame processed, the first element in modifierArray will be discarded.
	}

	this.frameCallback = (function() {
		//Manage the shield. Called on every frame.

		let currentModifiers = this.modifiers.modifierArray.shift() || {}
		if (currentModifiers.hide) {this.hide()} //Hide the animation at this point.

		if (this.modifiers.hidden) {
			this.shield.scale = 0
			return
		}

		this.shield.x = this.spriteToFollow.x
		this.shield.y = this.spriteToFollow.y
		this.shield.alpha = this.alpha
		this.shield.tint = this.tint
		this.shield.scaleX = this.spriteToFollow.scaleX * this.scaleRatioX
		this.shield.scaleY = this.spriteToFollow.scaleY * this.scaleRatioY

		if (!currentModifiers) {return} //Nothing is modified from normal.

		if (currentModifiers.scaleX !== undefined) {
			this.shield.scaleX = this.spriteToFollow.scaleX * currentModifiers.scaleX * this.scaleRatioX
		}

		if (currentModifiers.scaleY !== undefined) {
			this.shield.scaleY = this.spriteToFollow.scaleY * currentModifiers.scaleY * this.scaleRatioY
		}

		this.shield.tint = currentModifiers.tint ?? this.tint
		this.shield.alpha = currentModifiers.alpha ?? this.alpha

	}).bind(this)


	//TODO: The current animations will overwrite each other if called in such a way that they collide.
	//This could lead to a jump in the animation.
	this.hitAnimation = function(frames, startFrame = 0) {
		if (!(frames>0)) {throw "Frame count required. "}

		let flexValues1 = createShieldFlexValues(frames, 0.15)
		let flexValues2 = flexValues1.slice(0).reverse()

		for (let i=0;i<frames;i++) {
			let modifiers = this.modifiers.modifierArray[startFrame + i] || {}
			modifiers.alpha = Math.random()
			modifiers.scaleX = flexValues1[i]
			modifiers.scaleY = flexValues2[i]
			this.modifiers.modifierArray[startFrame + i] = modifiers
		}
	}

	this.reactivateAnimation = function(frames, startFrame = 0, reverse = false) {
		if (!(frames>0)) {throw "Frame count required. "}

		let flexValues1 = createShieldFlexValues(frames, 0.1)
		let flexValues2 = flexValues1.slice(0).reverse()

		//We will flex while going from min to max size.
		flexValues1 = flexValues1.map((value, index) => {return (index+1)/frames*value})
		flexValues2 = flexValues2.map((value, index) => {return (index+1)/frames*value})

		for (let i=0;i<frames;i++) {
			let modifiers = this.modifiers.modifierArray[startFrame + i] || {}
			modifiers.alpha = (i+1)/frames
			modifiers.scaleX = flexValues1[i]
			modifiers.scaleY = flexValues2[i]
			this.modifiers.modifierArray[i + startFrame] = modifiers
		}

		//Make sure the shield is showing.
		if (reverse) {
			//TODO: The time complexity here is awful. Optimized should be O(n)
			let toReverse = this.modifiers.modifierArray.slice(startFrame, frames)
			this.modifiers.modifierArray.splice(startFrame, frames, ...toReverse.reverse())
		}
		else {this.unhide()}
	}

	this.collapseAnimation = function(frames, startFrame = 0) {
		//reactivateAnimation in reverse.
		this.reactivateAnimation(frames, startFrame, true)
		//Hide at the end.
		this.modifiers.modifierArray[startFrame + frames - 1].hide = true
	}

	this.hide = function() {
		this.modifiers.hidden = true
	}

	this.unhide = function() {
		this.modifiers.hidden = false
	}
}


window.Shield = Shield


//Easily add and remove listeners to update callback.
function UpdateCallback() {
	let obj = {}
	obj.updateCallbacks = {}
	obj.count = 0
	obj.addUpdateCallback = function(callback) {
		obj.updateCallbacks[count] = callback
		return count++
	}
	obj.removeUpdateCallback = function(id) {
		delete obj.updateCallbacks[id]
	}
	obj.updateCallback = function() {
		for (let prop in obj.updateCallbacks) {
			obj.updateCallbacks[prop]()
		}
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


	gameScene.update = function update() {
		/*shield.x = player.x
		shield.y = player.y*/

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
