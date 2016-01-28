"use strict"

const EasyObjectValue = require('../values/EasyObjectValue');
const ObjectValue = require('../values/ObjectValue');


class mObject extends EasyObjectValue {
	*call(thiz, args) {
		return this.fromNative("Ok?");
	}

	callPrototype(env) { return env.ObjectPrototype; }
	//objPrototype(env) { return env.Function; }

	static *create$e(thiz, args) {
		console.log("object#create called");
		return new ObjectValue(this.env);
	}
}

module.exports = mObject;