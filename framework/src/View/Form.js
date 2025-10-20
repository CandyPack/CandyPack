const nodeCrypto = require('crypto')

class Form {
  static parseRegister(content) {
    const registerMatches = content.match(/<candy-register[\s\S]*?<\/candy-register>/g)
    if (!registerMatches) return content

    for (const match of registerMatches) {
      const formToken = nodeCrypto.randomBytes(32).toString('hex')
      const formConfig = this.extractRegisterConfig(match, formToken)

      this.storeRegisterConfig(formToken, formConfig)

      const generatedForm = this.generateRegisterForm(formConfig, formToken)
      content = content.replace(match, generatedForm)
    }

    return content
  }

  static extractRegisterConfig(html, formToken) {
    const config = {
      token: formToken,
      redirect: null,
      autologin: true,
      submitText: 'Register',
      submitLoading: 'Processing...',
      fields: [],
      sets: []
    }

    const registerTag = html.match(/<candy-register([^>]*)>/)[0]
    const redirectMatch = registerTag.match(/redirect=["']([^"']+)["']/)
    const autologinMatch = registerTag.match(/autologin=["']([^"']+)["']/)

    if (redirectMatch) config.redirect = redirectMatch[1]
    if (autologinMatch) config.autologin = autologinMatch[1] !== 'false'

    const submitMatch = html.match(/<candy-submit([^>/]*)(?:\/?>|>(.*?)<\/candy-submit>)/)
    if (submitMatch) {
      const textMatch = submitMatch[1].match(/text=["']([^"']+)["']/)
      const loadingMatch = submitMatch[1].match(/loading=["']([^"']+)["']/)

      if (textMatch) config.submitText = textMatch[1]
      else if (submitMatch[2]) config.submitText = submitMatch[2].trim()

      if (loadingMatch) config.submitLoading = loadingMatch[1]
    }

    const fieldMatches = html.match(/<candy-field[\s\S]*?<\/candy-field>/g)
    if (fieldMatches) {
      for (const fieldHtml of fieldMatches) {
        const field = this.parseField(fieldHtml)
        if (field) config.fields.push(field)
      }
    }

    const setMatches = html.match(/<candy-set[^>]*\/?>/g)
    if (setMatches) {
      for (const setTag of setMatches) {
        const set = this.parseSet(setTag)
        if (set) config.sets.push(set)
      }
    }

    return config
  }

