'use strict'

global.Candy = {
    _config: require(`${__dir}/config.js`),
    Route  : require('./src/Route.js'),
    Server : require('./src/Server.js'),
    Mysql  : require('./src/Mysql.js')
};

module.exports = {
    init: function(){
        Candy.Mysql.init();
        Candy.Route.init();
        Candy.Server.init();
    }
}