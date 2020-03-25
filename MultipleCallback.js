//Easily add and remove listeners to update callback.
function MultipleCallback() {
	this.callbacks = {}
	this.count = 0
	this.addCallback = (function(callback) {
		this.callbacks[this.count] = callback
		return this.count++
	}).bind(this)

	this.removeCallback = (function(id) {
		delete this.callbacks[id]
	}).bind(this)

	this.callback = (function() {
		for (let prop in this.callbacks) {
			this.callbacks[prop]()
		}
	}).bind(this)
}


module.exports = MultipleCallback
