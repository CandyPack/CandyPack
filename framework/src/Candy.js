const Candy = {
    Config  : require('./Config.js'),
    Route   : require('./Route.js'),
    Server  : require('./Server.js'),
    Mysql   : require('./Mysql.js'),
    var     : function(value){
        const variable = require('./Var.js');
        return variable.init(value);
    },
};

module.exports = {
    init: function(){
        global.Candy = Candy;
        global.Candy.Config.init();
        global.Candy.Mysql.init();
        global.Candy.Route.init();
        global.Candy.Server.init();
    }
}