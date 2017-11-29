/* Test transformation by Babel;*/

//var core = require('@babel/babel-core') ;
var babylon = require('@babel/babylon');
var generate = require('@babel/babel-generator').default;
var visitKeys = require('@babel/babel-types').VISITOR_KEYS;

function printNode(ast) {
    return generate(ast,{}).code ;
}

function treeWalk(n,walker,state){
    if (!state) {
        state = [{self:n}] ;
        state.replace = function(pos,newNode) {
            state[pos].replace(newNode) ;
        }
    }

    function goDown(ref) {
        ref.replace = referencePrototypes.replace ;
        ref.append = referencePrototypes.append ;
        if (ref.index) {
            Object.defineProperties(ref, {index:{enumerable:true,get:referencePrototypes.index}}) ;
            ref.remove = referencePrototypes.removeElement ;
        } else {
            ref.remove = referencePrototypes.removeNode ;
        }
        state.unshift(ref) ;
        treeWalker(ref.self,walker,state) ;
        state.shift() ;
    }

    function descend() {
        if (!(n.type in visitKeys)) {
            // We don't know what type of node this is - it's not in the ESTree spec,
            // (maybe a 'react' extension?), so just ignore it
        } else {
            acornBase[n.type](n,state,function down(sub,_,derivedFrom){
                if (sub===n)
                    return acornBase[derivedFrom || n.type](n,state,down) ;

                var keys = Object.keys(n) ;
                for (var i=0; i<keys.length; i++){
                    var v = n[keys[i]] ;
                    if (Array.isArray(v)) {
                        if (v.indexOf(sub)>=0) {
                            goDown({
                                self:sub,
                                parent:n,
                                field:keys[i],
                                index:true
                            }) ;
                        }
                    } else if (v instanceof Object && sub===v) {
                        goDown({
                            self:sub,
                            parent:n,
                            field:keys[i]
                        }) ;
                    }
                }
            }) ;
        }
    } ;
    walker(n,descend,state) ;
    return n ;
}

var parseCache = {} ;
function partialParse(code,args) {
  if (!parseCache[code]) {
    parseCache[code] = babylon.parse(code) ;
  }

  var result = substitute(parseCache[code]) ;
  return {body:result.body, expr:result.body[0].type==='ExpressionStatement' ? result.body[0].expression : null} ;

  /* parse and substitute:
   * 
   *    $1      Substitute the specified expression. If $1 occupies a slot which is an array of expressions (e.g arguments, params)
   *            and the passed argument is an array, subtitute the whole set
   *    {$:1}   Substitute a single statement 
   * 
   */
  function substitute(src,dest) {
    if (Array.isArray(dest) && !Array.isArray(src))
        throw new Error("Can't substitute an array for a node") ;
    
    dest = dest || {} ;
    Object.keys(src).forEach(function(k){
      if (!(src[k] instanceof Object))
          return dest[k] = src[k] ;

      function moreNodes(v){ if (typeof v==="function") v = v() ; dest = dest.concat(v) ; return dest };
      function copyNode(v){ if (typeof v==="function") v = v() ; dest[k] = v ; return dest };

      // The src is an array, so create/grow the destination
      // It could an an array of expressions $1,$2,$3 or statements $:1;$:2;$:3;
      if (Array.isArray(src[k]))
          return dest[k] = substitute(src[k],[]) ;

      var p ;
      if (Array.isArray(dest)) 
          p = moreNodes ;
      else
          p = copyNode ;
          
      // Substitute a single identifier $.. with an expression (TODO: test provided arg is an expression node)
      if (src[k].type==='Identifier' && src[k].name[0]==='$') 
          return p(args[src[k].name.slice(1)]) ;

      // Substitute a single labeled statement $:.. with a statement (TODO: test provided arg is a statement node)
      if (src[k].type === 'LabeledStatement' && src[k].label.name==='$') { 
          var spec = src[k].body.expression ;
          return p(args[spec.name || spec.value]) ;
      }

      // Magic label to set call a function to modify a statement node  $$method: <statement>
      // The newNode = args.method(oldNode)
      if (src[k].type === 'LabeledStatement' && src[k].label.name.slice(0,2)==='$$') { 
          return p(args[src[k].label.name.slice(2)](substitute(src[k]).body)) ;
      }
      
      return p(substitute(src[k])) ;
    }) ;
    return dest ;
  }
}

var transform = require('../lib/arboriculture').transform ;

var sample = "async function mat(a) { return a+1 }" ;
var ast = babylon.parse(sample) ;
console.log(printNode(ast)) ;

var newAst = transform({
    filename:'SAMPLE',
    ast:ast
},{
    es6target:false,
    noRuntime:true,
    babelTree:true,
    $arguments:'$args',
    generatedSymbolPrefix:'$',
    engine:false,
    generators:false,
    promises:true,
    lazyThenables:false,
    wrapAwait:true,
    $return:'$return',
    $error:'$error'
},
console.log.bind(console),
{
    part:partialParse,
    treeWalker:treeWalk
},
printNode
).ast ;

console.log(printNode(newAst)) ;
