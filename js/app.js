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

var routes = {
    '/': render_recommend,
    '/players': render_players,
    '/heroes': render_heroes,
    '/recommend': render_recommend,
    '/recommend/.*': render_recommend
}
initialize_router(routes)
router.render()
