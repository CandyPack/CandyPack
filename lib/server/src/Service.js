const Config = require('./Config.js');

module.exports = {
    init: async function() {
        setInterval(function(){
            Config.load();
            return;
        }, 1000);
    }
};