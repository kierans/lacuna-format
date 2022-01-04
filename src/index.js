"use strict";

const { inspect } = require("util");

// don't have access to 'primodials' so use global objects.
// see https://stackoverflow.com/questions/59750976/what-are-primordials-in-node-js
const [
	JSONStringify,
	NumberParseFloat,
	NumberParseInt,
	ObjectGetOwnPropertyDescriptor,
	ObjectGetPrototypeOf,
	ObjectGetOwnPropertyNames,
	ObjectIs,
	ObjectPrototypeHasOwnProperty,
] = [
	JSON.stringify,
	Number.parseFloat,
	Number.parseInt,
	Object.getOwnPropertyDescriptor,
	Object.getPrototypeOf,
	Object.getOwnPropertyNames,
	Object.is,
	Object.prototype.hasOwnProperty
];

const builtInObjects = new Set(
	ObjectGetOwnPropertyNames(global).filter((e) => /^[A-Z][a-zA-Z0-9]+$/.test(e))
);

function format(...args) {
	return formatWithOptionsInternal(undefined, args);
}

function formatWithOptionsInternal(inspectOptions, args) {
  const first = args[0];
  let a = 0;
  let str = '';
  let join = '';

  if (typeof first === 'string') {
    if (args.length === 1) {
      return first;
    }
    let tempStr;
    let lastPos = 0;

    for (let i = 0; i < first.length - 1; i++) {
      if (first.charCodeAt(i) === 37) { // '%'
        const nextChar = first.charCodeAt(++i);
        if (a + 1 !== args.length) {
          switch (nextChar) {
            case 115: // 's'
              const tempArg = args[++a];
              if (typeof tempArg === 'number') {
                tempStr = formatNumber(stylizeNoColor, tempArg);
              } else if (typeof tempArg === 'bigint') {
                tempStr = `${tempArg}n`;
              } else if (typeof tempArg !== 'object' ||
                         tempArg === null ||
                         !hasBuiltInToString(tempArg)) {
                tempStr = String(tempArg);
              } else {
                tempStr = inspect(tempArg, {
                  ...inspectOptions,
                  compact: 3,
                  colors: false,
                  depth: 0
                });
              }
              break;
            case 106: // 'j'
              tempStr = tryStringify(args[++a]);
              break;
            case 100: // 'd'
              const tempNum = args[++a];
              if (typeof tempNum === 'bigint') {
                tempStr = `${tempNum}n`;
              } else if (typeof tempNum === 'symbol') {
                tempStr = 'NaN';
              } else {
                tempStr = formatNumber(stylizeNoColor, Number(tempNum));
              }
              break;
            case 79: // 'O'
              tempStr = inspect(args[++a], inspectOptions);
              break;
            case 111: // 'o'
              tempStr = inspect(args[++a], {
                ...inspectOptions,
                showHidden: true,
                showProxy: true,
                depth: 4
              });
              break;
            case 105: // 'i'
              const tempInteger = args[++a];
              if (typeof tempInteger === 'bigint') {
                tempStr = `${tempInteger}n`;
              } else if (typeof tempInteger === 'symbol') {
                tempStr = 'NaN';
              } else {
                tempStr = formatNumber(stylizeNoColor,
                                       NumberParseInt(tempInteger));
              }
              break;
            case 102: // 'f'
              const tempFloat = args[++a];
              if (typeof tempFloat === 'symbol') {
                tempStr = 'NaN';
              } else {
                tempStr = formatNumber(stylizeNoColor,
                                       NumberParseFloat(tempFloat));
              }
              break;
            case 99: // 'c'
              a += 1;
              tempStr = '';
              break;
            case 37: // '%'
              str += first.slice(lastPos, i);
              lastPos = i + 1;
              continue;
            default: // Any other character is not a correct placeholder
              continue;
          }
          if (lastPos !== i - 1) {
            str += first.slice(lastPos, i - 1);
          }
          str += tempStr;
          lastPos = i + 1;
        } else if (nextChar === 37) {
          str += first.slice(lastPos, i);
          lastPos = i + 1;
        }
      }
    }

    if (lastPos !== 0) {
      a++;
      join = ' ';
      if (lastPos < first.length) {
        str += first.slice(lastPos);
      }
    }

		// for when there are no specifiers
		if (tempStr === undefined) {
			str = first;
		}
  }

	// Removed to prevent concat of arguments.
	/*while (a < args.length) {
    const value = args[a];
    str += join;
    str += typeof value !== 'string' ? inspect(value, inspectOptions) : value;
    join = ' ';
    a++;
  }*/

  return str;
}

function formatNumber(fn, value) {
  // Format -0 as '-0'. Checking `value === -0` won't distinguish 0 from -0.
  return fn(ObjectIs(value, -0) ? '-0' : `${value}`, 'number');
}

function stylizeNoColor(str) {
	return str;
}


function hasBuiltInToString(value) {
  // Prevent triggering proxy traps.
  const getFullProxy = false;
  const proxyTarget = getProxyDetails(value, getFullProxy);
  if (proxyTarget !== undefined) {
    value = proxyTarget;
  }

  // Count objects that have no `toString` function as built-in.
  if (typeof value.toString !== 'function') {
    return true;
  }

  // The object has a own `toString` property. Thus it's not not a built-in one.
  if (ObjectPrototypeHasOwnProperty(value, 'toString')) {
    return false;
  }

  // Find the object that has the `toString` property as own property in the
  // prototype chain.
  let pointer = value;
  do {
    pointer = ObjectGetPrototypeOf(pointer);
  } while (!ObjectPrototypeHasOwnProperty(pointer, 'toString'));

  // Check closer if the object is a built-in.
  const descriptor = ObjectGetOwnPropertyDescriptor(pointer, 'constructor');
  return descriptor !== undefined &&
    typeof descriptor.value === 'function' &&
    builtInObjects.has(descriptor.value.name);
}

const firstErrorLine = (error) => error.message.split('\n')[0];
let CIRCULAR_ERROR_MESSAGE;
function tryStringify(arg) {
  try {
    return JSONStringify(arg);
  } catch (err) {
    // Populate the circular error message lazily
    if (!CIRCULAR_ERROR_MESSAGE) {
      try {
        const a = {}; a.a = a; JSONStringify(a);
      } catch (err) {
        CIRCULAR_ERROR_MESSAGE = firstErrorLine(err);
      }
    }
    if (err.name === 'TypeError' &&
        firstErrorLine(err) === CIRCULAR_ERROR_MESSAGE) {
      return '[Circular]';
    }
    throw err;
  }
}

module.exports = {
	format
}
