async function n(m) {
	return m ;
}

var {a,b}={a:1,b:2} ;
var [c,d]=[3,4] ;
return await n(3)===a+b && await n(7)===c+d ;
