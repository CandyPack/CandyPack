const fs = require('fs')

module.exports = {
  init: function (dir) {
    const envPath = (dir || __dir) + '/.env'
    if (!fs.existsSync(envPath)) return

    try {
      const envContent = fs.readFileSync(envPath, 'utf8')
      envContent.split('\n').forEach(line => {
        line = line.trim()
        if (!line || line.startsWith('#')) return

        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim()

          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }

          process.env[key] = value
        }
      })
    } catch (err) {
      console.error('Error reading .env file:', err.message)
    }
  },

  get: function (key, defaultValue) {
    return process.env[key] !== undefined ? process.env[key] : defaultValue
  }
}
