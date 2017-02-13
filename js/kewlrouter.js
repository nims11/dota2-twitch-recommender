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

function get_relative_path(path_arr, root_arr){
    if(path_arr.length < root_arr.length){
        return null;
    }
    for(var idx = 0; idx < root_arr.length - 1; idx++){
        if(path_arr[idx] != root_arr[idx])
            return null;
    }
    return path_arr.slice(root_arr.length-1, path_arr.length);
}

function KewlRouter(handler, root){
    this.root = root || '/';
    this.root_arr = parse_url(root);
    this.handler = parse_handler(handler);
    this.cur_path = function(){
        return get_relative_path(parse_url(window.location.pathname, false), this.root_arr);
    }

    this.render = function(){
        var cur_handler = this.handler;
        var url_arr = this.cur_path();
        if(url_arr == null)
            return false;

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

    this._navigate = function(path){
        history.pushState(null, null, this.root + path);
    }

    this.navigate = function(e){
        var target = e.target.attributes["href"].value;
        e.preventDefault();
        this._navigate(target);
    }

    this.monitor = function(){
        var cur = null;
        var self = this;
        setInterval(function(){
            var new_path = self.cur_path().join();
            if(cur !== new_path){
                cur = new_path;
                self.render();
            }
        }, 50);
    }
}

function initialize_router(handler, root){
    router = new KewlRouter(handler, root);
    router.monitor();
}
