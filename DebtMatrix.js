class DebtMatrix{
    constructor(users){
        var users = [...new Set(users)];
        users.sort();
        this.dim = users.length;
        this.users = users;
        this.M = new Array(this.dim).fill(new Array(this.dim).fill(0));
    }
    
    get allDebts(){
        var debts = [];
        for(var i = 0;i<this.dim;i++){
            for(var j = 0;j<this.dim;j++){
                if(this.M[i][j] > 0){
                    debts.push({
                        debtor = this.users[i],
                        creditor = this.users[j],
                        amount = this.M[i][j],
                    })
                }
            }
        }
        return debts;
    }

    static add(A,B){
        var C = new DebtMatrix();
        var debts = A.allDebts.concat(B.allDebts);
        for(var d in debts){
            C = C.addDebt(d);
        }
        return C;
    }
    static sub(A,B){
        if(A.dim != B.dim)
            throw "dimensions mismatch";
        var C = new DebtMatrix(A.dim);
        for(var i = 0;i<A.dim;i++){
            for(var j = 0;j<A.dim;j++){
                C.M[i][j] = A.M[i][j]-B.M[i][j];
            }
        }
        return C;
    }

    get totalDebt(){
        return this.M.reduce((a,b) => a+b.reduce((c,d) => c+d,0),0);
    }
    get totalTransactions(){
        return this.M.reduce((a,b) => a+b.reduce((c,d) => c+(d>0?1:0),0),0);
    }
    userDebt(i){
        return this.M[i].reduce((a,b) => a+b,0);
    }
    userTransactions(i){
        return this.M[i].reduce((a,b) => a+(b>0?1:0),0);
    }

    uI(user){
        return this.users.indexOf(user);
    }

    hasUsers(newUsers){
        return newUsers.every(x => this.users.indexOf(x) >= 0);
    }
    
    expand(newUsers){
        var allUsers = [...this.users].concat([debt.debtor,debt.creditor]);
        var C = new DebtMatrix(allUsers);
        var debts = this.allDebts;
        for(var d in debts){
            C = C.addDebt(d);
        }        
    }

    addDebt(debt){
        var C = new DebtMatrix(this.users);
        if(!this.hasUsers([debt.creditor,debt.debtor])){
            C = this.expand([debt.creditor,debt.debtor]);
        }
        
    }

    addEqualEvent(payer,users,cost){
        var allUsers = [...this.users].concat(users);
        var m = new DebtMatrix(allUsers);
        for(var i = 0;i<users.length;i++){

        }
    }
}