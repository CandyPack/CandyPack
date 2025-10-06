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

        const separatorIndex = line.indexOf('=')
        if (separatorIndex === -1) return

        const key = line.slice(0, separatorIndex).trim()
        let value = line.slice(separatorIndex + 1).trim()

        // Parse quoted values
        value = this._parseValue(value)

        process.env[key] = value
      })
    } catch (err) {
      console.error('Error reading .env file:', err.message)
    }
  },

  _parseValue: function (value) {
    // Handle double quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
      // Unescape characters
      value = value.replace(/\\n/g, '\n')
      value = value.replace(/\\r/g, '\r')
      value = value.replace(/\\t/g, '\t')
      value = value.replace(/\\"/g, '"')
      value = value.replace(/\\\\/g, '\\')
      return value
    }

    // Handle single quotes (no escaping in single quotes)
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1)
    }

    // Unquoted value - trim inline comments
    const commentIndex = value.indexOf('#')
    if (commentIndex !== -1) {
      value = value.slice(0, commentIndex).trim()
    }

    return value
  },

  get: function (key, defaultValue) {
    return process.env[key] !== undefined ? process.env[key] : defaultValue
  }
}
