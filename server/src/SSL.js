const {log, error} = Candy.server('Log', false).init('SSL')

const acme = require('acme-client')
const fs = require('fs')
const os = require('os')
const selfsigned = require('selfsigned')

class SSL {
  #checking = false
  #checked = {}

  async check() {
    if (this.#checking || !Candy.core('Config').config.websites) return
    this.#checking = true
    this.#self()
    for (const domain of Object.keys(Candy.core('Config').config.websites)) {
      if (Candy.core('Config').config.websites[domain].cert === false) continue
      if (
        !Candy.core('Config').config.websites[domain].cert?.ssl ||
        Date.now() + 1000 * 60 * 60 * 24 * 30 > Candy.core('Config').config.websites[domain].cert.ssl.expiry
      )
        await this.#ssl(domain)
    }
    this.#checking = false
  }

  renew(domain) {
    if (domain.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/))
      return Candy.server('Api').result(false, __('SSL renewal is not available for IP addresses.'))
    if (!Candy.core('Config').config.websites[domain]) {
      for (const key of Object.keys(Candy.core('Config').config.websites)) {
        for (const subdomain of Candy.core('Config').config.websites[key].subdomain)
          if (subdomain + '.' + key == domain) {
            domain = key
            break
          }
      }
      if (!Candy.core('Config').config.websites[domain]) return Candy.server('Api').result(false, __('Domain %s not found.', domain))
    }
    this.#ssl(domain)
    return Candy.server('Api').result(true, __('SSL certificate for domain %s renewed successfully.', domain))
  }

  #self() {
    let ssl = Candy.core('Config').config.ssl ?? {}
    if (ssl && ssl.expiry > Date.now() && ssl.key && ssl.cert && fs.existsSync(ssl.key) && fs.existsSync(ssl.cert)) return
    log('Generating self-signed SSL certificate...')
    const attrs = [{name: 'commonName', value: 'CandyPack'}]
    const pems = selfsigned.generate(attrs, {days: 365, keySize: 2048})
    if (!fs.existsSync(os.homedir() + '/.candypack/cert/ssl')) fs.mkdirSync(os.homedir() + '/.candypack/cert/ssl', {recursive: true})
    let key_file = os.homedir() + '/.candypack/cert/ssl/candypack.key'
    let crt_file = os.homedir() + '/.candypack/cert/ssl/candypack.crt'
    fs.writeFileSync(key_file, pems.private)
    fs.writeFileSync(crt_file, pems.cert)
    ssl.key = key_file
    ssl.cert = crt_file
    ssl.expiry = Date.now() + 86400000
    Candy.core('Config').config.ssl = ssl
  }

  async #ssl(domain) {
    if (this.#checked[domain]?.interval > Date.now()) return
    const accountPrivateKey = await acme.forge.createPrivateKey()
    const client = new acme.Client({
      directoryUrl: acme.directory.letsencrypt.production,
      accountKey: accountPrivateKey
    })
    let subdomains = [domain]
    for (const subdomain of Candy.core('Config').config.websites[domain].subdomain ?? []) subdomains.push(subdomain + '.' + domain)
    const [key, csr] = await acme.forge.createCsr({
      commonName: domain,
      altNames: subdomains
    })
    let cert
    try {
      log('Requesting SSL certificate for domain %s...', domain)
      cert = await client.auto({
        csr,
        termsOfServiceAgreed: true,
        challengePriority: ['dns-01'],
        challengeCreateFn: async (authz, challenge, keyAuthorization) => {
          return new Promise(resolve => {
            if (challenge.type == 'dns-01') {
              Candy.server('DNS').record({
                name: '_acme-challenge.' + authz.identifier.value,
                type: 'TXT',
                value: keyAuthorization,
                ttl: 100,
                unique: true
              })
            }
            return resolve()
          })
        },
        challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
          return new Promise(resolve => {
            if (challenge.type == 'dns-01') {
              Candy.server('DNS').delete({
                name: '_acme-challenge.' + authz.identifier.value,
                type: 'TXT',
                value: keyAuthorization
              })
              return resolve()
            }
            return resolve()
          })
        },
        challengeKeyAuthorizationFn: async (challenge, keyAuthorization) => {
          return keyAuthorization
        },
        challengeTimeoutFn: async () => {
          return new Promise(resolve => {
            resolve()
          })
        }
      })
    } catch (e) {
      if (!this.#checked[domain]) this.#checked[domain] = {error: 0}
      if (this.#checked[domain].error < 5) this.#checked[domain].error = this.#checked[domain] ? this.#checked[domain].error + 1 : 1
      this.#checked[domain].interval = this.#checked[domain].error * 1000 * 60 * 5 + Date.now()
      error(e)
      return
    }
    if (!cert) return
    delete this.#checked[domain]
    if (!fs.existsSync(os.homedir() + '/.candypack/cert/ssl')) fs.mkdirSync(os.homedir() + '/.candypack/cert/ssl', {recursive: true})
    fs.writeFileSync(os.homedir() + '/.candypack/cert/ssl/' + domain + '.key', key)
    fs.writeFileSync(os.homedir() + '/.candypack/cert/ssl/' + domain + '.crt', cert)
    let websites = Candy.core('Config').config.websites ?? {}
    let website = websites[domain]
    if (!website) return
    if (!website.cert) website.cert = {}
    website.cert.ssl = {
      key: os.homedir() + '/.candypack/cert/ssl/' + domain + '.key',
      cert: os.homedir() + '/.candypack/cert/ssl/' + domain + '.crt',
      expiry: Date.now() + 1000 * 60 * 60 * 24 * 30 * 3
    }
    websites[domain] = website
    Candy.core('Config').config.websites = websites
  }
}

module.exports = new SSL()
