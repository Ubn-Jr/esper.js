'use strict';
/* @flow */

const Value = require('../Value');
const CompletionRecord = require('../CompletionRecord');
const ArrayValue = require('./ArrayValue');
/**
 * Represents a value that maps directly to an untrusted local value.
 */
class LinkValue extends Value {

	constructor(value) {
		super();
		this.native = value;
	}

	static make(native, realm) {
		if ( native === undefined ) return Value.undef;
		let prim = Value.fromPrimativeNative(native);
		if ( prim ) return prim;

		let wellKnown = realm.lookupWellKnown(native);
		if ( wellKnown ) return wellKnown;

		if ( Value.hasBookmark(native) ) {
			return Value.getBookmark(native);
		}

		if ( Array.isArray(native) ) {
			var ia = new Array(native.length);
			for ( let i = 0; i < native.length; ++i ) {
				ia[i] = LinkValue.make(native[i], realm);
			}
			return ArrayValue.make(ia, realm);
		}

		return new LinkValue(realm, native);
	}

	makeLink(native) {
		return LinkValue.make(native);
	}

	ref(name) {

		let that = this;
		let out = Object.create(null);

		let getter;
		if ( this.native.hasOwnProperty(name) ) {
			getter = () => this.makeLink(this.native[name]);
		} else {
			getter = () => this.makeLink(this.native).ref(name).value;
		}

		out.getValue = function *() { return getter(); };
		out.setValue = function *(to) { return yield * that.put(name, to); };
		out.del = function() { return false; };

		return out;
	}

	*set(name, value, s, extra) {
		this.native[name] = value.toNative();
	}

	toNative() {
		return this.native;
	}

	*asString() {
		return this.native.toString();
	}

	*doubleEquals(other) { return this.makeLink(this.native == other.toNative()); }
	*tripleEquals(other) { return this.makeLink(this.native === other.toNative()); }

	*add(other) { return this.makeLink(this.native + other.toNative()); }
	*subtract(other) { return this.makeLink(this.native - other.toNative()); }
	*multiply(other) { return this.makeLink(this.native * other.toNative()); }
	*divide(other) { return this.makeLink(this.native / other.toNative()); }
	*mod(other) { return this.makeLink(this.native % other.toNative()); }

	*shiftLeft(other) { return this.makeLink(this.native << other.toNative()); }
	*shiftRight(other) { return this.makeLink(this.native >> other.toNative()); }
	*shiftRightZF(other) { return this.makeLink(this.native >>> other.toNative()); }

	*bitAnd(other) { return this.makeLink(this.native & other.toNative()); }
	*bitOr(other) { return this.makeLink(this.native | other.toNative()); }
	*bitXor(other) { return this.makeLink(this.native ^ other.toNative()); }

	*gt(other) { return this.makeLink(this.native > other.toNative()); }
	*lt(other) { return this.makeLink(this.native < other.toNative()); }
	*gte(other) { return this.makeLink(this.native >= other.toNative()); }
	*lte(other) { return this.makeLink(this.native <= other.toNative()); }

	*inOperator(other) { return this.makeLink(this.native in other.toNative()); }
	*instanceOf(other) { return this.makeLink(this.native instanceof other.toNative()); }

	*unaryPlus() { return this.makeLink(+this.native); }
	*unaryMinus() { return this.makeLink(-this.native); }
	*not() { return this.makeLink(!this.native); }



	*get(name) {
		if ( this.native.hasOwnProperty(name) ) {
			return this.makeLink(this.native[name]);
		}

		return yield * this.makeLink(Object.getPrototypeOf(this.native)).get(name);
	}


	*observableProperties() {
		for ( let p in this.native ) {
			yield this.makeLink(p);
		}
		return;
	}

	/**
	 *
	 * @param {Value} thiz
	 * @param {Value[]} args
	 */
	*call(thiz, args) {
		let realArgs = new Array(args.length);
		for ( let i = 0; i < args.length; ++i ) {
			realArgs[i] = args[i].toNative();
		}
		try {
			let result = this.native.apply(thiz ? thiz.toNative() : undefined, realArgs);
			return this.makeLink(result);
		} catch ( e ) {
			let result = this.makeLink(e);
			return new CompletionRecord(CompletionRecord.THROW, result);
		}

	}

	*toNumberValue() { return Value.fromNative((Number(this.native))); }
	*toStringValue() { return Value.fromNative((String(this.native))); }

	getPrototype(realm) {
		return realm.ObjectPrototype;
	}

	*makeThisForNew() {
		return Value.undef;
	}

	get debugString() {
		return '[Link: ' + this.native + ']';
	}

	get truthy() {
		return !!this.native;
	}

	get jsTypeName() {
		return typeof this.native;
	}
}

module.exports = LinkValue;
