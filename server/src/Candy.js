const { ChildProcess } = require('child_process');
const { cp } = require('fs');

class Candy {

    Api       = require('./Api.js');
    Cli       = require('./Cli.js');
    Client    = require('./Client.js');
    Config    = require('./Config.js');
    DNS       = require('./DNS.js');
    Lang      = require('./Lang.js');
    Mail      = require('./Mail.js');
    Server    = require('./Server.js');
    Service   = require('./Service.js');
    Subdomain = require('./Subdomain.js');
    SSL       = require('./SSL.js');
    Web       = require('./Web.js');

    ext = {
        acme            : require('acme-client'),
        axios           : require('axios'),
        childProcess    : require('child_process'),
        crypto          : require('crypto'),
        dns             : require('native-dns'),
        fs              : require('fs'),
        http            : require('http'),
        https           : require('https'),
        httpProxy       : require('http-proxy'),
        net             : require('net'),
        os              : require('os'),
        path            : require('path'),
        ps              : require('ps-node'),
        readline        : require('readline'),
        selfsigned      : require('selfsigned'),
        tls             : require('tls'),
    }
    
    async init(){
        await this.Lang.init();
        await this.Config.init();
        await this.Server.init();
        await this.Cli.init();
    }

}

module.exports = new Candy();