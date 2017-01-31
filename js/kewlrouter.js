var WILDCARD = 0;
var VALUE = 0;
function parse_handler(handler){
    var parsed_handler = {}
    for(key in handler){
        key = key.split("/").filter(function(x){return x.length > 0});
        key.push(""):
        var cur_handler = parsed_handler;
        for(var i = 0;i<key.length;i++){
            if(key[i]=="*"){

            }
        }
    }
}
function KewlRouter(handler){
    this.handler = handler;
}
