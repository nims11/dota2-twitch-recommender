var data = null;
var hero_to_player_popular = null;
var player_to_hero_popular = null;
function norm_vector(vec){
    var norm = Math.sqrt(vec.map(function(x){return x*x}).reduce(function(a, b){return a+b}, 0));
    return vec.map(function(x){return x / norm});
}

function populate_player_space(){
    var players = data['players'];
    var players_obj = {};
    for(var i = 0; i < players.length; i++){
        players[i].vector_norm = norm_vector(players[i].vector);
        players_obj[players[i].id] = players[i];
    }
    data['players'] = players_obj;
    console.log("populated player space");
}

function get_hero_vector(player_id){
    var vector = new Array();
    for(var i = 0; i < data['heroes'].length; i++)
        vector[i] = 0.0;
    $.ajax({
        url: 'http://api.opendota.com/api/players/'+player_id+'/matches?limit=500',
        dataType: 'json',
        async: false,
        success: function(data) {
            for(var i = 0; i < data.length; i++){
                vector[data[i]['hero_id']] += 1;
            }
        }
    });
    return vector;
}

function debug_player(vector){
    var heroes = vector.map(function(x, idx){return [x, idx]});
    heroes.sort(function(x, y){return y[0] - x[0]});
    for(var x in heroes.splice(0, 5)){
        console.log(data['heroes'][heroes[x][1]] + ' ' + heroes[x][0]);
    }
}

function kneighbors(pid, k){
    k = k || 10;
    var vector = norm_vector(get_hero_vector(pid));
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
    var kneigh = scores.splice(0, k);
    debug_player(vector);
    for(var x = 0; x < k;x++){
        console.log(kneigh[x]);
        console.log(data['players'][kneigh[x][0]]);
        debug_player(data['players'][kneigh[x][0]].vector);
    }
    return kneigh;
}

function linkify_twitch(x){
    return '<a href="'+x+'">'+x+"</a>";
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
        var twitch = linkify_twitch(data['players'][pid].twitch);
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
    $('.container-fluid .row').addClass("hidden");
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
    $('#single-player .twitch').html(linkify_twitch(data['players'][pid].twitch));
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

var routes = {
    '/': render_recommend,
    '/players': render_players,
    '/heroes': render_heroes,
    '/players/.*': render_player,
    '/heroes/.*': render_hero,
    '/recommend': render_recommend,
    '/recommend/.*': render_recommend
}
$.ajax({
    url: '/data.json',
    dataType: 'json',
    async: false,
    success: function(json){
        console.log("Data Fetched...")
        data = json;
        populate_player_space();
        populate_populars();
        initialize_router(routes)
        router.render()
    }
});
