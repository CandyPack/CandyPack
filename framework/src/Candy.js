const Candy = {
    Config  : require('./Config.js'),
    Mysql   : require('./Mysql.js'),
    Route   : require('./Route.js'),
    Server  : require('./Server.js'),
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