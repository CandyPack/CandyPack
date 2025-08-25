class Candy {
  Cli = require('./Cli.js')
  Config = require('../../core/Config.js')
  Lang = require('../../core/Lang.js')
  Server = require('./Server.js')

  ext = {
    axios: require('axios'),
    childProcess: require('child_process'),
    crypto: require('crypto'),
    fs: require('fs'),
    os: require('os'),
    path: require('path'),
    process: require('find-process').default,
    readline: require('readline')
  }

  async init() {
    if (global.trigger == 'cli') this.server()
    await this.Lang.init()
    await this.Config.init()
    await this.Server.init()
    await this.Cli.init()
  }

  server() {
    this.Api = require('./Api.js')
    this.Client = require('./Client.js')
    this.DNS = require('./DNS.js')
    this.Mail = require('./Mail.js')
    this.Service = require('./Service.js')
    this.Subdomain = require('./Subdomain.js')
    this.SSL = require('./SSL.js')
    this.Web = require('./Web.js')

    this.ext.acme = require('acme-client')
    this.ext.bcrypt = require('bcrypt')
    this.ext.dns = require('native-dns')
    this.ext.http = require('http')
    this.ext.https = require('https')
    this.ext.httpProxy = require('http-proxy')
    this.ext.net = require('net')
    this.ext.selfsigned = require('selfsigned')
    this.ext.tls = require('tls')
  }
}

module.exports = new Candy()
