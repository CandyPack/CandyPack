module.exports = {
    init: function(){
        global.Candy = this.instance();
        global.Candy.Config.init();
        global.Candy.Mysql.init();
        global.Candy.Route.init();
        global.Candy.Server.init();
        global.Candy.instance = this.instance;
    },

    instance(id, req, res){
        return {
            // Classes
            Config  : Candy.Config ?? require('./Config.js'),
            Mysql   : Candy.Mysql  ?? require('./Mysql.js'),
            Request : new (require('./Request.js'))(id, req, res),
            Route   : Candy.Route  ?? require('./Route.js'),
            Server  : Candy.Server ?? require('./Server.js'),
            Token   : new (require('./Token.js'))(id),
            View    : new (require('./View.js'))(id),
    
            // Shortcuts
            cookie   : function(key, value){ return this.Request.cookie(key, value)                       },
            return   : function(data)      { return this.Request.end(data)                                },
            token    : function(hash)      { return hash ? this.Token.check(hash) : this.Token.generate() },
            var      : function(value)     { return this.Var.init(value);                                 },
        };
    }
}