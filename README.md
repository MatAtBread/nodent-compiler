[![NPM](https://nodei.co/npm/nodent.png?downloads=true&downloadRank=true)](https://nodei.co/npm/nodent/)

NoDent
======

NoDent is a small module for Nodejs that implements the JavaScript ES7 keywords `async` and `await`. These make writing, reading and understanding asynchronous and callback methods more implicit and embedded in the language. It works by (optionally) transforming JavaScript when it is loaded into Node.

This is the core compiler implementation. The main documentation and details for the CLI, require hook and package options can be found [here](https://github.com/MatAtBread/nodent)

Usage
=====

```javascript
var NodentCompiler = require('nodent-compiler');
var compiler = new NodentCompiler() ;
var es5ReadySourceCode = compiler.compile(sourceCode, filename, { sourcemap:false, promises: true, noRuntime: true, es6target: true });
```

`new NodentCompiler(opts)` creates a new NodentCompiler. Note that instances of a NodentCompiler can (and should) be reused to improve compilation performance since internal structures are cached. `opts` is an optional set of options containing:

		log:<null|function>		// Called by the compiler to report a compilation warning.
		
`compiler.compile(sourceCode, filename, options)` compiles ES7 source code containing `async` and `await` to ES5 source code.

	sourceCode:<string>	// The source to compiler
	filename:<?string>	// Optional original filename for source maps
	options:<object>:
		es7:<boolean>,			// Compile in es7 mode
		promises:<boolean>,		// Compile in Promises mode
		generators:<boolean>,	// Compile in generator mode
		engine:<boolean>,		// Compile in engine mode
		sourcemap:<boolean>,	// Create a sourcemap for the browser's debugger
		wrapAwait:<boolean>,	// Allow 'await' on non-Promise expressions
		lazyThenables:<boolean>,// Evaluate async bodies lazily in 'es7' mode. See the Changelog for 2.4.0 for more information
    	noRuntime:<boolean>,  	// Only compatible with promises & engine. Generate pure ES5 code for an environment that support Promises natively or as a global declaration. Currently about 15% slower that using the built-in runtime $asyncbind. Default is false.
    	es6target:<boolean>		// Compile code assuming an ES6 target (as of v3.0.8, this only requires support for arrow functions)

### Runtime requirements
[`nodent-runtime`](https://github.com/MatAtBread/nodent-runtime) must be available to generated code if `es7` or `generators` is set, or `noRuntime` is falsy.
`Promises` must be available to generated code is `promises`, `generators` or `engine` is set.

To generate code that requires no runtime support other than `Promises`, set `promises` and `noRuntime`.
 
