/* Babel 7 transform */

var babylon = require('@babel/babylon');
var generate = require('@babel/babel-generator').default;

function printNode(ast) {
	return generate(ast,{}).code ;
}

function parse(code) {
	return babylon.parse(code,{
		allowImportExportEverywhere:true,
		allowReturnOutsideFunction:true,
		allowSuperOutsideMethod:true
	}).program ;
}

var transform = require('./lib/arboriculture').transform ;

function transformAsyncToPromises(api,options){
	var requiresTranspilation ;

	return {
		visitor: {
			Program: {
				enter: function(path, state){
					requiresTranspilation = false;
				},
				exit: function (path, state) {
					var runtime = ""; // Falsy for none (inline all the runtime calls), or a string specifying the local identifier for the runtime
					
					// Check if there was an async or await keyword before bothering to process the AST
					if (!requiresTranspilation)
						return ;

					var newAst = transform({
						// Input: the ast and filename
						filename:"filename-goes-here",
						ast:path.node
					},{
						// Code generation options
						es6target:false,
						babelTree:true,
						engine:false,
						generators:false,
						promises:true,
						lazyThenables:false,
						wrapAwait:true,
						noRuntime: !runtime,
						$runtime:runtime,
						generatedSymbolPrefix:"$",
						$return:"$return",
						$error:"$error",
						$arguments:"$args",
						$Promise:"Promise",
						$asyncspawn:"$asyncspawn",
						$asyncbind:"$asyncbind",
						$makeThenable:'$makeThenable'
					},
					{
						// Helpers for the transformer:
						parse: parse,						// Parse a JS fragment into an AST
						printNode: printNode,				// Print a node as JS source
						logger:console.log.bind(console)		// Log a warning
					}).ast ;
					
					if (runtime) {
						newAst.body.splice(0,0,{
							"type": "ImportDeclaration",
							"specifiers": [{
								"type": "ImportDefaultSpecifier",
								"local": {
									"type": "Identifier",
									"name": runtime
								}
							}],
							"importKind": "value",
							"source": {
								"type": "StringLiteral",
								"value": "nodent-runtime/promise"
							}
						});
					}
				}
 			},

			AwaitExpression: function Function(path, state) {
				requiresTranspilation = true;
			},

			Function: function Function(path, state) {
				if (path.node.async) {
					requiresTranspilation = true;
				}
			}
		}
	};
}

module.exports = transformAsyncToPromises ;
