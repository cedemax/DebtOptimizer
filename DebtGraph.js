class DebtGraph{
    constructor(){
        this.nodes = [];
        this.edges = [];
    }
    addUser(user){
        if(!this.nodes.some(x => x.name == user)){
            this.nodes.push(new DebtNode(user));
        }
        return this.nodes.find(x => x.name == user);
    }
    addDebt(debt){
        var d = this.addUser(debt.debtor);
        var c = this.addUser(debt.creditor);
        var nd = new DebtEdge(d,c,debt.amount);
        if(nd.amount < 0)
            nd = nd.inverse;
        var od = this.edges.findIndex(x => x.debtor == nd.debtor && x.creditor == nd.creditor);
        if(od < 0){
            this.edges.push(nd);
        }else{
            this.edges[od] = DebtEdge.add(this.edges[od],nd);
        }
    }

    modifyDebt(edge,amount){
        var e = this.edges.findIndex(x => x.debtor == edge.debtor && x.creditor == edge.creditor);
        if(e == null){
            throw "Edge not found";
        }
        this.edges[e].amount += amount;
    }

    clean(){
        this.edges = this.edges.filter(x => Math.abs(x.amount) > 0.001);
    }

    simplify(){
        var md = 2;
        var found = false;
        while(true){
            found = false;
            for(var i = 0;i<this.nodes.length;i++){
                var l = this.findLoop(md);
                if(l != null){
                    console.log(l);
                    found = true;
                    this.reduceLoop(l);
                    this.clean();
                    break;
                }
            }
            if(found == false){
                md++;
                if(md > 10)
                    break;
            }
        }
    }
/*
    simplify(){
        var md = 2;
        var found = false;
        while(true){
            found = false;
            for(var i = 0;i<this.nodes.length;i++){
                var l = this.findLoops(this.nodes[i],[],0,md);
                if(l.length > 0){
                    found = true;
                    l.sort((a,b) => a.length-b.length);
                    this.reduceLoop(l[0]);
                    this.clean();
                    break;
                }
            }
            if(found == false){
                md++;
                if(md > 8)
                    break;
            }
        }
        var es = this.edges.length;
        found = false;
        while(true){
            found = false;
            for(var i = 0;i<this.nodes.length;i++){
                this.reduceEqualTransfers(this.nodes[i]);
                this.clean();
                if(this.edges.length < es){
                    found = true; break;
                }
            }
            if(found == false)
                break;
        }

        this.clean();
       
    }
*/

    reduceLoop(loop){
        // find the smallest debt in the loop and move it
        var min = Math.min(...loop.map(x => x.amount));
        var minI = loop.findIndex(x => x.amount == min);
        if(loop.length == 2){   // trivial case
            this.modifyDebt(loop[(minI+1)%loop.length],-min);
            this.modifyDebt(loop[minI],-min);
            return;
        }
        var dir = loop[(minI+1)%loop.length].connected(loop[minI].creditor)?1:-1;
        var start = loop[minI].debtor;
        var current = loop[minI].debtor;
        var i = 0; var j = minI;
        while(i++ < loop.length){
            if(loop[j].debtor == current){
                this.modifyDebt(loop[j],-min)
            }else{
                this.modifyDebt(loop[j],min)
            }
            current = loop[j].other(current);
            var j= (j+dir+loop.length)%loop.length;
        }
    }

    reduceEqualTransfers(current){
        var C = this.edges.filter(x => x.connected(current))
        if(C.length == 0)
            return;
        var debts = C.filter(x => x.debtor == current);
        var credits = C.filter(x => x.creditor == current);
        if(debts.length == 0 || credits.length == 0)
            return;
        for(var i = 0;i<debts.length;i++){
            for(var j = 0;j<credits.length;j++){
                if(debts[i].amount == credits[j].amount){
                    this.addDebt({
                        debtor:credits[j].debtor.name,
                        creditor:debts[i].creditor.name,
                        amount:credits[j].amount,
                    })
                    this.modifyDebt(credits[j],-credits[j].amount);
                    this.modifyDebt(debts[i],-debts[i].amount);
                }
            }
        }
    }

    findLoop(maxDepth){
        for(var i = 0;i<this.edges.length;i++){
            var loop = this._findLoop(1,[this.edges[i]],0,maxDepth);
            if(loop != null)
                return loop;
        }
    }
    _findLoop(dir,path,depth,maxDepth){
        if(depth > maxDepth)
            return null;
        var cons = [];
        var end = dir>0?path[path.length-1].creditor:path[path.length-1].debtor;
        cons = this.edges.filter(x => path.indexOf(x) < 0 &&  x.connected(end));
        
        if(cons.length == 0)
            return null;
        for(var i = 0;i<cons.length;i++){
            for(var j = 0;j<path.length-1;j++){
                if(path[j].connected(cons[i].other(end))){
                    var sliced = path.slice(j,path.length).concat(cons[i]);
                    console.log("Slice : "+sliced.length);
                    if(sliced.length == 2)
                        return sliced;
                    console.log("Slice : "+sliced.length);
                    if(sliced[sliced.length-1].connected(sliced[1].connection(sliced[0]))){
                        sliced = sliced.slice(1,sliced.length);
                    }
                    console.log("After : "+sliced.length);
                    return sliced;
                }
            }
            var ndir = (cons[i].other(end) == cons[i].creditor)?1:-1
            var next = this._findLoop(ndir,path.concat(cons[i]),depth+1,maxDepth);
            if(next != null)
                return next;
        }
        return null;
    }

    findLoops(current,path,depth,maxDepth){
        if(depth > maxDepth)
            return [];
        var loops = [];
        var C = this.edges.filter(x =>path.indexOf(x) < 0 && x.debtor == current);
        if(path.length != 0){
            C = this.edges.filter(x => path.indexOf(x) < 0 && x.connected(current));
        }
        for(var i = 0;i<C.length;i++){
            if(!path.some(x => x.connected(C[i].other(current)))){
                var np = path.concat([C[i]]);
                loops.push(...this.findLoops(C[i].other(current),np,depth+1));
            }else{
                var start = this.findLast(path,x => x.connected(C[i].other(current)));
                var np = path.slice(start,path.length).concat([C[i]]);
                loops.push(np);
            }
            if(loops.length > 0){
                //return loops;
            }
        }
        return loops;
    }

    findLast(path,f){
        for(var i = path.length-1;i>=0;i--){
            if(f(path[i]))
                return i;
        }
        return -1;
    }

    getDebt(person){
        var debt = 0;
        this.edges.forEach(function(x){
            if(x.debtor.name == person){
                debt+=x.amount;
            }else if(x.creditor.name == person){
                debt-=x.amount;
            }
        })
        return debt;
    }
    
    static parse(json){
        var obj = JSON.parse(json);
        var G = new DebtGraph();
        for(var i = 0;i<obj.nodes.length;i++){
            G.addUser(obj.nodes[i].name);
        }
        for(var i = 0;i<obj.edges.length;i++){
            G.addDebt({
                debtor : obj.edges[i].debtor.name,
                creditor : obj.edges[i].creditor.name,
                amount : obj.edges[i].amount,
            })
        }
        return G;
    }

}

