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

var data = null;
function norm_vector(vec){
    var norm = Math.sqrt(vec.map(function(x){return x*x}).reduce(function(a, b){return a+b}, 0));
    return vec.map(function(x){return x / norm});
}

function populate_player_space(){
    var players = data['players'];
    var players_obj = {};
    for(var i = 0; i < players.length; i++){
        players[i].vector = norm_vector(players[i].vector);
        players_obj[players[i].id] = players[i];
    }
    data['players'] = players_obj;
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
            vector = norm_vector(vector);
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
                function(x, idx){return x*data['players'][pid].vector[idx]}).reduce(function(x, y){return x+y}
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

$.getJSON("/data.json", function(json){
    console.log("Data Fetched...")
    data = json;
    populate_player_space();
});

var routes = {
    '/': render_recommend,
    '/players': render_players,
    '/heroes': render_heroes,
    '/recommend': render_recommend,
    '/recommend/.*': render_recommend
}
initialize_router(routes)
router.render()
