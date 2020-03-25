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
	this.hitAnimation = (function(frames, startFrame = 0) {
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
	}).bind(this)

	this.reactivateAnimation = (function(frames, startFrame = 0, reverse = false) {
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
			this.modifiers.modifierArray[startFrame + i] = modifiers
		}
		//Make sure the shield is showing.
		if (reverse) {
			//TODO: The time complexity here is awful. Optimized should be O(n)
			let toReverse = this.modifiers.modifierArray.slice(startFrame, startFrame + frames)
			this.modifiers.modifierArray.splice(startFrame, frames, ...toReverse.reverse())
		}
		else {this.unhide()}
	}).bind(this)

	this.collapseAnimation = (function(frames, startFrame = 0) {
		//reactivateAnimation in reverse.
		this.reactivateAnimation(frames, startFrame, true)
		//Hide at the end.
		this.modifiers.modifierArray[startFrame + frames - 1].hide = true
	}).bind(this)

	this.hide = (function() {
		this.modifiers.hidden = true
	}).bind(this)

	this.unhide = (function() {
		this.modifiers.hidden = false
	}).bind(this)
}

module.exports = Shield
