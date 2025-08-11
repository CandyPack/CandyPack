if (!global.trigger) global.trigger = 'cli'
global.completed = false

global.Candy = require('./src/Candy.js')

global.__ = (key, ...args) => Candy.Lang.get(key, ...args)
global.log = (...args) => Candy.Cli.log(...args)

Candy.init()
