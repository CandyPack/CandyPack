class Internal {
  static async register(Candy) {
    const token = await Candy.request('_candy_register_token')
    if (!token) {
      return Candy.return({
        result: {success: false},
        errors: {_candy_form: 'Invalid request'}
      })
    }

    const storage = Candy.storage('sys')
    const registerForms = storage.get('registerForms') || {}
    const formData = registerForms[token]

    if (!formData) {
      return Candy.return({
        result: {success: false},
        errors: {_candy_form: 'Form session expired. Please refresh the page.'}
      })
    }

    if (formData.expires < Date.now()) {
      delete registerForms[token]
      storage.set('registerForms', registerForms)
      return Candy.return({
        result: {success: false},
        errors: {_candy_form: 'Form session expired. Please refresh the page.'}
      })
    }

    const config = formData.config
    const validator = Candy.validator()
    const data = {}

    const uniqueFields = []

    for (const field of config.fields) {
      const value = await Candy.request(field.name)

      for (const validation of field.validations) {
        const rules = validation.rule.split('|')
        for (const rule of rules) {
          validator.post(field.name).check(rule)
          if (validation.message) {
            const message = this.replacePlaceholders(validation.message, {
              value: value,
              field: field.name,
              label: field.label || field.placeholder,
              rule: rule
            })
            validator.message(message)
          }
        }
      }

      if (field.unique) {
        uniqueFields.push(field.name)
      }

      data[field.name] = value
    }

    for (const set of config.sets) {
      if (set.value !== null) {
        if (set.ifEmpty && data[set.name]) continue
        data[set.name] = set.value
      } else if (set.compute) {
        data[set.name] = await this.computeValue(set.compute, Candy)
      } else if (set.callback) {
        if (typeof Candy.fn[set.callback] === 'function') {
          data[set.name] = await Candy.fn[set.callback](Candy)
        }
      }
    }

    if (await validator.error()) {
      return validator.result()
    }

    const registerResult = await Candy.Auth.register(data, {
      autoLogin: config.autologin !== false,
      uniqueFields: uniqueFields.length > 0 ? uniqueFields : ['email']
    })

    if (!registerResult.success) {
      const errorField = registerResult.field || '_candy_form'
      const errors = {[errorField]: registerResult.error}
      return Candy.return({
        result: {success: false},
        errors: errors
      })
    }

    delete registerForms[token]
    storage.set('registerForms', registerForms)

    return Candy.return({
      result: {
        success: true,
        message: 'Registration successful',
        redirect: config.redirect
      },
      data: registerResult.user
    })
  }

  static replacePlaceholders(message, data) {
    if (!message) return message

    const ruleParts = data.rule ? data.rule.split(':') : []
    const ruleValue = ruleParts[1] || null

    const placeholders = {
      '{value}': data.value || '',
      '{field}': data.field || '',
      '{label}': data.label || data.field || '',
      '{min}': ruleValue,
      '{max}': ruleValue,
      '{len}': ruleValue,
      '{other}': ruleValue
    }

    let result = message
    for (const [placeholder, value] of Object.entries(placeholders)) {
      if (value !== null) {
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
      }
    }

    return result
  }

  static async computeValue(type, Candy) {
    switch (type) {
      case 'now':
        return Math.floor(Date.now() / 1000)
      case 'date':
        return new Date().toISOString().split('T')[0]
      case 'datetime':
        return new Date().toISOString()
      case 'timestamp':
        return Date.now()
      case 'ip':
        return Candy.Request.ip
      case 'user_agent':
        return Candy.Request.header('user-agent')
      case 'uuid':
        return require('crypto').randomUUID()
      default:
        return null
    }
  }
}

module.exports = Internal
