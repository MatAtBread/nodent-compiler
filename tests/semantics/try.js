async function breathe() {}

async function maybe(x) {
	await breathe() ;
	if (x>2) {
		JSON.parse("*") ;
		return -1 ;
	}
	else
		return x ;
}

async function test(x) {
	var s = "" ;
	for (var n=0; n<x; n++) {
		s += ("<") ;
		try {
			s += ("B") ;
			await maybe(n) ;
			s += ("C") ;
		} catch (ex) {
			s += ("X") ;
		}
		s += ("> ") ;
	}
	return s ;
}

return await test(5) == "<BC> <BC> <BC> <BX> <BX> ";

