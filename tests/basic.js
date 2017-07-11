var NodentCompiler = require('..') ;
var c = new NodentCompiler() ;
try {
    c.compile("async () => 1+await x",null,null,{ sourcemap:false, promises: true, noRuntime: true, es6target: true }).code ;
    console.log("compiled") ;
} catch (ex) {
    console.error(ex) ;
}
