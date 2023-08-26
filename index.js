'use strict'

global.Candy = {
    _config: require(`${dir}/config.js`),
    Route  : require('./src/Route.js'),
    Server : require('./src/Server.js'),
    Mysql  : require('./src/Mysql.js')
};

module.exports = {
    init: function(){
        console.log('Candy is Starting!');
        Candy.Mysql.init();
        Candy.Route.init();
        Candy.Server.init();
    }
}