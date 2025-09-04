require('./Candy.js')

const path = require('path')

module.exports = {
  auth: {
    args: ['key'],
    description: 'Define your server to your CandyPack account'
  },
  debug: {
    description: 'Debug CandyPack Server',
    action: async () => Candy.cli('Cli').debug()
  },
  help: {
    description: 'List all available commands',
    action: async () => Candy.cli('Cli').help()
  },
  monit: {
    description: 'Monitor Website or Service',
    action: async () => Candy.cli('Cli').monitor()
  },
  restart: {
    description: 'Restart CandyPack Server',
    action: async () => Candy.cli('Cli').boot()
  },
  run: {
    args: ['file'],
    description: 'Add a new Service',
    action: async args => {
      let service = args[0]
      if (!service.startsWith('/') && !/^[a-zA-Z]:\\|^\\\\/.test(service)) {
        service = path.resolve() + '/' + service
      }
      await Candy.cli('Connector').call({action: 'service.start', data: [service]})
    }
  },

  mail: {
    title: 'MAIL',
    sub: {
      create: {
        description: 'Create a new mail account',
        action: async () =>
          await Candy.cli('Connector').call({
            action: 'mail.create',
            data: [
              await Candy.cli('Cli').question(__('Enter the e-mail address: ')),
              await Candy.cli('Cli').question(__('Enter the password: ')),
              await Candy.cli('Cli').question(__('Re-enter the password: '))
            ]
          })
      },
      delete: {
        description: 'Delete a mail account',
        action: async () =>
          await Candy.cli('Connector').call({
            action: 'mail.delete',
            data: [await Candy.cli('Cli').question(__('Enter the e-mail address: '))]
          })
      },
      list: {
        description: 'List all domain mail accounts',
        action: async () =>
          await Candy.cli('Connector').call({action: 'mail.list', data: [await Candy.cli('Cli').question(__('Enter the domain name: '))]})
      },
      password: {
        description: 'Change mail account password',
        action: async () =>
          await Candy.cli('Connector').call({
            action: 'mail.password',
            data: [
              await Candy.cli('Cli').question(__('Enter the e-mail address: ')),
              await Candy.cli('Cli').question(__('Enter the new password: ')),
              await Candy.cli('Cli').question(__('Re-enter the new password: '))
            ]
          })
      }
    }
  },
  ssl: {
    title: 'SSL',
    sub: {
      renew: {
        description: 'Renew SSL certificate for a domain',
        action: async () =>
          await Candy.cli('Connector').call({action: 'ssl.renew', data: [await Candy.cli('Cli').question(__('Enter the domain name: '))]})
      }
    }
  },
  subdomain: {
    title: 'SUBDOMAIN',
    sub: {
      create: {
        description: 'Create a new subdomain',
        action: async () =>
          await Candy.cli('Connector').call({
            action: 'subdomain.create',
            data: [await Candy.cli('Cli').question(__('Enter the subdomain name (subdomain.example.com): '))]
          })
      },
      list: {
        description: 'List all domain subdomains',
        action: async () =>
          await Candy.cli('Connector').call({
            action: 'subdomain.list',
            data: [await Candy.cli('Cli').question(__('Enter the domain name: '))]
          })
      }
    }
  },
  web: {
    title: 'WEBSITE',
    sub: {
      create: {
        description: 'Create a new website',
        action: async () => {
          let domain = await Candy.cli('Cli').question('Enter the domain name: ')
          let dir = path.resolve().replace(/\\/g, '/') + '/' + domain + '/'
          await Candy.cli('Connector').call({
            action: 'web.create',
            data: [domain, (await Candy.cli('Cli').question(__('Enter the path to the website (%s): ', dir))) ?? dir]
          })
        }
      },
      delete: {
        description: 'Delete a website',
        action: async () => {
          let domain = await Candy.cli('Cli').question('Enter the domain name: ')
          await Candy.cli('Connector').call({
            action: 'web.delete',
            data: [domain]
          })
        }
      },
      list: {
        description: 'List all websites',
        action: async () => await Candy.cli('Connector').call({action: 'web.list'})
      }
    }
  }
}