  static parseField(html) {
    const fieldTag = html.match(/<candy-field([^>]*)>/)[0]

    const nameMatch = fieldTag.match(/name=["']([^"']+)["']/)
    if (!nameMatch) return null

    const field = {
      name: nameMatch[1],
      type: 'text',
      placeholder: '',
      label: null,
      unique: false,
      validations: []
    }

    const typeMatch = fieldTag.match(/type=["']([^"']+)["']/)
    const placeholderMatch = fieldTag.match(/placeholder=["']([^"']+)["']/)
    const labelMatch = fieldTag.match(/label=["']([^"']+)["']/)
    const uniqueMatch = fieldTag.match(/unique=["']([^"']+)["']/) || fieldTag.match(/\sunique[\s>]/)

    if (typeMatch) field.type = typeMatch[1]
    if (placeholderMatch) field.placeholder = placeholderMatch[1]
    if (labelMatch) field.label = labelMatch[1]
    if (uniqueMatch) field.unique = uniqueMatch[1] !== 'false'

    const validateMatches = html.match(/<candy-validate[^>]*>/g)
    if (validateMatches) {
      for (const validateTag of validateMatches) {
        const ruleMatch = validateTag.match(/rule=["']([^"']+)["']/)
        const messageMatch = validateTag.match(/message=(["'])(.*?)\1/)

        if (ruleMatch) {
          field.validations.push({
            rule: ruleMatch[1],
            message: messageMatch ? messageMatch[2] : null
          })
        }
      }
    }

    return field
  }

  static parseSet(html) {
    const nameMatch = html.match(/name=["']([^"']+)["']/)
    if (!nameMatch) return null

    const set = {
      name: nameMatch[1],
      value: null,
      compute: null,
      callback: null,
      ifEmpty: false
    }

    const valueMatch = html.match(/value=(["'])(.*?)\1/)
    const computeMatch = html.match(/compute=["']([^"']+)["']/)
    const callbackMatch = html.match(/callback=["']([^"']+)["']/)
    const ifEmptyMatch = html.match(/if-empty=["']([^"']+)["']/) || html.match(/\sif-empty[\s/>]/)

    if (valueMatch) set.value = valueMatch[2]
    if (computeMatch) set.compute = computeMatch[1]
    if (callbackMatch) set.callback = callbackMatch[1]
    if (ifEmptyMatch) set.ifEmpty = ifEmptyMatch[1] !== 'false'

    return set
  }

  static storeRegisterConfig(token, config) {
    if (!Candy.View) Candy.View = {}
    if (!Candy.View.registerForms) Candy.View.registerForms = {}
    Candy.View.registerForms[token] = config

    const storage = Candy.storage('sys')
    let registerForms = storage.get('registerForms') || {}
    registerForms[token] = {
      config: config,
      created: Date.now(),
      expires: Date.now() + 30 * 60 * 1000
    }
    storage.set('registerForms', registerForms)
  }

  static generateRegisterForm(config, formToken) {
    const submitText = config.submitText || 'Register'
    const submitLoading = config.submitLoading || 'Processing...'

    let html = `<form class="candy-register-form" data-candy-register="${formToken}" method="POST" action="/_candy/register">\n`
    html += `  <input type="hidden" name="_candy_register_token" value="${formToken}">\n`

    for (const field of config.fields) {
      html += this.generateFieldHtml(field)
    }

    html += `  <button type="submit" data-submit-text="${submitText}" data-loading-text="${submitLoading}">${submitText}</button>\n`
    html += `  <span class="candy-form-success" style="display:none;"></span>\n`
    html += `</form>`

    return html
  }

  static generateFieldHtml(field) {
    let html = `  <div class="candy-field candy-field-${field.name}">\n`

    if (field.label && field.type !== 'checkbox') {
      html += `    <label for="candy-${field.name}">${field.label}</label>\n`
    }

    if (field.type === 'checkbox') {
      const attrs = this.buildHtml5Attributes(field)
      html += `    <label>\n`
      html += `      <input type="checkbox" id="candy-${field.name}" name="${field.name}" value="1"${attrs}>\n`
      html += `      ${field.label || field.placeholder}\n`
      html += `    </label>\n`
    } else if (field.type === 'textarea') {
      const attrs = this.buildHtml5Attributes(field)
      html += `    <textarea id="candy-${field.name}" name="${field.name}" placeholder="${field.placeholder}"${attrs}></textarea>\n`
    } else {
      const attrs = this.buildHtml5Attributes(field)
      html += `    <input type="${field.type}" id="candy-${field.name}" name="${field.name}" placeholder="${field.placeholder}"${attrs}>\n`
    }

    html += `    <span class="candy-form-error" candy-form-error="${field.name}" style="display:none;"></span>\n`
    html += `  </div>\n`

    return html
  }

  static buildHtml5Attributes(field) {
    let attrs = ''
    const html5Rules = {
      required: false,
      minlength: null,
      maxlength: null,
      min: null,
      max: null,
      pattern: null
    }

    for (const validation of field.validations) {
      const rules = validation.rule.split('|')
      for (const rule of rules) {
        const [ruleName, ruleValue] = rule.split(':')

        switch (ruleName) {
          case 'required':
            html5Rules.required = true
            break
          case 'minlen':
            if (field.type !== 'number') html5Rules.minlength = ruleValue
            break
          case 'maxlen':
            if (field.type !== 'number') html5Rules.maxlength = ruleValue
            break
          case 'min':
            if (field.type === 'number') html5Rules.min = ruleValue
            break
          case 'max':
            if (field.type === 'number') html5Rules.max = ruleValue
            break
          case 'email':
            break
          case 'url':
            break
          case 'numeric':
            if (field.type === 'text') html5Rules.pattern = '[0-9]+'
            break
          case 'alpha':
            if (field.type === 'text') html5Rules.pattern = '[a-zA-Z]+'
            break
          case 'alphanumeric':
            if (field.type === 'text') html5Rules.pattern = '[a-zA-Z0-9]+'
            break
          case 'accepted':
            if (field.type === 'checkbox') html5Rules.required = true
            break
        }
      }
    }

    if (html5Rules.required) attrs += ' required'
    if (html5Rules.minlength) attrs += ` minlength="${html5Rules.minlength}"`
    if (html5Rules.maxlength) attrs += ` maxlength="${html5Rules.maxlength}"`
    if (html5Rules.min) attrs += ` min="${html5Rules.min}"`
    if (html5Rules.max) attrs += ` max="${html5Rules.max}"`
    if (html5Rules.pattern) attrs += ` pattern="${html5Rules.pattern}"`

    return attrs
  }
}

module.exports = Form
