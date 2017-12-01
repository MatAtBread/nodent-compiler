/* Test transformation by Babel;*/

var fs = require('fs') ;
var babylon = require('@babel/babylon');
var generate = require('@babel/babel-generator').default;
var visitKeys = require('@babel/babel-types').VISITOR_KEYS;

function printNode(ast) {
    return generate(ast,{}).code ;
}

function forEachNodeKey(n,down){
	visitKeys[n.type].forEach(function(member){
	    var examine = n[member] ;
	    if (Array.isArray(examine)) {
			examine.forEach(function(x){ if (x) down(x) }) ;
	    } else {
			if (examine) down(examine);
	    }
	}) ;
}

function nodeKeys(n) {
    return n ? visitKeys[n.type]:null ;
}

function parse(code) {
	return babylon.parse(code,{
		allowImportExportEverywhere:true,
		allowReturnOutsideFunction:true,
		allowSuperOutsideMethod:true
	}).program ;
}

function loc(old,repl){
    ['start','end','loc','range'].forEach(function(k){
        if (k in old && !(k in repl))
            repl[k] = old[k] ;
    }) ;
}

var referencePrototypes = {
    replace: function(newNode) {
        if (Array.isArray(newNode) && newNode.length===1) newNode = newNode[0] ;
        if ('index' in this) {
            loc(this.parent[this.field][this.index], newNode);
            if (Array.isArray(newNode)) {
                [].splice.apply(this.parent[this.field],[this.index,1].concat(newNode)) ;
            } else {
                this.parent[this.field][this.index] = newNode ;
            }
        } else {
            loc(this.parent[this.field], newNode);
            if (Array.isArray(newNode)) {
                this.parent[this.field] = {type:'BlockStatement',body:newNode} ;
            } else {
                this.parent[this.field] = newNode ;
            }
        }
        return this.self ;
    },
    append: function(newNode) {
        if (Array.isArray(newNode) && newNode.length===1) newNode = newNode[0] ;
        if ('index' in this) {
            if (Array.isArray(newNode)) {
                [].splice.apply(this.parent[this.field],[this.index+1,0].concat(newNode)) ;
            } else {
                this.parent[this.field].splice(this.index+1,0,newNode) ;
            }
        } else {
            throw new Error("Cannot append Element node to non-array") ;
        }
        return this.self ;
    },
    index: function(){
        return this.parent[this.field].indexOf(this.self) ;
    },
    removeElement: function() {
        return this.parent[this.field].splice(this.index,1)[0] ;
    },
    removeNode: function() {
        var r = this.parent[this.field] ;
        delete this.parent[this.field] ;
        return r ;
    }
};

function treeWalker(n,walker,state){
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
        var keys = nodeKeys(n) ;
        if (!keys) {
            // We don't know what type of node this is - it's not in the ESTree spec,
            // (maybe a 'react' extension?), so just ignore it
        } else {
            forEachNodeKey(n,function down(sub){
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
    parseCache[code] = parse(code) ;
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

for (let fileName of process.argv.slice(2)) {
	var sample = '(async function _(){ '+fs.readFileSync(fileName).toString()+'})';

	try {
		var ast = parse(sample);
//		console.log(printNode(ast)) ;

		var newAst = transform({
			filename:fileName,
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
			treeWalker:treeWalker
		},
		printNode
		).ast ;

		Promise.all([sample,printNode(ast),printNode(newAst)].map(code => eval(code)())).then(
				r => console.log(fileName,r && r[0]==r[1] && r[1]==r[2]),
				ex => console.log(fileName,ex)
		) ;

		//console.log(printNode(newAst)) ;
	} catch (ex) {
		console.log(fileName,ex) ;
	}
}