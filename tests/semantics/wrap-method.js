function AClass(name) {
	this.name = ":) "+name ;
	this.fail = ":( "+name ;
}

AClass.prototype.abc = async function(x) {
	if (x) {
		throw this.fail ;
	}
	return this.name ;
};

AClass.prototype.test1 = async function(x) {
	return this.abc(x) ;
} ;
AClass.prototype.test2 = async function(x) {
	return await this.abc(x) ;
};
AClass.prototype.test3 = async function(x) {
	return this.test1(x) ;
};
AClass.prototype.test4 = function(x) {
	return this.abc(x) ;
};
AClass.prototype.test5 = function(x) {
	return this.test1(x) ;
};

async function go() {
	var a = new AClass("mat") ;

	var passes = 0 ;
	for (var i=1; i<6; i++) {
		var fn = "test"+i ;
		
		if (await a[fn]()===a.name)
			passes += 1 ;
	}
	
	for (var i=1; i<6; i++) {
		fn = "test"+i ;
		try {
			await a[fn](1) ;
		} catch(ex) {
			if (ex===a.fail)
				passes += 1 ;
		}
	}
	return passes==10 ;
}

return go() ;