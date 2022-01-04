# lacuna-format

Node's `util.format` but without appending extra arguments

## Usage

`lacuna-format` is a drop in replacement for Node's [formatting utility][1] where extra 
arguments are ignored.

```javascript
const { format } = require("lacuna-format");

format("This is a %s", "formatted message")
// "This is a formatted message
```

The difference is that unlike Node's built in `format`, `lacuna-format` **ignores** extra 
arguments. *lacuna* is a synonym for "ignored".

For example

```javascript
const { format } = require("util")
const { lacuna } = require("lacuna-format")

format("This is a message", undefined)
// This is a message undefined

lacuna("This is a message", undefined)
// This is a message
```

The rationale is that if you have a message with no format specifiers (eg: `%s`) then arguments
should not be interpolated/added to the resulting string.

# Known Issues

* When using `%s` with an object, `lacuna-format` will fail with a `ReferenceError` as 
  `getProxyDetails` is not exposed from the Node internals. Convert the object to a String 
  first, then pass to the formatter.

# Interoperability with Node

Each major version of `lucana-format` will track a LTS version of Node. The tests perform 
comparisons with the internal Node `util.format`.

* 1.x - Node JS 12.22.8
* 2.x - Node JS 14.18.2
* 3.x - Node JS 16.13.1

[1]: https://nodejs.org/docs/latest-v12.x/api/util.html#util_util_format_format_args
