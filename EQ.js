
var persons = [];

$(document).ready(function(){
    load();
    parse();
    if(persons == null)
        persons = [];
    var html = "<th>Event</th><th>Payee</th><th>Amount</th><th>"+persons.join("</th><th>")+"</th><th>"
    html+="</th>";
    $('#header').html(html);
    $('#add').click(function(){addRow();})
    $('#person').click(function(){addPerson();})
    $('#clear').click(function(){clear();})
    $('#analyse').click(function(){G.simplify();$('#matrix').html(matrix());})
   
})

function clear(){
    $.localStorage.setItem("save",null); 
    $.localStorage.setItem("persons",JSON.stringify([])); 
    location.reload();

}

$(document).on('click','.a',function(){
    $(this).toggleClass('active');
    parse();
})
$(document).on('change','input',parse);
$(document).on('change','select',parse);

function addPerson(){
    var name = $('#newguy').val();
    persons.push(name);
    parse();
    location.reload();
}

function parse(){
    G = new DebtGraph();
    var rows = $('.event');
    var R = [];
    for(var i = 0;i<rows.length;i++){
        console.log("A");
        var row = $(rows[i]);
        var payee = row.find('select').val();
        var amount = parseFloat(row.find('input[type="number"]').val());
        var event = row.find('input[type="text"]').val();
        var users = [];
        row.find('.active').each(function(x,e){users.push($(e).html())});
        var payees = users.length;
        for(var j = 0;j<users.length;j++){
            if(users[j] != payee){
                G.addDebt({
                    debtor : users[j],
                    creditor : payee,
                    amount : amount/(payees),
                })
            }
        }
        R.push({
            event : event,
            payee : payee,
            amount : amount,
            users : users,
        })
    }
    console.log(R);
    //G.simplify();
    //$('#alldebts').html(allDebts())
    save(R);
}

function save(R){
    $.localStorage.setItem("save",JSON.stringify(R));
    $.localStorage.setItem("persons",JSON.stringify(persons));
}
function load(){
    var save = $.localStorage.getItem("save");
    var ps = $.localStorage.getItem("persons");
    persons = JSON.parse(ps);
    if(save != null){
        var R = JSON.parse(save);
        if(R != null){
            for(var i = 0;i<R.length;i++){
                addRow(i);
                $('#row'+i).find('input[type="text"]').val(R[i].event);
                $('#row'+i).find('input[type="number"]').val(R[i].amount);
                $('#row'+i).find('select').val(R[i].payee);
                var a = $('#row'+i).find('.a');
                for(var j = 0;j<a.length;j++){
                    if(R[i].users.indexOf($(a[j]).html())>=0){
                        $(a[j]).addClass('active');
                    }
                }
            }
            return;
        }
    }
    addRow(0);
}

function matrix(){
    var html = "";
    html+= "<h3>Who pays who</h3>";
    html += '<table class="table">';
    html+="<tr><th>Person A</th><th>Pays</th><th>Person B</th></tr>";
    G.edges.forEach(x => html+="<tr><td>"+x.debtor.name+"</td><td>"+Math.round(100*x.amount)/100+"</td><td>"+x.creditor.name+"</td></tr>");
    html+="</table>";
    return html;
}

function allDebts(){
    var html = '<table class="table">';
    persons.forEach(x => html+="<tr><td>"+x+"</td><td>"+G.getDebt(x)+"</td></tr>")
    html+="</table>";
    return html;
}

function addRow(i){
    html = '<tr id="row'+i+'" class="event"><td><input type="text" placeholder="event" style="width:100px" id="e"></td><td><select id="u"><option>'+persons.join("</option><option>")+'</option></select></td><td><input type="number" value="0" style="width:50px;"></td><td><div class="a">'+persons.join('</div></td><td><div class="a">')+'</div></td></tr>';
    $('#addRow').before(html);
}
