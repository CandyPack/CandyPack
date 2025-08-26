class Subdomain {
  async create(subdomain) {
    let domain = subdomain.split('.')
    subdomain = subdomain.trim().split('.')
    if (subdomain.length < 3) return Candy.server('Api').result(false, await __('Invalid subdomain name.'))
    if (Candy.core('Config').config.websites[domain.join('.')])
      return Candy.server('Api').result(false, await __('Domain %s already exists.', domain.join('.')))
    while (domain.length > 2) {
      domain.shift()
      if (Candy.core('Config').config.websites[domain.join('.')]) {
        domain = domain.join('.')
        break
      }
    }
    if (typeof domain == 'object') return Candy.server('Api').result(false, await __('Domain %s not found.', domain.join('.')))
    subdomain = subdomain.join('.').substr(0, subdomain.join('.').length - domain.length - 1)
    let fulldomain = [subdomain, domain].join('.')
    if (Candy.core('Config').config.websites[domain].subdomain.includes(subdomain))
      return Candy.server('Api').result(false, await __('Subdomain %s already exists.', fulldomain))
    Candy.server('DNS').record({name: fulldomain, type: 'A'}, {name: 'www.' + fulldomain, type: 'CNAME'}, {name: fulldomain, type: 'MX'})
    let websites = Candy.core('Config').config.websites
    websites[domain].subdomain.push(subdomain)
    websites[domain].subdomain.push('www.' + subdomain)
    websites[domain].subdomain.sort()
    Candy.core('Config').config.websites = websites
    Candy.server('SSL').renew(domain)
    return Candy.server('Api').result(true, await __('Subdomain %s created successfully for domain %s.', fulldomain, domain))
  }

  async list(domain) {
    if (!Candy.core('Config').config.websites[domain]) return Candy.server('Api').result(false, await __('Domain %s not found.', domain))
    let subdomains = Candy.core('Config').config.websites[domain].subdomain.map(subdomain => {
      return subdomain + '.' + domain
    })
    return Candy.server('Api').result(true, (await __('Subdomains of %s:', domain)) + '\n  ' + subdomains.join('\n  '))
  }
}

module.exports = new Subdomain()
