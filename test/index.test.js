"use strict";

const { assertThat, is } = require("hamjest");

describe("index", function() {
	it("should assert true", function() {
		assertThat(true, is(true));
	});
});
