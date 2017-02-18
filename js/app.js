var data = null;
var hero_to_player_popular = null;
var player_to_hero_popular = null;
function norm_vector(vec){
    vec = clean_vector(vec);
    var norm = Math.sqrt(vec.map(function(x){return x*x}).reduce(function(a, b){return a+b}, 0));
    return vec.map(function(x){return x / norm});
}

function clean_vector(vec){
    for(var idx in vec){
        if(vec[idx] < 5)
            vec[idx] = 0;
    }
    return vec;
}

function get_recency_weight(idx, N, p){
    return (p-1) * (N-idx) / N + 1;
}

function populate_player_vector(history, weight_recency){
    weight_recency = weight_recency || 1;
    var vector = new Array(data['heroes'].length);
    for(var i = 0; i < vector.length; i++)
        vector[i] = 0;
    for(var i = 0; i < history.length; i++){
        if(history[i])
            vector[history[i]] += get_recency_weight(i, history.length, weight_recency);
    }
    return vector;
}

function populate_player_space(){
    var players = data['players'];
    var players_obj = {};
    for(var i = 0; i < players.length; i++){
        players[i].vector = populate_player_vector(players[i].history);
        players[i].vector_norm = norm_vector(populate_player_vector(players[i].history, 2));
        players_obj[players[i].id] = players[i];
    }
    data['players'] = players_obj;
    console.log("populated player space");
}

function get_hero_history(player_id){
    var vector = new Array();
    $.ajax({
        url: 'http://api.opendota.com/api/players/'+player_id+'/matches?limit=500',
        dataType: 'json',
        async: false,
        success: function(data) {
            for(var i = 0; i < data.length; i++){
                vector.push(data[i]['hero_id']);
            }
        }
    });
    return vector;
}

function get_player_name(pid){
    var name = null;
    $.ajax({
        url: 'http://api.opendota.com/api/players/'+pid,
        dataType: 'json',
        async: false,
        success: function(data) {
            if(data['profile'])
                name = data['profile']['personaname']
        }
    });
    return name;
}

function debug_player(vector){
    var heroes = vector.map(function(x, idx){return [x, idx]});
    heroes.sort(function(x, y){return y[0] - x[0]});
    for(var x in heroes.splice(0, 5)){
        console.log(data['heroes'][heroes[x][1]] + ' ' + heroes[x][0]);
    }
}

function kneighbors(vector, k){
    k = k || 10;
    var scores = [];
    for(var pid in data['players']){
        scores.push([
            pid,
            vector.map(
                function(x, idx){return x*data['players'][pid].vector_norm[idx]}).reduce(function(x, y){return x+y}
                    , 0)
        ]
        );
    }
    scores.sort(function(x, y){return y[1]-x[1]});
    return scores.splice(0, k);
}

function linkify_twitch(x){
    var url = data['players'][x].twitch;
    return '<a target="_new" href="'+url+'">'+url+"</a>";
}

function linkify_player(pid){
    var url = "players/"+pid;
    return '<a href="'+url+'" onclick="router.navigate(event)">'+data['players'][pid].name+"</a>";
}

function linkify_hero(hid){
    var url = "heroes/"+hid;
    return '<a href="'+url+'" onclick="router.navigate(event)">'+data['heroes'][hid]+"</a>";
}

function populate_populars(){
    // popular heroes for a player
    player_to_hero_popular = {};
    for(var pid in data['players']){
        var tmpArr = [];
        for(var hid in data['players'][pid].vector){
            if(!data['heroes'][hid])continue;
            tmpArr.push([hid, data['players'][pid].vector[hid]]);
        }
        tmpArr.sort(function(x, y){return y[1] - x[1]});
        player_to_hero_popular[pid] = tmpArr;
    }

    // render players page
    var rows = []
    for(var pid in player_to_hero_popular){
        var summary = player_to_hero_popular[pid].slice(0, 5).map(
            function(x){return linkify_hero(x[0]) + " (x"+x[1]+")";}
        ).join(", ");
        var name = data['players'][pid].name;
        var twitch = linkify_twitch(pid);
        rows.push([name, "<tr><td>"+linkify_player(pid)+"</td><td>"+twitch+"</td><td>"+summary+"</td></tr>"])
    }
    rows.sort(function(x, y){return x[0].localeCompare(y[0]);});
    rows = rows.map(function(x){return x[1]});
    $('#players-table').append('<tbody>'+rows.join("")+'</tbody>');

    // popular players for a hero
    hero_to_player_popular = {};
    for(var hid in data['heroes']){
        if(!data['heroes'][hid])continue;
        var tmpArr = [];
        for(var pid in data['players']){
            tmpArr.push([pid, data['players'][pid].vector[hid]]);
        }
        tmpArr.sort(function(x, y){return y[1] - x[1]});
        hero_to_player_popular[hid] = tmpArr;
    }

    // render players page
    rows = []
    for(var hid in hero_to_player_popular){
        var summary = hero_to_player_popular[hid].slice(0, 5).map(
            function(x){return linkify_player(x[0]) + " (x"+x[1]+")";}
        ).join(", ");
        var name = data['heroes'][hid];
        rows.push([name, "<tr><td>"+linkify_hero(hid)+"</td><td>"+summary+"</td></tr>"])
    }
    rows.sort(function(x, y){return x[0].localeCompare(y[0]);});
    rows = rows.map(function(x){return x[1]});
    $('#heroes-table').append('<tbody>'+rows.join("")+'</tbody>');
}

