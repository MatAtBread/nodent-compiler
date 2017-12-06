/* Test transformation by Babel;*/

var fs = require('fs') ;
var babylon = require('@babel/babylon');
var generate = require('@babel/babel-generator').default;
var visitKeys = require('@babel/babel-types').VISITOR_KEYS;

function printNode(ast) {
    return generate(ast,{}).code ;
}

/*
function forEachNodeKey(n,down){
	visitKeys[n.type].forEach(function(member){
		if (Array.isArray(n[member])) {
			n[member].forEach(down) ;
		} 
		else
			down(n[member]);
	}) ;
}

function nodeKeys(n) {
    return n ? visitKeys[n.type]:null ;
}*/

function parse(code) {
	return babylon.parse(code,{
		allowImportExportEverywhere:true,
		allowReturnOutsideFunction:true,
		allowSuperOutsideMethod:true
	}).program ;
}

var transform = require('../lib/arboriculture').transform ;

for (var idx = 2; idx <process.argv.length; idx++) (function(){
	var fileName = process.argv[idx] ;
	var sample = '(async function _(){ '+fs.readFileSync(fileName).toString()+'})';

	try {
		var ast = parse(sample);

		var newAst = transform({
			// Input: the ast and filename
			filename:fileName,
			ast:ast
		},{
			// Code generation options
			es6target:false,
			noRuntime:true,
			babelTree:true,
			engine:false,
			generators:false,
			promises:true,
			lazyThenables:false,
			wrapAwait:true,
//			$runtime:'_asyncRuntime',
			$Promise:'Promise',
			$arguments:'$args',
			generatedSymbolPrefix:'$',
			$return:'$return',
			$error:'$error'
		},
		{
			// Helpers for the transformer:
			parse: parse,						// Parse a JS fragment into an AST
			printNode: printNode,				// Print a node as JS source
			logger:console.log.bind(console)		// Log a warning
		}).ast ;

		//console.log(printNode(newAst))
		
		Promise.all([sample,printNode(ast),printNode(newAst)].map(function(code) {
			return eval(code)()
		})).then(
			function(r) { console.log(fileName,r && r[0]==r[1] && r[1]==r[2]) },
			function(ex) { console.log(fileName,ex) }
		) ;

	} catch (ex) {
		console.log(fileName,ex) ;
	}
})();