(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('node:fs/promises')) :
	typeof define === 'function' && define.amd ? define(['exports', 'node:fs/promises'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.neurahive = {}, global.promises));
})(this, (function (exports, promises) { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var sha3$1 = {exports: {}};

	/**
	 * [js-sha3]{@link https://github.com/emn178/js-sha3}
	 *
	 * @version 0.8.0
	 * @author Chen, Yi-Cyuan [emn178@gmail.com]
	 * @copyright Chen, Yi-Cyuan 2015-2018
	 * @license MIT
	 */

	(function (module) {
		/*jslint bitwise: true */
		(function () {

		  var INPUT_ERROR = 'input is invalid type';
		  var FINALIZE_ERROR = 'finalize already called';
		  var WINDOW = typeof window === 'object';
		  var root = WINDOW ? window : {};
		  if (root.JS_SHA3_NO_WINDOW) {
		    WINDOW = false;
		  }
		  var WEB_WORKER = !WINDOW && typeof self === 'object';
		  var NODE_JS = !root.JS_SHA3_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
		  if (NODE_JS) {
		    root = commonjsGlobal;
		  } else if (WEB_WORKER) {
		    root = self;
		  }
		  var COMMON_JS = !root.JS_SHA3_NO_COMMON_JS && 'object' === 'object' && module.exports;
		  var ARRAY_BUFFER = !root.JS_SHA3_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
		  var HEX_CHARS = '0123456789abcdef'.split('');
		  var SHAKE_PADDING = [31, 7936, 2031616, 520093696];
		  var CSHAKE_PADDING = [4, 1024, 262144, 67108864];
		  var KECCAK_PADDING = [1, 256, 65536, 16777216];
		  var PADDING = [6, 1536, 393216, 100663296];
		  var SHIFT = [0, 8, 16, 24];
		  var RC = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649,
		    0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0,
		    2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771,
		    2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648,
		    2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648];
		  var BITS = [224, 256, 384, 512];
		  var SHAKE_BITS = [128, 256];
		  var OUTPUT_TYPES = ['hex', 'buffer', 'arrayBuffer', 'array', 'digest'];
		  var CSHAKE_BYTEPAD = {
		    '128': 168,
		    '256': 136
		  };

		  if (root.JS_SHA3_NO_NODE_JS || !Array.isArray) {
		    Array.isArray = function (obj) {
		      return Object.prototype.toString.call(obj) === '[object Array]';
		    };
		  }

		  if (ARRAY_BUFFER && (root.JS_SHA3_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
		    ArrayBuffer.isView = function (obj) {
		      return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
		    };
		  }

		  var createOutputMethod = function (bits, padding, outputType) {
		    return function (message) {
		      return new Keccak(bits, padding, bits).update(message)[outputType]();
		    };
		  };

		  var createShakeOutputMethod = function (bits, padding, outputType) {
		    return function (message, outputBits) {
		      return new Keccak(bits, padding, outputBits).update(message)[outputType]();
		    };
		  };

		  var createCshakeOutputMethod = function (bits, padding, outputType) {
		    return function (message, outputBits, n, s) {
		      return methods['cshake' + bits].update(message, outputBits, n, s)[outputType]();
		    };
		  };

		  var createKmacOutputMethod = function (bits, padding, outputType) {
		    return function (key, message, outputBits, s) {
		      return methods['kmac' + bits].update(key, message, outputBits, s)[outputType]();
		    };
		  };

		  var createOutputMethods = function (method, createMethod, bits, padding) {
		    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
		      var type = OUTPUT_TYPES[i];
		      method[type] = createMethod(bits, padding, type);
		    }
		    return method;
		  };

		  var createMethod = function (bits, padding) {
		    var method = createOutputMethod(bits, padding, 'hex');
		    method.create = function () {
		      return new Keccak(bits, padding, bits);
		    };
		    method.update = function (message) {
		      return method.create().update(message);
		    };
		    return createOutputMethods(method, createOutputMethod, bits, padding);
		  };

		  var createShakeMethod = function (bits, padding) {
		    var method = createShakeOutputMethod(bits, padding, 'hex');
		    method.create = function (outputBits) {
		      return new Keccak(bits, padding, outputBits);
		    };
		    method.update = function (message, outputBits) {
		      return method.create(outputBits).update(message);
		    };
		    return createOutputMethods(method, createShakeOutputMethod, bits, padding);
		  };

		  var createCshakeMethod = function (bits, padding) {
		    var w = CSHAKE_BYTEPAD[bits];
		    var method = createCshakeOutputMethod(bits, padding, 'hex');
		    method.create = function (outputBits, n, s) {
		      if (!n && !s) {
		        return methods['shake' + bits].create(outputBits);
		      } else {
		        return new Keccak(bits, padding, outputBits).bytepad([n, s], w);
		      }
		    };
		    method.update = function (message, outputBits, n, s) {
		      return method.create(outputBits, n, s).update(message);
		    };
		    return createOutputMethods(method, createCshakeOutputMethod, bits, padding);
		  };

		  var createKmacMethod = function (bits, padding) {
		    var w = CSHAKE_BYTEPAD[bits];
		    var method = createKmacOutputMethod(bits, padding, 'hex');
		    method.create = function (key, outputBits, s) {
		      return new Kmac(bits, padding, outputBits).bytepad(['KMAC', s], w).bytepad([key], w);
		    };
		    method.update = function (key, message, outputBits, s) {
		      return method.create(key, outputBits, s).update(message);
		    };
		    return createOutputMethods(method, createKmacOutputMethod, bits, padding);
		  };

		  var algorithms = [
		    { name: 'keccak', padding: KECCAK_PADDING, bits: BITS, createMethod: createMethod },
		    { name: 'sha3', padding: PADDING, bits: BITS, createMethod: createMethod },
		    { name: 'shake', padding: SHAKE_PADDING, bits: SHAKE_BITS, createMethod: createShakeMethod },
		    { name: 'cshake', padding: CSHAKE_PADDING, bits: SHAKE_BITS, createMethod: createCshakeMethod },
		    { name: 'kmac', padding: CSHAKE_PADDING, bits: SHAKE_BITS, createMethod: createKmacMethod }
		  ];

		  var methods = {}, methodNames = [];

		  for (var i = 0; i < algorithms.length; ++i) {
		    var algorithm = algorithms[i];
		    var bits = algorithm.bits;
		    for (var j = 0; j < bits.length; ++j) {
		      var methodName = algorithm.name + '_' + bits[j];
		      methodNames.push(methodName);
		      methods[methodName] = algorithm.createMethod(bits[j], algorithm.padding);
		      if (algorithm.name !== 'sha3') {
		        var newMethodName = algorithm.name + bits[j];
		        methodNames.push(newMethodName);
		        methods[newMethodName] = methods[methodName];
		      }
		    }
		  }

		  function Keccak(bits, padding, outputBits) {
		    this.blocks = [];
		    this.s = [];
		    this.padding = padding;
		    this.outputBits = outputBits;
		    this.reset = true;
		    this.finalized = false;
		    this.block = 0;
		    this.start = 0;
		    this.blockCount = (1600 - (bits << 1)) >> 5;
		    this.byteCount = this.blockCount << 2;
		    this.outputBlocks = outputBits >> 5;
		    this.extraBytes = (outputBits & 31) >> 3;

		    for (var i = 0; i < 50; ++i) {
		      this.s[i] = 0;
		    }
		  }

		  Keccak.prototype.update = function (message) {
		    if (this.finalized) {
		      throw new Error(FINALIZE_ERROR);
		    }
		    var notString, type = typeof message;
		    if (type !== 'string') {
		      if (type === 'object') {
		        if (message === null) {
		          throw new Error(INPUT_ERROR);
		        } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
		          message = new Uint8Array(message);
		        } else if (!Array.isArray(message)) {
		          if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
		            throw new Error(INPUT_ERROR);
		          }
		        }
		      } else {
		        throw new Error(INPUT_ERROR);
		      }
		      notString = true;
		    }
		    var blocks = this.blocks, byteCount = this.byteCount, length = message.length,
		      blockCount = this.blockCount, index = 0, s = this.s, i, code;

		    while (index < length) {
		      if (this.reset) {
		        this.reset = false;
		        blocks[0] = this.block;
		        for (i = 1; i < blockCount + 1; ++i) {
		          blocks[i] = 0;
		        }
		      }
		      if (notString) {
		        for (i = this.start; index < length && i < byteCount; ++index) {
		          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
		        }
		      } else {
		        for (i = this.start; index < length && i < byteCount; ++index) {
		          code = message.charCodeAt(index);
		          if (code < 0x80) {
		            blocks[i >> 2] |= code << SHIFT[i++ & 3];
		          } else if (code < 0x800) {
		            blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
		            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
		          } else if (code < 0xd800 || code >= 0xe000) {
		            blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
		            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
		            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
		          } else {
		            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
		            blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
		            blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
		            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
		            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
		          }
		        }
		      }
		      this.lastByteIndex = i;
		      if (i >= byteCount) {
		        this.start = i - byteCount;
		        this.block = blocks[blockCount];
		        for (i = 0; i < blockCount; ++i) {
		          s[i] ^= blocks[i];
		        }
		        f(s);
		        this.reset = true;
		      } else {
		        this.start = i;
		      }
		    }
		    return this;
		  };

		  Keccak.prototype.encode = function (x, right) {
		    var o = x & 255, n = 1;
		    var bytes = [o];
		    x = x >> 8;
		    o = x & 255;
		    while (o > 0) {
		      bytes.unshift(o);
		      x = x >> 8;
		      o = x & 255;
		      ++n;
		    }
		    if (right) {
		      bytes.push(n);
		    } else {
		      bytes.unshift(n);
		    }
		    this.update(bytes);
		    return bytes.length;
		  };

		  Keccak.prototype.encodeString = function (str) {
		    var notString, type = typeof str;
		    if (type !== 'string') {
		      if (type === 'object') {
		        if (str === null) {
		          throw new Error(INPUT_ERROR);
		        } else if (ARRAY_BUFFER && str.constructor === ArrayBuffer) {
		          str = new Uint8Array(str);
		        } else if (!Array.isArray(str)) {
		          if (!ARRAY_BUFFER || !ArrayBuffer.isView(str)) {
		            throw new Error(INPUT_ERROR);
		          }
		        }
		      } else {
		        throw new Error(INPUT_ERROR);
		      }
		      notString = true;
		    }
		    var bytes = 0, length = str.length;
		    if (notString) {
		      bytes = length;
		    } else {
		      for (var i = 0; i < str.length; ++i) {
		        var code = str.charCodeAt(i);
		        if (code < 0x80) {
		          bytes += 1;
		        } else if (code < 0x800) {
		          bytes += 2;
		        } else if (code < 0xd800 || code >= 0xe000) {
		          bytes += 3;
		        } else {
		          code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(++i) & 0x3ff));
		          bytes += 4;
		        }
		      }
		    }
		    bytes += this.encode(bytes * 8);
		    this.update(str);
		    return bytes;
		  };

		  Keccak.prototype.bytepad = function (strs, w) {
		    var bytes = this.encode(w);
		    for (var i = 0; i < strs.length; ++i) {
		      bytes += this.encodeString(strs[i]);
		    }
		    var paddingBytes = w - bytes % w;
		    var zeros = [];
		    zeros.length = paddingBytes;
		    this.update(zeros);
		    return this;
		  };

		  Keccak.prototype.finalize = function () {
		    if (this.finalized) {
		      return;
		    }
		    this.finalized = true;
		    var blocks = this.blocks, i = this.lastByteIndex, blockCount = this.blockCount, s = this.s;
		    blocks[i >> 2] |= this.padding[i & 3];
		    if (this.lastByteIndex === this.byteCount) {
		      blocks[0] = blocks[blockCount];
		      for (i = 1; i < blockCount + 1; ++i) {
		        blocks[i] = 0;
		      }
		    }
		    blocks[blockCount - 1] |= 0x80000000;
		    for (i = 0; i < blockCount; ++i) {
		      s[i] ^= blocks[i];
		    }
		    f(s);
		  };

		  Keccak.prototype.toString = Keccak.prototype.hex = function () {
		    this.finalize();

		    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
		      extraBytes = this.extraBytes, i = 0, j = 0;
		    var hex = '', block;
		    while (j < outputBlocks) {
		      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
		        block = s[i];
		        hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F] +
		          HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F] +
		          HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F] +
		          HEX_CHARS[(block >> 28) & 0x0F] + HEX_CHARS[(block >> 24) & 0x0F];
		      }
		      if (j % blockCount === 0) {
		        f(s);
		        i = 0;
		      }
		    }
		    if (extraBytes) {
		      block = s[i];
		      hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F];
		      if (extraBytes > 1) {
		        hex += HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F];
		      }
		      if (extraBytes > 2) {
		        hex += HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F];
		      }
		    }
		    return hex;
		  };

		  Keccak.prototype.arrayBuffer = function () {
		    this.finalize();

		    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
		      extraBytes = this.extraBytes, i = 0, j = 0;
		    var bytes = this.outputBits >> 3;
		    var buffer;
		    if (extraBytes) {
		      buffer = new ArrayBuffer((outputBlocks + 1) << 2);
		    } else {
		      buffer = new ArrayBuffer(bytes);
		    }
		    var array = new Uint32Array(buffer);
		    while (j < outputBlocks) {
		      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
		        array[j] = s[i];
		      }
		      if (j % blockCount === 0) {
		        f(s);
		      }
		    }
		    if (extraBytes) {
		      array[i] = s[i];
		      buffer = buffer.slice(0, bytes);
		    }
		    return buffer;
		  };

		  Keccak.prototype.buffer = Keccak.prototype.arrayBuffer;

		  Keccak.prototype.digest = Keccak.prototype.array = function () {
		    this.finalize();

		    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
		      extraBytes = this.extraBytes, i = 0, j = 0;
		    var array = [], offset, block;
		    while (j < outputBlocks) {
		      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
		        offset = j << 2;
		        block = s[i];
		        array[offset] = block & 0xFF;
		        array[offset + 1] = (block >> 8) & 0xFF;
		        array[offset + 2] = (block >> 16) & 0xFF;
		        array[offset + 3] = (block >> 24) & 0xFF;
		      }
		      if (j % blockCount === 0) {
		        f(s);
		      }
		    }
		    if (extraBytes) {
		      offset = j << 2;
		      block = s[i];
		      array[offset] = block & 0xFF;
		      if (extraBytes > 1) {
		        array[offset + 1] = (block >> 8) & 0xFF;
		      }
		      if (extraBytes > 2) {
		        array[offset + 2] = (block >> 16) & 0xFF;
		      }
		    }
		    return array;
		  };

		  function Kmac(bits, padding, outputBits) {
		    Keccak.call(this, bits, padding, outputBits);
		  }

		  Kmac.prototype = new Keccak();

		  Kmac.prototype.finalize = function () {
		    this.encode(this.outputBits, true);
		    return Keccak.prototype.finalize.call(this);
		  };

		  var f = function (s) {
		    var h, l, n, c0, c1, c2, c3, c4, c5, c6, c7, c8, c9,
		      b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17,
		      b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30, b31, b32, b33,
		      b34, b35, b36, b37, b38, b39, b40, b41, b42, b43, b44, b45, b46, b47, b48, b49;
		    for (n = 0; n < 48; n += 2) {
		      c0 = s[0] ^ s[10] ^ s[20] ^ s[30] ^ s[40];
		      c1 = s[1] ^ s[11] ^ s[21] ^ s[31] ^ s[41];
		      c2 = s[2] ^ s[12] ^ s[22] ^ s[32] ^ s[42];
		      c3 = s[3] ^ s[13] ^ s[23] ^ s[33] ^ s[43];
		      c4 = s[4] ^ s[14] ^ s[24] ^ s[34] ^ s[44];
		      c5 = s[5] ^ s[15] ^ s[25] ^ s[35] ^ s[45];
		      c6 = s[6] ^ s[16] ^ s[26] ^ s[36] ^ s[46];
		      c7 = s[7] ^ s[17] ^ s[27] ^ s[37] ^ s[47];
		      c8 = s[8] ^ s[18] ^ s[28] ^ s[38] ^ s[48];
		      c9 = s[9] ^ s[19] ^ s[29] ^ s[39] ^ s[49];

		      h = c8 ^ ((c2 << 1) | (c3 >>> 31));
		      l = c9 ^ ((c3 << 1) | (c2 >>> 31));
		      s[0] ^= h;
		      s[1] ^= l;
		      s[10] ^= h;
		      s[11] ^= l;
		      s[20] ^= h;
		      s[21] ^= l;
		      s[30] ^= h;
		      s[31] ^= l;
		      s[40] ^= h;
		      s[41] ^= l;
		      h = c0 ^ ((c4 << 1) | (c5 >>> 31));
		      l = c1 ^ ((c5 << 1) | (c4 >>> 31));
		      s[2] ^= h;
		      s[3] ^= l;
		      s[12] ^= h;
		      s[13] ^= l;
		      s[22] ^= h;
		      s[23] ^= l;
		      s[32] ^= h;
		      s[33] ^= l;
		      s[42] ^= h;
		      s[43] ^= l;
		      h = c2 ^ ((c6 << 1) | (c7 >>> 31));
		      l = c3 ^ ((c7 << 1) | (c6 >>> 31));
		      s[4] ^= h;
		      s[5] ^= l;
		      s[14] ^= h;
		      s[15] ^= l;
		      s[24] ^= h;
		      s[25] ^= l;
		      s[34] ^= h;
		      s[35] ^= l;
		      s[44] ^= h;
		      s[45] ^= l;
		      h = c4 ^ ((c8 << 1) | (c9 >>> 31));
		      l = c5 ^ ((c9 << 1) | (c8 >>> 31));
		      s[6] ^= h;
		      s[7] ^= l;
		      s[16] ^= h;
		      s[17] ^= l;
		      s[26] ^= h;
		      s[27] ^= l;
		      s[36] ^= h;
		      s[37] ^= l;
		      s[46] ^= h;
		      s[47] ^= l;
		      h = c6 ^ ((c0 << 1) | (c1 >>> 31));
		      l = c7 ^ ((c1 << 1) | (c0 >>> 31));
		      s[8] ^= h;
		      s[9] ^= l;
		      s[18] ^= h;
		      s[19] ^= l;
		      s[28] ^= h;
		      s[29] ^= l;
		      s[38] ^= h;
		      s[39] ^= l;
		      s[48] ^= h;
		      s[49] ^= l;

		      b0 = s[0];
		      b1 = s[1];
		      b32 = (s[11] << 4) | (s[10] >>> 28);
		      b33 = (s[10] << 4) | (s[11] >>> 28);
		      b14 = (s[20] << 3) | (s[21] >>> 29);
		      b15 = (s[21] << 3) | (s[20] >>> 29);
		      b46 = (s[31] << 9) | (s[30] >>> 23);
		      b47 = (s[30] << 9) | (s[31] >>> 23);
		      b28 = (s[40] << 18) | (s[41] >>> 14);
		      b29 = (s[41] << 18) | (s[40] >>> 14);
		      b20 = (s[2] << 1) | (s[3] >>> 31);
		      b21 = (s[3] << 1) | (s[2] >>> 31);
		      b2 = (s[13] << 12) | (s[12] >>> 20);
		      b3 = (s[12] << 12) | (s[13] >>> 20);
		      b34 = (s[22] << 10) | (s[23] >>> 22);
		      b35 = (s[23] << 10) | (s[22] >>> 22);
		      b16 = (s[33] << 13) | (s[32] >>> 19);
		      b17 = (s[32] << 13) | (s[33] >>> 19);
		      b48 = (s[42] << 2) | (s[43] >>> 30);
		      b49 = (s[43] << 2) | (s[42] >>> 30);
		      b40 = (s[5] << 30) | (s[4] >>> 2);
		      b41 = (s[4] << 30) | (s[5] >>> 2);
		      b22 = (s[14] << 6) | (s[15] >>> 26);
		      b23 = (s[15] << 6) | (s[14] >>> 26);
		      b4 = (s[25] << 11) | (s[24] >>> 21);
		      b5 = (s[24] << 11) | (s[25] >>> 21);
		      b36 = (s[34] << 15) | (s[35] >>> 17);
		      b37 = (s[35] << 15) | (s[34] >>> 17);
		      b18 = (s[45] << 29) | (s[44] >>> 3);
		      b19 = (s[44] << 29) | (s[45] >>> 3);
		      b10 = (s[6] << 28) | (s[7] >>> 4);
		      b11 = (s[7] << 28) | (s[6] >>> 4);
		      b42 = (s[17] << 23) | (s[16] >>> 9);
		      b43 = (s[16] << 23) | (s[17] >>> 9);
		      b24 = (s[26] << 25) | (s[27] >>> 7);
		      b25 = (s[27] << 25) | (s[26] >>> 7);
		      b6 = (s[36] << 21) | (s[37] >>> 11);
		      b7 = (s[37] << 21) | (s[36] >>> 11);
		      b38 = (s[47] << 24) | (s[46] >>> 8);
		      b39 = (s[46] << 24) | (s[47] >>> 8);
		      b30 = (s[8] << 27) | (s[9] >>> 5);
		      b31 = (s[9] << 27) | (s[8] >>> 5);
		      b12 = (s[18] << 20) | (s[19] >>> 12);
		      b13 = (s[19] << 20) | (s[18] >>> 12);
		      b44 = (s[29] << 7) | (s[28] >>> 25);
		      b45 = (s[28] << 7) | (s[29] >>> 25);
		      b26 = (s[38] << 8) | (s[39] >>> 24);
		      b27 = (s[39] << 8) | (s[38] >>> 24);
		      b8 = (s[48] << 14) | (s[49] >>> 18);
		      b9 = (s[49] << 14) | (s[48] >>> 18);

		      s[0] = b0 ^ (~b2 & b4);
		      s[1] = b1 ^ (~b3 & b5);
		      s[10] = b10 ^ (~b12 & b14);
		      s[11] = b11 ^ (~b13 & b15);
		      s[20] = b20 ^ (~b22 & b24);
		      s[21] = b21 ^ (~b23 & b25);
		      s[30] = b30 ^ (~b32 & b34);
		      s[31] = b31 ^ (~b33 & b35);
		      s[40] = b40 ^ (~b42 & b44);
		      s[41] = b41 ^ (~b43 & b45);
		      s[2] = b2 ^ (~b4 & b6);
		      s[3] = b3 ^ (~b5 & b7);
		      s[12] = b12 ^ (~b14 & b16);
		      s[13] = b13 ^ (~b15 & b17);
		      s[22] = b22 ^ (~b24 & b26);
		      s[23] = b23 ^ (~b25 & b27);
		      s[32] = b32 ^ (~b34 & b36);
		      s[33] = b33 ^ (~b35 & b37);
		      s[42] = b42 ^ (~b44 & b46);
		      s[43] = b43 ^ (~b45 & b47);
		      s[4] = b4 ^ (~b6 & b8);
		      s[5] = b5 ^ (~b7 & b9);
		      s[14] = b14 ^ (~b16 & b18);
		      s[15] = b15 ^ (~b17 & b19);
		      s[24] = b24 ^ (~b26 & b28);
		      s[25] = b25 ^ (~b27 & b29);
		      s[34] = b34 ^ (~b36 & b38);
		      s[35] = b35 ^ (~b37 & b39);
		      s[44] = b44 ^ (~b46 & b48);
		      s[45] = b45 ^ (~b47 & b49);
		      s[6] = b6 ^ (~b8 & b0);
		      s[7] = b7 ^ (~b9 & b1);
		      s[16] = b16 ^ (~b18 & b10);
		      s[17] = b17 ^ (~b19 & b11);
		      s[26] = b26 ^ (~b28 & b20);
		      s[27] = b27 ^ (~b29 & b21);
		      s[36] = b36 ^ (~b38 & b30);
		      s[37] = b37 ^ (~b39 & b31);
		      s[46] = b46 ^ (~b48 & b40);
		      s[47] = b47 ^ (~b49 & b41);
		      s[8] = b8 ^ (~b0 & b2);
		      s[9] = b9 ^ (~b1 & b3);
		      s[18] = b18 ^ (~b10 & b12);
		      s[19] = b19 ^ (~b11 & b13);
		      s[28] = b28 ^ (~b20 & b22);
		      s[29] = b29 ^ (~b21 & b23);
		      s[38] = b38 ^ (~b30 & b32);
		      s[39] = b39 ^ (~b31 & b33);
		      s[48] = b48 ^ (~b40 & b42);
		      s[49] = b49 ^ (~b41 & b43);

		      s[0] ^= RC[n];
		      s[1] ^= RC[n + 1];
		    }
		  };

		  if (COMMON_JS) {
		    module.exports = methods;
		  } else {
		    for (i = 0; i < methodNames.length; ++i) {
		      root[methodNames[i]] = methods[methodNames[i]];
		    }
		  }
		})(); 
	} (sha3$1));

	var sha3Exports = sha3$1.exports;
	var sha3 = /*@__PURE__*/getDefaultExportFromCjs(sha3Exports);

	const version$1 = "logger/5.7.0";

	let _permanentCensorErrors = false;
	let _censorErrors = false;
	const LogLevels = { debug: 1, "default": 2, info: 2, warning: 3, error: 4, off: 5 };
	let _logLevel = LogLevels["default"];
	let _globalLogger = null;
	function _checkNormalize() {
	    try {
	        const missing = [];
	        // Make sure all forms of normalization are supported
	        ["NFD", "NFC", "NFKD", "NFKC"].forEach((form) => {
	            try {
	                if ("test".normalize(form) !== "test") {
	                    throw new Error("bad normalize");
	                }
	                ;
	            }
	            catch (error) {
	                missing.push(form);
	            }
	        });
	        if (missing.length) {
	            throw new Error("missing " + missing.join(", "));
	        }
	        if (String.fromCharCode(0xe9).normalize("NFD") !== String.fromCharCode(0x65, 0x0301)) {
	            throw new Error("broken implementation");
	        }
	    }
	    catch (error) {
	        return error.message;
	    }
	    return null;
	}
	const _normalizeError = _checkNormalize();
	var LogLevel;
	(function (LogLevel) {
	    LogLevel["DEBUG"] = "DEBUG";
	    LogLevel["INFO"] = "INFO";
	    LogLevel["WARNING"] = "WARNING";
	    LogLevel["ERROR"] = "ERROR";
	    LogLevel["OFF"] = "OFF";
	})(LogLevel || (LogLevel = {}));
	var ErrorCode;
	(function (ErrorCode) {
	    ///////////////////
	    // Generic Errors
	    // Unknown Error
	    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
	    // Not Implemented
	    ErrorCode["NOT_IMPLEMENTED"] = "NOT_IMPLEMENTED";
	    // Unsupported Operation
	    //   - operation
	    ErrorCode["UNSUPPORTED_OPERATION"] = "UNSUPPORTED_OPERATION";
	    // Network Error (i.e. Ethereum Network, such as an invalid chain ID)
	    //   - event ("noNetwork" is not re-thrown in provider.ready; otherwise thrown)
	    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
	    // Some sort of bad response from the server
	    ErrorCode["SERVER_ERROR"] = "SERVER_ERROR";
	    // Timeout
	    ErrorCode["TIMEOUT"] = "TIMEOUT";
	    ///////////////////
	    // Operational  Errors
	    // Buffer Overrun
	    ErrorCode["BUFFER_OVERRUN"] = "BUFFER_OVERRUN";
	    // Numeric Fault
	    //   - operation: the operation being executed
	    //   - fault: the reason this faulted
	    ErrorCode["NUMERIC_FAULT"] = "NUMERIC_FAULT";
	    ///////////////////
	    // Argument Errors
	    // Missing new operator to an object
	    //  - name: The name of the class
	    ErrorCode["MISSING_NEW"] = "MISSING_NEW";
	    // Invalid argument (e.g. value is incompatible with type) to a function:
	    //   - argument: The argument name that was invalid
	    //   - value: The value of the argument
	    ErrorCode["INVALID_ARGUMENT"] = "INVALID_ARGUMENT";
	    // Missing argument to a function:
	    //   - count: The number of arguments received
	    //   - expectedCount: The number of arguments expected
	    ErrorCode["MISSING_ARGUMENT"] = "MISSING_ARGUMENT";
	    // Too many arguments
	    //   - count: The number of arguments received
	    //   - expectedCount: The number of arguments expected
	    ErrorCode["UNEXPECTED_ARGUMENT"] = "UNEXPECTED_ARGUMENT";
	    ///////////////////
	    // Blockchain Errors
	    // Call exception
	    //  - transaction: the transaction
	    //  - address?: the contract address
	    //  - args?: The arguments passed into the function
	    //  - method?: The Solidity method signature
	    //  - errorSignature?: The EIP848 error signature
	    //  - errorArgs?: The EIP848 error parameters
	    //  - reason: The reason (only for EIP848 "Error(string)")
	    ErrorCode["CALL_EXCEPTION"] = "CALL_EXCEPTION";
	    // Insufficient funds (< value + gasLimit * gasPrice)
	    //   - transaction: the transaction attempted
	    ErrorCode["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
	    // Nonce has already been used
	    //   - transaction: the transaction attempted
	    ErrorCode["NONCE_EXPIRED"] = "NONCE_EXPIRED";
	    // The replacement fee for the transaction is too low
	    //   - transaction: the transaction attempted
	    ErrorCode["REPLACEMENT_UNDERPRICED"] = "REPLACEMENT_UNDERPRICED";
	    // The gas limit could not be estimated
	    //   - transaction: the transaction passed to estimateGas
	    ErrorCode["UNPREDICTABLE_GAS_LIMIT"] = "UNPREDICTABLE_GAS_LIMIT";
	    // The transaction was replaced by one with a higher gas price
	    //   - reason: "cancelled", "replaced" or "repriced"
	    //   - cancelled: true if reason == "cancelled" or reason == "replaced")
	    //   - hash: original transaction hash
	    //   - replacement: the full TransactionsResponse for the replacement
	    //   - receipt: the receipt of the replacement
	    ErrorCode["TRANSACTION_REPLACED"] = "TRANSACTION_REPLACED";
	    ///////////////////
	    // Interaction Errors
	    // The user rejected the action, such as signing a message or sending
	    // a transaction
	    ErrorCode["ACTION_REJECTED"] = "ACTION_REJECTED";
	})(ErrorCode || (ErrorCode = {}));
	const HEX = "0123456789abcdef";
	class Logger {
	    constructor(version) {
	        Object.defineProperty(this, "version", {
	            enumerable: true,
	            value: version,
	            writable: false
	        });
	    }
	    _log(logLevel, args) {
	        const level = logLevel.toLowerCase();
	        if (LogLevels[level] == null) {
	            this.throwArgumentError("invalid log level name", "logLevel", logLevel);
	        }
	        if (_logLevel > LogLevels[level]) {
	            return;
	        }
	        console.log.apply(console, args);
	    }
	    debug(...args) {
	        this._log(Logger.levels.DEBUG, args);
	    }
	    info(...args) {
	        this._log(Logger.levels.INFO, args);
	    }
	    warn(...args) {
	        this._log(Logger.levels.WARNING, args);
	    }
	    makeError(message, code, params) {
	        // Errors are being censored
	        if (_censorErrors) {
	            return this.makeError("censored error", code, {});
	        }
	        if (!code) {
	            code = Logger.errors.UNKNOWN_ERROR;
	        }
	        if (!params) {
	            params = {};
	        }
	        const messageDetails = [];
	        Object.keys(params).forEach((key) => {
	            const value = params[key];
	            try {
	                if (value instanceof Uint8Array) {
	                    let hex = "";
	                    for (let i = 0; i < value.length; i++) {
	                        hex += HEX[value[i] >> 4];
	                        hex += HEX[value[i] & 0x0f];
	                    }
	                    messageDetails.push(key + "=Uint8Array(0x" + hex + ")");
	                }
	                else {
	                    messageDetails.push(key + "=" + JSON.stringify(value));
	                }
	            }
	            catch (error) {
	                messageDetails.push(key + "=" + JSON.stringify(params[key].toString()));
	            }
	        });
	        messageDetails.push(`code=${code}`);
	        messageDetails.push(`version=${this.version}`);
	        const reason = message;
	        let url = "";
	        switch (code) {
	            case ErrorCode.NUMERIC_FAULT: {
	                url = "NUMERIC_FAULT";
	                const fault = message;
	                switch (fault) {
	                    case "overflow":
	                    case "underflow":
	                    case "division-by-zero":
	                        url += "-" + fault;
	                        break;
	                    case "negative-power":
	                    case "negative-width":
	                        url += "-unsupported";
	                        break;
	                    case "unbound-bitwise-result":
	                        url += "-unbound-result";
	                        break;
	                }
	                break;
	            }
	            case ErrorCode.CALL_EXCEPTION:
	            case ErrorCode.INSUFFICIENT_FUNDS:
	            case ErrorCode.MISSING_NEW:
	            case ErrorCode.NONCE_EXPIRED:
	            case ErrorCode.REPLACEMENT_UNDERPRICED:
	            case ErrorCode.TRANSACTION_REPLACED:
	            case ErrorCode.UNPREDICTABLE_GAS_LIMIT:
	                url = code;
	                break;
	        }
	        if (url) {
	            message += " [ See: https:/\/links.ethers.org/v5-errors-" + url + " ]";
	        }
	        if (messageDetails.length) {
	            message += " (" + messageDetails.join(", ") + ")";
	        }
	        // @TODO: Any??
	        const error = new Error(message);
	        error.reason = reason;
	        error.code = code;
	        Object.keys(params).forEach(function (key) {
	            error[key] = params[key];
	        });
	        return error;
	    }
	    throwError(message, code, params) {
	        throw this.makeError(message, code, params);
	    }
	    throwArgumentError(message, name, value) {
	        return this.throwError(message, Logger.errors.INVALID_ARGUMENT, {
	            argument: name,
	            value: value
	        });
	    }
	    assert(condition, message, code, params) {
	        if (!!condition) {
	            return;
	        }
	        this.throwError(message, code, params);
	    }
	    assertArgument(condition, message, name, value) {
	        if (!!condition) {
	            return;
	        }
	        this.throwArgumentError(message, name, value);
	    }
	    checkNormalize(message) {
	        if (_normalizeError) {
	            this.throwError("platform missing String.prototype.normalize", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "String.prototype.normalize", form: _normalizeError
	            });
	        }
	    }
	    checkSafeUint53(value, message) {
	        if (typeof (value) !== "number") {
	            return;
	        }
	        if (message == null) {
	            message = "value not safe";
	        }
	        if (value < 0 || value >= 0x1fffffffffffff) {
	            this.throwError(message, Logger.errors.NUMERIC_FAULT, {
	                operation: "checkSafeInteger",
	                fault: "out-of-safe-range",
	                value: value
	            });
	        }
	        if (value % 1) {
	            this.throwError(message, Logger.errors.NUMERIC_FAULT, {
	                operation: "checkSafeInteger",
	                fault: "non-integer",
	                value: value
	            });
	        }
	    }
	    checkArgumentCount(count, expectedCount, message) {
	        if (message) {
	            message = ": " + message;
	        }
	        else {
	            message = "";
	        }
	        if (count < expectedCount) {
	            this.throwError("missing argument" + message, Logger.errors.MISSING_ARGUMENT, {
	                count: count,
	                expectedCount: expectedCount
	            });
	        }
	        if (count > expectedCount) {
	            this.throwError("too many arguments" + message, Logger.errors.UNEXPECTED_ARGUMENT, {
	                count: count,
	                expectedCount: expectedCount
	            });
	        }
	    }
	    checkNew(target, kind) {
	        if (target === Object || target == null) {
	            this.throwError("missing new", Logger.errors.MISSING_NEW, { name: kind.name });
	        }
	    }
	    checkAbstract(target, kind) {
	        if (target === kind) {
	            this.throwError("cannot instantiate abstract class " + JSON.stringify(kind.name) + " directly; use a sub-class", Logger.errors.UNSUPPORTED_OPERATION, { name: target.name, operation: "new" });
	        }
	        else if (target === Object || target == null) {
	            this.throwError("missing new", Logger.errors.MISSING_NEW, { name: kind.name });
	        }
	    }
	    static globalLogger() {
	        if (!_globalLogger) {
	            _globalLogger = new Logger(version$1);
	        }
	        return _globalLogger;
	    }
	    static setCensorship(censorship, permanent) {
	        if (!censorship && permanent) {
	            this.globalLogger().throwError("cannot permanently disable censorship", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "setCensorship"
	            });
	        }
	        if (_permanentCensorErrors) {
	            if (!censorship) {
	                return;
	            }
	            this.globalLogger().throwError("error censorship permanent", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "setCensorship"
	            });
	        }
	        _censorErrors = !!censorship;
	        _permanentCensorErrors = !!permanent;
	    }
	    static setLogLevel(logLevel) {
	        const level = LogLevels[logLevel.toLowerCase()];
	        if (level == null) {
	            Logger.globalLogger().warn("invalid log level - " + logLevel);
	            return;
	        }
	        _logLevel = level;
	    }
	    static from(version) {
	        return new Logger(version);
	    }
	}
	Logger.errors = ErrorCode;
	Logger.levels = LogLevel;

	const version = "bytes/5.7.0";

	const logger = new Logger(version);
	///////////////////////////////
	function isHexable(value) {
	    return !!(value.toHexString);
	}
	function addSlice(array) {
	    if (array.slice) {
	        return array;
	    }
	    array.slice = function () {
	        const args = Array.prototype.slice.call(arguments);
	        return addSlice(new Uint8Array(Array.prototype.slice.apply(array, args)));
	    };
	    return array;
	}
	function isInteger(value) {
	    return (typeof (value) === "number" && value == value && (value % 1) === 0);
	}
	function isBytes(value) {
	    if (value == null) {
	        return false;
	    }
	    if (value.constructor === Uint8Array) {
	        return true;
	    }
	    if (typeof (value) === "string") {
	        return false;
	    }
	    if (!isInteger(value.length) || value.length < 0) {
	        return false;
	    }
	    for (let i = 0; i < value.length; i++) {
	        const v = value[i];
	        if (!isInteger(v) || v < 0 || v >= 256) {
	            return false;
	        }
	    }
	    return true;
	}
	function arrayify(value, options) {
	    if (!options) {
	        options = {};
	    }
	    if (typeof (value) === "number") {
	        logger.checkSafeUint53(value, "invalid arrayify value");
	        const result = [];
	        while (value) {
	            result.unshift(value & 0xff);
	            value = parseInt(String(value / 256));
	        }
	        if (result.length === 0) {
	            result.push(0);
	        }
	        return addSlice(new Uint8Array(result));
	    }
	    if (options.allowMissingPrefix && typeof (value) === "string" && value.substring(0, 2) !== "0x") {
	        value = "0x" + value;
	    }
	    if (isHexable(value)) {
	        value = value.toHexString();
	    }
	    if (isHexString(value)) {
	        let hex = value.substring(2);
	        if (hex.length % 2) {
	            if (options.hexPad === "left") {
	                hex = "0" + hex;
	            }
	            else if (options.hexPad === "right") {
	                hex += "0";
	            }
	            else {
	                logger.throwArgumentError("hex data is odd-length", "value", value);
	            }
	        }
	        const result = [];
	        for (let i = 0; i < hex.length; i += 2) {
	            result.push(parseInt(hex.substring(i, i + 2), 16));
	        }
	        return addSlice(new Uint8Array(result));
	    }
	    if (isBytes(value)) {
	        return addSlice(new Uint8Array(value));
	    }
	    return logger.throwArgumentError("invalid arrayify value", "value", value);
	}
	function isHexString(value, length) {
	    if (typeof (value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
	        return false;
	    }
	    if (length && value.length !== 2 + 2 * length) {
	        return false;
	    }
	    return true;
	}
	const HexCharacters = "0123456789abcdef";
	function hexlify(value, options) {
	    if (!options) {
	        options = {};
	    }
	    if (typeof (value) === "number") {
	        logger.checkSafeUint53(value, "invalid hexlify value");
	        let hex = "";
	        while (value) {
	            hex = HexCharacters[value & 0xf] + hex;
	            value = Math.floor(value / 16);
	        }
	        if (hex.length) {
	            if (hex.length % 2) {
	                hex = "0" + hex;
	            }
	            return "0x" + hex;
	        }
	        return "0x00";
	    }
	    if (typeof (value) === "bigint") {
	        value = value.toString(16);
	        if (value.length % 2) {
	            return ("0x0" + value);
	        }
	        return "0x" + value;
	    }
	    if (options.allowMissingPrefix && typeof (value) === "string" && value.substring(0, 2) !== "0x") {
	        value = "0x" + value;
	    }
	    if (isHexable(value)) {
	        return value.toHexString();
	    }
	    if (isHexString(value)) {
	        if (value.length % 2) {
	            if (options.hexPad === "left") {
	                value = "0x0" + value.substring(2);
	            }
	            else if (options.hexPad === "right") {
	                value += "0";
	            }
	            else {
	                logger.throwArgumentError("hex data is odd-length", "value", value);
	            }
	        }
	        return value.toLowerCase();
	    }
	    if (isBytes(value)) {
	        let result = "0x";
	        for (let i = 0; i < value.length; i++) {
	            let v = value[i];
	            result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
	        }
	        return result;
	    }
	    return logger.throwArgumentError("invalid hexlify value", "value", value);
	}
	function hexConcat(items) {
	    let result = "0x";
	    items.forEach((item) => {
	        result += hexlify(item).substring(2);
	    });
	    return result;
	}

	function keccak256(data) {
	    return '0x' + sha3.keccak_256(arrayify(data));
	}

	class LeafNode {
	    hash; // hex string
	    parent = null;
	    left = null;
	    right = null;
	    constructor(hash) {
	        this.hash = hash;
	    }
	    // content should be a hex string
	    static fromContent(content) {
	        return new LeafNode(keccak256(content));
	    }
	    static fromLeftAndRight(left, right) {
	        const node = new LeafNode(keccak256Hash(left.hash, right.hash));
	        node.left = left;
	        node.right = right;
	        left.parent = node;
	        right.parent = node;
	        return node;
	    }
	    isLeftSide() {
	        return this.parent !== null && this.parent.left === this;
	    }
	}
	exports.NeuraProofErrors = void 0;
	(function (NeuraProofErrors) {
	    NeuraProofErrors["WRONG_FORMAT"] = "invalid merkle proof format";
	    NeuraProofErrors["ROOT_MISMATCH"] = "merkle proof root mismatch";
	    NeuraProofErrors["CONTENT_MISMATCH"] = "merkle proof content mismatch";
	    NeuraProofErrors["POSITION_MISMATCH"] = "merkle proof position mismatch";
	    NeuraProofErrors["VALIDATION_FAILURE"] = "failed to validate merkle proof";
	})(exports.NeuraProofErrors || (exports.NeuraProofErrors = {}));
	// Proof represents a merkle tree proof of target content, e.g. chunk or segment of file.
	class NeuraProof {
	    // Lemma is made up of 3 parts to keep consistent with neurahive-rust:
	    // 1. Target content hash (leaf node).
	    // 2. Hashes from bottom to top of sibling nodes.
	    // 3. Root hash.
	    lemma = [];
	    // Path contains flags to indicate that whether the corresponding node is on the left side.
	    // All true for the left most leaf node, and all false for the right most leaf node.
	    path = [];
	    constructor(lemma = [], path = []) {
	        this.lemma = lemma;
	        this.path = path;
	    }
	    validateFormat() {
	        const numSiblings = this.path.length;
	        if (numSiblings === 0) {
	            if (this.lemma.length !== 1) {
	                return exports.NeuraProofErrors.WRONG_FORMAT;
	            }
	            return null;
	        }
	        if (numSiblings + 2 !== this.lemma.length) {
	            return exports.NeuraProofErrors.WRONG_FORMAT;
	        }
	        return null;
	    }
	    validate(rootHash, content, position, numLeafNodes) {
	        const contentHash = keccak256(content);
	        return this.validateHash(rootHash, contentHash, position, numLeafNodes);
	    }
	    validateHash(rootHash, contentHash, position, numLeafNodes) {
	        const formatError = this.validateFormat();
	        if (formatError !== null) {
	            return formatError;
	        }
	        if (contentHash !== this.lemma[0]) {
	            return exports.NeuraProofErrors.CONTENT_MISMATCH;
	        }
	        if (this.lemma.length > 1 && rootHash !== this.lemma[this.lemma.length - 1]) {
	            return exports.NeuraProofErrors.ROOT_MISMATCH;
	        }
	        const proofPosition = this.calculateProofPosition(numLeafNodes);
	        if (proofPosition !== position) {
	            return exports.NeuraProofErrors.POSITION_MISMATCH;
	        }
	        if (!this.validateRoot()) {
	            return exports.NeuraProofErrors.VALIDATION_FAILURE;
	        }
	        return null;
	    }
	    validateRoot() {
	        let hash = this.lemma[0];
	        for (let i = 0; i < this.path.length; i++) {
	            const isLeft = this.path[i];
	            if (isLeft) {
	                hash = keccak256Hash(hash, this.lemma[i + 1]);
	            }
	            else {
	                hash = keccak256Hash(this.lemma[i + 1], hash);
	            }
	        }
	        return hash === this.lemma[this.lemma.length - 1];
	    }
	    // numLeafNodes should bigger than 0
	    calculateProofPosition(numLeafNodes) {
	        let position = 0;
	        for (let i = this.path.length - 1; i >= 0; i--) {
	            const leftSideDepth = Math.ceil(Math.log2(numLeafNodes));
	            const leftSideLeafNodes = Math.pow(2, leftSideDepth) / 2;
	            const isLeft = this.path[i];
	            if (isLeft) {
	                numLeafNodes = leftSideLeafNodes;
	            }
	            else {
	                position += leftSideLeafNodes;
	                numLeafNodes -= leftSideLeafNodes;
	            }
	        }
	        return position;
	    }
	}
	class NeuraMerkleTree {
	    root = null;
	    leaves = [];
	    constructor(root = null, leaves = []) {
	        this.root = root;
	        this.leaves = leaves;
	    }
	    rootHash() {
	        return this.root ? this.root.hash : null;
	    }
	    proofAt(i) {
	        if (i < 0 || i >= this.leaves.length) {
	            throw new Error('Index out of range');
	        }
	        if (this.leaves.length === 1) {
	            return new NeuraProof([this.rootHash()], []);
	        }
	        const proof = new NeuraProof();
	        // append the target leaf node hash
	        proof.lemma.push(this.leaves[i].hash);
	        let current = this.leaves[i];
	        while (current !== this.root) {
	            if (current.isLeftSide()) {
	                proof.lemma.push(current.parent?.right?.hash);
	                proof.path.push(true);
	            }
	            else {
	                proof.lemma.push(current.parent?.left?.hash);
	                proof.path.push(false);
	            }
	            current = current.parent;
	        }
	        // append the root node hash
	        proof.lemma.push(this.rootHash());
	        return proof;
	    }
	    addLeaf(leafContent) {
	        this.leaves.push(LeafNode.fromContent(leafContent));
	    }
	    addLeafByHash(leafHash) {
	        this.leaves.push(new LeafNode(leafHash));
	    }
	    // build root
	    build() {
	        const numLeafNodes = this.leaves.length;
	        if (numLeafNodes === 0) {
	            return null;
	        }
	        let queue = [];
	        for (let i = 0; i < numLeafNodes; i += 2) {
	            // last single leaf node
	            if (i === numLeafNodes - 1) {
	                queue.push(this.leaves[i]);
	                continue;
	            }
	            const node = LeafNode.fromLeftAndRight(this.leaves[i], this.leaves[i + 1]);
	            queue.push(node);
	        }
	        while (true) {
	            const numNodes = queue.length;
	            if (numNodes <= 1) {
	                break;
	            }
	            for (let i = 0; i < Math.floor(numNodes / 2); i++) {
	                const left = queue[0];
	                const right = queue[1];
	                queue.splice(0, 2); // remove first two elements
	                queue.push(LeafNode.fromLeftAndRight(left, right));
	            }
	            if (numNodes % 2 === 1) {
	                const first = queue[0];
	                queue.splice(0, 1); // remove first element
	                queue.push(first);
	            }
	        }
	        this.root = queue[0];
	        return this;
	    }
	}
	function keccak256Hash(...hashes) {
	    return keccak256(hexConcat(hashes));
	}

	const DEFAULT_CHUNK_SIZE = 256; // bytes
	const DEFAULT_SEGMENT_MAX_CHUNKS = 1024;
	const DEFAULT_SEGMENT_SIZE = DEFAULT_CHUNK_SIZE * DEFAULT_SEGMENT_MAX_CHUNKS;
	const EMPTY_CHUNK = new Uint8Array(DEFAULT_CHUNK_SIZE);
	const EMPTY_CHUNK_HASH = keccak256(EMPTY_CHUNK);
	const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
	class NeurahiveFile {
	    blob = null; // @see https://developer.mozilla.org/en-US/docs/Web/API/File/File
	    isBlob = false;
	    fd = null;
	    fileSize = 0;
	    constructor() { }
	    static fromBlob(blob) {
	        const file = new NeurahiveFile();
	        file.blob = blob;
	        file.fileSize = blob.size;
	        file.isBlob = true;
	        return file;
	    }
	    static async fromNodeFileHandle(fd) {
	        const file = new NeurahiveFile();
	        file.fd = fd;
	        file.isBlob = false;
	        const stat = await fd.stat();
	        file.fileSize = stat.size;
	        return file;
	    }
	    // need manually close fd after use
	    static async fromFilePath(path) {
	        const fd = await promises.open(path, 'r'); // if fail, throw error
	        return await NeurahiveFile.fromNodeFileHandle(fd);
	    }
	    size() {
	        return this.fileSize;
	    }
	    iterate(flowPadding) {
	        if (this.isBlob) {
	            return BlobIterator.NewSegmentIterator(this.blob, this.size(), flowPadding);
	        }
	        else {
	            return new NodeFdIterator(this.fd, this.size(), DEFAULT_SEGMENT_SIZE, flowPadding);
	        }
	    }
	    async merkleTree() {
	        const iter = this.iterate(true);
	        const tree = new NeuraMerkleTree();
	        while (true) {
	            let [ok, err] = await iter.next();
	            if (err != null) {
	                return [null, err];
	            }
	            if (!ok) {
	                break;
	            }
	            const current = iter.current();
	            const segRoot = NeurahiveFile.segmentRoot(current);
	            tree.addLeafByHash(segRoot);
	        }
	        return [tree.build(), null];
	    }
	    numChunks() {
	        return numSplits(this.size(), DEFAULT_CHUNK_SIZE);
	    }
	    numSegments() {
	        return numSplits(this.size(), DEFAULT_SEGMENT_SIZE);
	    }
	    // split a segment into chunks and compute the root hash
	    static segmentRoot(segment, emptyChunksPadded = 0) {
	        const tree = new NeuraMerkleTree();
	        const dataLength = segment.length;
	        for (let offset = 0; offset < dataLength; offset += DEFAULT_CHUNK_SIZE) {
	            const chunk = segment.subarray(offset, offset + DEFAULT_CHUNK_SIZE);
	            tree.addLeaf(chunk);
	        }
	        if (emptyChunksPadded > 0) {
	            for (let i = 0; i < emptyChunksPadded; i++) {
	                tree.addLeafByHash(EMPTY_CHUNK_HASH);
	            }
	        }
	        tree.build();
	        if (tree.root !== null) {
	            return tree.rootHash();
	        }
	        return ZERO_HASH; // TODO check this
	    }
	}
	class BlobIterator {
	    file = null; // browser file
	    fd = null; // node.js file handle
	    buf;
	    bufSize = 0; // buffer content size
	    fileSize;
	    paddedSize; // total size including padding zeros
	    offset = 0;
	    batchSize;
	    constructor(file, fileSize, batch, flowPadding) {
	        if (batch % DEFAULT_CHUNK_SIZE > 0) {
	            throw new Error("batch size should align with chunk size");
	        }
	        const buf = new Uint8Array(batch);
	        const chunks = numSplits(fileSize, DEFAULT_CHUNK_SIZE);
	        let paddedSize;
	        if (flowPadding) {
	            const [paddedChunks,] = computePaddedSize(chunks);
	            paddedSize = paddedChunks * DEFAULT_CHUNK_SIZE;
	        }
	        else {
	            paddedSize = chunks * DEFAULT_CHUNK_SIZE;
	        }
	        this.file = file;
	        this.buf = buf;
	        this.fileSize = fileSize;
	        this.paddedSize = paddedSize;
	        this.batchSize = batch;
	    }
	    static NewSegmentIterator(file, fileSize, flowPadding) {
	        return new BlobIterator(file, fileSize, DEFAULT_SEGMENT_SIZE, flowPadding);
	    }
	    async readFromFile(start, end) {
	        if (start < 0 || start >= this.fileSize) {
	            throw new Error("invalid start offset");
	        }
	        if (end > this.fileSize) {
	            end = this.fileSize;
	        }
	        const buf = (await this.file?.slice(start, end).arrayBuffer());
	        const buffer = new Uint8Array(this.batchSize);
	        buffer.set(new Uint8Array(buf));
	        return {
	            bytesRead: buf.byteLength,
	            buffer
	        };
	    }
	    clearBuffer() {
	        this.bufSize = 0;
	    }
	    paddingZeros(length) {
	        const startOffset = this.bufSize;
	        this.buf = this.buf.fill(0, startOffset, startOffset + length);
	        this.bufSize += length;
	        this.offset += length;
	    }
	    async next() {
	        if (this.offset < 0 || this.offset >= this.paddedSize) {
	            return [false, null];
	        }
	        let expectedBufSize;
	        let maxAvailableLength = this.paddedSize - this.offset; // include padding zeros
	        if (maxAvailableLength >= this.batchSize) {
	            expectedBufSize = this.batchSize;
	        }
	        else {
	            expectedBufSize = maxAvailableLength;
	        }
	        this.clearBuffer();
	        if (this.offset >= this.fileSize) {
	            this.paddingZeros(expectedBufSize);
	            this.offset += expectedBufSize;
	            return [true, null];
	        }
	        const { bytesRead: n, buffer } = await this.readFromFile(this.offset, this.offset + this.batchSize);
	        this.buf = buffer;
	        this.bufSize = n;
	        this.offset += n;
	        // not reach EOF
	        if (n === expectedBufSize) {
	            return [true, null];
	        }
	        if (n > expectedBufSize) {
	            // should never happen
	            throw new Error("load more data from file than expected");
	        }
	        this.paddingZeros(expectedBufSize - n);
	        this.offset += expectedBufSize - n;
	        return [true, null];
	    }
	    current() {
	        return this.buf.subarray(0, this.bufSize);
	    }
	}
	class NodeFdIterator extends BlobIterator {
	    constructor(fd, fileSize, batch, flowPadding) {
	        super(null, fileSize, batch, flowPadding);
	        this.fd = fd;
	    }
	    // override BlobIterator.readFromFile
	    async readFromFile(start, end) {
	        if (start < 0 || start >= this.fileSize) {
	            throw new Error("invalid start offset");
	        }
	        if (end > this.fileSize) {
	            end = this.fileSize;
	        }
	        const res = await this.fd?.read({
	            buffer: this.buf,
	            offset: this.bufSize,
	            length: end - start,
	            position: start
	        });
	        return res;
	    }
	}
	// helper functions
	function numSplits(total, unit) {
	    return Math.floor((total - 1) / unit) + 1;
	}
	function nextPow2(input) {
	    let x = input;
	    x -= 1;
	    x |= x >> 32;
	    x |= x >> 16;
	    x |= x >> 8;
	    x |= x >> 4;
	    x |= x >> 2;
	    x |= x >> 1;
	    x += 1;
	    return x;
	}
	function computePaddedSize(chunks) {
	    let chunksNextPow2 = nextPow2(chunks);
	    if (chunksNextPow2 === chunks) {
	        return [chunksNextPow2, chunksNextPow2];
	    }
	    let minChunk;
	    if (chunksNextPow2 >= 16) {
	        minChunk = Math.floor(chunksNextPow2 / 16);
	    }
	    else {
	        minChunk = 1;
	    }
	    const paddedChunks = numSplits(chunks, minChunk) * minChunk;
	    return [paddedChunks, chunksNextPow2];
	}

	exports.BlobIterator = BlobIterator;
	exports.DEFAULT_CHUNK_SIZE = DEFAULT_CHUNK_SIZE;
	exports.DEFAULT_SEGMENT_MAX_CHUNKS = DEFAULT_SEGMENT_MAX_CHUNKS;
	exports.DEFAULT_SEGMENT_SIZE = DEFAULT_SEGMENT_SIZE;
	exports.EMPTY_CHUNK = EMPTY_CHUNK;
	exports.EMPTY_CHUNK_HASH = EMPTY_CHUNK_HASH;
	exports.LeafNode = LeafNode;
	exports.NeuraMerkleTree = NeuraMerkleTree;
	exports.NeuraProof = NeuraProof;
	exports.NeurahiveFile = NeurahiveFile;
	exports.NodeFdIterator = NodeFdIterator;
	exports.ZERO_HASH = ZERO_HASH;

}));
