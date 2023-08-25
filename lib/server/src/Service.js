module.exports = {
    init: async function() {
        setInterval(function(){
            console.log('Hello World');
            return;
        }, 1000);
    }
};