function hide_all(){
    $('.container-fluid>.row').addClass("hidden");
    $('#error-user-data').addClass("hidden");
    $('#recommend button').removeClass("btn-info").addClass("btn-primary").text("Recommend!")
}
function render_players(){
    hide_all();
    $('#players').removeClass("hidden");
}
function render_heroes(){
    hide_all();
    $('#heroes').removeClass("hidden");
}
function render_recommend(id){
    hide_all();
    $('#recommend').removeClass("hidden");
}
function render_hero(url_arr){
    hide_all();
    var hid = url_arr[url_arr.length-2];
    $('#single-hero-table tbody').remove();
    $('#single-hero .name').text("Hero: " + data['heroes'][hid]);
    var rows = [];
    for(var idx in hero_to_player_popular[hid]){
        var pid = hero_to_player_popular[hid][idx][0];
        var cnt = hero_to_player_popular[hid][idx][1];
        if(cnt > 0)
            rows.push('<tr><td>'+linkify_player(pid)+'</td><td>'+cnt+'</td></tr>');
    }
    $('#single-hero-table').append('<tbody>'+rows.join("")+'</tbody>');
    $('#single-hero').removeClass("hidden");
}

function render_player(url_arr){
    hide_all();
    var pid = url_arr[url_arr.length-2];
    $('#single-player-table tbody').remove();
    $('#single-player .name').text("Player: " + data['players'][pid].name);
    $('#single-player .twitch').html(linkify_twitch(pid));
    var rows = [];
    for(var idx in player_to_hero_popular[pid]){
        var hid = player_to_hero_popular[pid][idx][0];
        var cnt = player_to_hero_popular[pid][idx][1];
        if(cnt > 0)
            rows.push('<tr><td>'+linkify_hero(hid)+'</td><td>'+cnt+'</td></tr>');
    }
    $('#single-player-table').append('<tbody>'+rows.join("")+'</tbody>');
    $('#single-player').removeClass("hidden");
}

function render_recommend_pid(url_arr){
    var pid = url_arr[url_arr.length-2];

    $('#recommend button').removeClass("btn-primary").addClass("btn-info").text("Fetching data and computing...")
    $('#reco-result-table tbody').remove();
    var name = get_player_name(pid);
    if(!name){
        $('#error-user-data').removeClass("hidden");
        $('#recommend button').removeClass("btn-info").addClass("btn-primary").text("Recommend!")
        return false;
    }

    var history = get_hero_history(pid);
    if(!history || history.length == 0){
        $('#error-user-data').removeClass("hidden");
        $('#recommend button').removeClass("btn-info").addClass("btn-primary").text("Recommend!")
        return false;
    }

    var vector = norm_vector(populate_player_vector(history, 2));
    var results = kneighbors(vector, 15);
    var rows = []
    for(var idx in results){
        var pid_2 = results[idx][0];
        var cnt = results[idx][1];
        var summary = data['players'][pid_2].vector_norm
            .map(function(x, idx){return [idx, x*vector[idx]];})
            .sort(function(x, y){return y[1] - x[1];})
            .slice(0, 5)
            .map(function(x){return linkify_hero(x[0]) + " (x"+data['players'][pid_2].vector[x[0]]+")";})
            .join(", ");
        rows.push('<tr><td>'+linkify_player(pid_2)+'</td><td>'+linkify_twitch(pid_2)+'</td><td>'+summary+'</td></tr>');
    }

    $('#reco-result-table').append('<tbody>'+rows.join("")+'</tbody>');

    $('#reco-result .name').text(name);
    hide_all();
    $('#reco-result').removeClass("hidden");
    $('#recommend button').removeClass("btn-info").addClass("btn-primary").text("Recommend!")
}

var routes = {
    '/': render_recommend,
    '/players': render_players,
    '/heroes': render_heroes,
    '/players/.*': render_player,
    '/heroes/.*': render_hero,
    '/recommend': render_recommend,
    '/recommend/.*': render_recommend_pid
}

var root = '/dota2-twitch-recommender/';

$.ajax({
    url: root + 'data.json',
    dataType: 'json',
    success: function(json){
        console.log("Data Fetched...")
        data = json;
        populate_player_space();
        populate_populars();
        initialize_router(routes, root)
    }
});


// UI bindings
$('#recommend-btn').click(function(){
    var pid = $('#input-reco').val().split('/').filter(function(x){return x.length > 0;});
    pid = pid[pid.length-1];
    router._navigate('recommend/'+pid);
});

$("#input-reco").keyup(function(event){
    if(event.keyCode == 13){
        $("#recommend-btn").click();
    }
});
