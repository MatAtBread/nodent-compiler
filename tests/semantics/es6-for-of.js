async function pushAsync(a,v) {
    a.push(v) ;
}

async function log() {
    console.log.apply(console,arguments) ;
}

async function iterate(iterable) {
    var j,b=[],c=[],d=[],e=[] ;

    for (var i of iterable()) b.push(i) ;
    b.push(i);
    for (var i of iterable()) await pushAsync(c,i);
    await pushAsync(c,i);
    for (j of iterable()) d.push(j) ;
    d.push(j);
    for (j of iterable()) await pushAsync(e,j);
    await pushAsync(e,j);

    var n = 0;
    for (var m of iterable()) {
        if (m != b[n]) return false ;
        if (m != c[n]) return false ;
        if (m != d[n]) return false ;
        if (m != e[n]) return false ;
        n += 1 ;
    }
    if (b[n] != i) return false ;
    if (d[n] != j) return false ;
    if (b[n] != c[n]) return false ;
    if (d[n] != e[n]) return false ;
    
    return true ;
}

function* myGen() {
    var x = "The quick brown fox jumps over the lazy dog".split(" ") ;
    yield null ;
    for (var i of x)
        yield i ;
    yield undefined ;
    yield '' ;
}

return await iterate(()=>[4,3,undefined,2,1])
    && await iterate(myGen)  ;
