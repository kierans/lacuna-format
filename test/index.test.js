"use strict";

const { format } = require("util");

const lacuna = require("../src/index").format

const { assertThat, is } = require("hamjest");

describe("index", function() {
	console.log(`Node version: ${process.version}`);

	const obj = {
		a: 1,
		b: {
			c: "foo",
			d: false,
			e: 3,
			f: [
				2.34, 5.67, 8.65
			]
		}
	}

	it("should match node interpolation", function() {
		assertThat(formattedString(lacuna), is(formattedString(format)));
	});

	it("should leave remaining specifiers", function () {
		assertThat(format("%s, %d", "Hello"), is(lacuna("%s, %d", "Hello")));
		assertThat(format("%s, %d"), is(lacuna("%s, %d")));
	});

	it("should not concat extra arguments", function() {
		assertThat(lacuna("Hello %s", "World", undefined), is("Hello World"));
		assertThat(lacuna("Hello World", undefined), is("Hello World"));
	});

	function formattedString(formatter) {
		return formatter("text %s, %s, %s, %d, %d, %d, %i, %i, %i, %f,, %f, %j, %o, %O, %c, %%",
			"Hello World",
			45,
			BigInt(20),
			"20",
			42,
			BigInt(20),
			"10",
			10,
			BigInt(20),
			"2.5643",
			2.5643,
			obj,
			obj,
			obj,
			".foo { display: block; }"
		)
	}
});
