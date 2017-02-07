var router;
function parse_url(url, regex){
    regex = regex || false;
    var url_arr = url.split("/").filter(
        function(x){return x.length > 0}
    );
    url_arr.push("");
    if(regex){
        url_arr = url_arr.map(function(x){return "^"+x+"$";})
    }
    return url_arr;
}

function parse_handler(handler){
    var parsed_handler = {}
    for(key in handler){
        var url_arr = parse_url(key, true);
        var cur_handler = parsed_handler;
        for(var i = 0;i<url_arr.length;i++){
            if(!cur_handler[url_arr[i]]){
                if(i != url_arr.length - 1)
                    cur_handler[url_arr[i]] = {}
                else
                    cur_handler[url_arr[i]] = handler[key];
            }
            cur_handler = cur_handler[url_arr[i]];
        }
    }
    return parsed_handler;
}

function KewlRouter(handler){
    this.root = '';
    this.handler = parse_handler(handler);
    this.render = function(){
        var pathname = window.location.pathname;
        var cur_handler = this.handler;
        var url_arr = parse_url(pathname, false);
        for(var i = 0; i < url_arr.length; i++){
            var found = false;
            for(var key in cur_handler){
                if(new RegExp(key).test(url_arr[i])){
                    cur_handler = cur_handler[key];
                    found = true;
                    break;
                }
            }
            if(!found) return false;
        }
        if(typeof(cur_handler) == "function"){
            cur_handler(url_arr);
            return true;
        }else
            return false;
    }
    this.navigate = function(e){
        var target = e.target.href;
        history.pushState(null, null, this.root + target);
        this.render();
        e.preventDefault();
        return false;
    }
}

function initialize_router(handler){
    router = new KewlRouter(handler);
}
