var NodentCompiler = require('..') ;
var c = new NodentCompiler() ;

// On early node engines, Promise is not built in. If it's not, we try to use the
// implementation in nodent-runtime which is included as a dev-dependency since
// it's only used in this test script, and is not required by the compiler
global.$error = function(x) { console.log(x) };
if (!('Promise' in global)){
	global.Promise = require("nodent-runtime/zousan")() ;
}

/* Test transformations */

var fs = require('fs') ;
var args = process.argv.slice(2) ;
var passed = 0, failed = 0 ;
var complete, p = new Promise(function(r){ complete = r }) ;
for (var idx = 0; idx <args.length; idx++) (function(){
	var fileName = args[idx] ;
	var sample = "'"+fileName+"';\n\n"+fs.readFileSync(fileName).toString();
	var syncFn ;
	
	try {
		syncFn = new Function(sample.replace(/(async|await)/g," ")) ;
		try {
			var res = c.compile("return async function _(){"+sample+"}", null, { sourcemap:false, promises: true, noRuntime: true, es6target: false }) ;
			var fn = new Function(res.code)() ;
			fn().then(function(r){
				var s = syncFn() ;
				if (s && s.then) 
					s.then(check,check) ;
				else 
					check(s) ;
				function check(t){
					if (r === syncFn())
						passed += 1 ;
					else {
						console.log("FAIL",fileName,"\nactual   : ",r,"\nexpected : ",t) ;
						failed += 1 ;
					}
					if (passed+failed >= args.length)
						complete() ;
				}
			},function(x){
				console.log("ERROR",fileName,x) ;
				failed += 1 ;
				if (passed+failed >= args.length)
					complete() ;
			}) ;
		} catch (ex) {
			console.log("ERROR",fileName,ex) ;
			failed += 1 ;
			if (passed+failed >= args.length)
				complete() ;
		}
	} catch(ex) {
		console.log(fileName,"\tRequires a later version of nodejs to test",ex) ;
	}
})();

p.then(function(){
	console.log(passed+" test(s) passed") ;
	failed && console.log(failed+" test(s) FAILED") ;
},$error) ;