class DebtNode{
    constructor(name){
        this.name = name;
    }
}

class DebtEdge{
    constructor(debtor,creditor,amount){
        this.debtor = debtor;
        this.creditor = creditor;
        this.amount = amount;
    }

    get inverse(){
        return new DebtEdge(this.creditor,this.debtor,-this.amount);
    }

    get positive(){
        if(this.amount<0)
            return this.inverse;
        return this.clone;
    }

    get clone(){
        return new DebtEdge(this.debtor,this.creditor,this.amount);
    }
    static add(A,B){
        if(A.creditor == B.creditor && A.debtor == B.debtor){
            return new DebtEdge(A.debtor,A.creditor,A.amount+B.amount).positive;
        }else if(A.creditor == B.debtor && A.debtor == B.creditor){
            return new DebtEdge(A.debtor,A.creditor,A.amount-B.amount).positive;
        }
        throw "Debts cant be reduced";
    }
    isOrdered(){
        return this.debtor.name < this.creditor.name;
    }
    toString(){
        return this.debtor.name +" owes "+this.amount+" to "+this.creditor.name;
    }

    connected(node){
        return node == this.creditor || node == this.debtor;
    }
    connection(other){
        if(this.debtor == other.debtor ||this.debtor == other.creditor)
            return this.debtor;
        if(this.creditor == other.debtor ||this.creditor == other.creditor)
            return this.creditor;
        return null;
    }
    other(node){
        if(node == this.creditor)
            return this.debtor;
        if(node == this.debtor)
            return this.creditor;
        throw "debt does not belong to node";
    }

    get debt(){
        return {
            debtor:this.debtor.name,
            creditor:this.creditor.name,
            amount:this.amount,
        }
    }
}