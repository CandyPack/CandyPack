class candy {
  actions = {}
  #data = null
  fn = {}
  #page = null
  #token = {hash: [], data: false}
  #formSubmitHandlers = new Map()

  constructor() {
    this.#data = this.data()
  }

  #ajax(options) {
    const {
      url,
      type = 'GET',
      headers = {},
      data = null,
      dataType = 'text',
      success = () => {},
      error = () => {},
      complete = () => {},
      contentType = 'application/x-www-form-urlencoded; charset=UTF-8',
      xhr: xhrFactory
    } = options

    const xhr = xhrFactory ? xhrFactory() : new XMLHttpRequest()

    xhr.open(type, url, true)

    Object.keys(headers).forEach(key => {
      xhr.setRequestHeader(key, headers[key])
    })

    if (contentType && !(data instanceof FormData)) {
      xhr.setRequestHeader('Content-Type', contentType)
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let responseData = xhr.responseText
        if (dataType === 'json') {
          try {
            responseData = JSON.parse(responseData)
          } catch (e) {
            console.error('JSON parse error:', e)
            error(xhr, 'parseerror', e)
            return
          }
        }

        document.dispatchEvent(
          new CustomEvent('candy:ajaxSuccess', {
            detail: {response: responseData, status: xhr.statusText, xhr, requestUrl: url}
          })
        )

        success(responseData, xhr.statusText, xhr)
      } else {
        error(xhr, xhr.statusText)
      }
    }

    xhr.onerror = () => error(xhr, 'error')
    xhr.onloadend = () => complete()
    xhr.send(data)
  }

  #fade(element, type, duration = 400, callback) {
    const isIn = type === 'in'
    const startOpacity = isIn ? 0 : 1
    const endOpacity = isIn ? 1 : 0

    element.style.opacity = startOpacity
    if (isIn) {
      element.style.display = 'block'
    }

    let startTime = null

    const animate = currentTime => {
      if (!startTime) startTime = currentTime
      const progress = currentTime - startTime
      const opacity = startOpacity + (endOpacity - startOpacity) * Math.min(progress / duration, 1)
      element.style.opacity = opacity

      if (progress < duration) {
        requestAnimationFrame(animate)
      } else {
        if (!isIn) {
          element.style.display = 'none'
        }
        if (callback) callback()
      }
    }
    requestAnimationFrame(animate)
  }

  #fadeIn(element, duration, callback) {
    this.#fade(element, 'in', duration, callback)
  }

  #fadeOut(element, duration, callback) {
    this.#fade(element, 'out', duration, callback)
  }

  #on(element, event, selector, handler) {
    element.addEventListener(event, function (e) {
      let target = e.target.closest(selector)
      if (target) {
        handler.call(target, e)
      }
    })
  }

  #serialize(form) {
    const params = []
    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.name && !el.disabled) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          if (el.checked) {
            params.push(`${encodeURIComponent(el.name)}=${encodeURIComponent(el.value)}`)
          }
        } else if (el.tagName.toLowerCase() === 'select' && el.multiple) {
          Array.from(el.options).forEach(option => {
            if (option.selected) {
              params.push(`${encodeURIComponent(el.name)}=${encodeURIComponent(option.value)}`)
            }
          })
        } else {
          params.push(`${encodeURIComponent(el.name)}=${encodeURIComponent(el.value)}`)
        }
      }
    })
    return params.join('&')
  }

  action(obj) {
    if (obj.function) for (let func in obj.function) this.fn[func] = obj.function[func]
    if (obj.start) document.addEventListener('DOMContentLoaded', () => obj.start())
    if (obj.load) {
      if (!this.actions.load) this.actions.load = []
      this.actions.load.push(obj.load)
      document.addEventListener('DOMContentLoaded', () => obj.load())
    }
    if (obj.page) {
      if (!this.actions.page) this.actions.page = {}
      for (let page in obj.page) {
        if (!this.actions.page[page]) this.actions.page[page] = []
        this.actions.page[page].push(obj.page[page])
        if (this.page() == page) document.addEventListener('DOMContentLoaded', () => obj.page[page]())
      }
    }
    if (obj.interval) {
      if (!this.actions.interval) this.actions.interval = {}
      for (let interval in obj.interval) {
        this.actions.interval[interval] = obj.interval[interval]
        if (obj.interval[interval].page && obj.interval[interval].page != this.page()) continue
        this.actions.interval[interval]._ = setInterval(obj.interval[interval].function, obj.interval[interval].interval ?? 1000)
      }
    }
    for (let key in obj) {
      if (['function', 'start', 'load', 'page', 'interval'].includes(key)) continue
      for (let key2 in obj[key]) {
        if (typeof obj[key][key2] == 'function') {
          this.#on(document, key, key2, obj[key][key2])
        } else {
          let func = ''
          let split = ''
          if (obj[key][key2].includes('.')) split = '.'
          else if (obj[key][key2].includes('#')) split = '#'
          else if (obj[key][key2].includes(' ')) split = ' '
          func = split != '' ? obj[key][key2].split(split) : [obj[key][key2]]
          if (func != '') {
            let getfunc = obj
            func.forEach(function (item) {
              getfunc = getfunc[item] !== undefined ? getfunc[item] : getfunc[split + item]
            })
            this.#on(document, key, key2, getfunc)
          }
        }
      }
    }
  }

  client() {
    if (!document.cookie.includes('candy_client=')) return null
    return document.cookie.split('candy_client=')[1].split(';')[0]
  }

  data() {
    if (this.#data) return this.#data
    if (!document.cookie.includes('candy_data=')) return null
    return JSON.parse(unescape(document.cookie.split('candy_data=')[1].split(';')[0]))
  }

  form(obj, callback) {
    if (typeof obj != 'object') obj = {form: obj}
    const formSelector = obj.form

    if (this.#formSubmitHandlers.has(formSelector)) {
      const oldHandler = this.#formSubmitHandlers.get(formSelector)
      document.removeEventListener('submit', oldHandler)
    }

    const handler = e => {
      const formElement = e.target.closest(formSelector)
      if (!formElement) return

      e.preventDefault()

      formElement.querySelectorAll('button, input[type="button"], input[type="submit"]').forEach(el => (el.disabled = true))

      let actions = this.actions
      if (
        actions.candy &&
        actions.candy.form &&
        actions.candy.form.input &&
        actions.candy.form.input.class &&
        actions.candy.form.input.class.invalid
      ) {
        const invalidClass = actions.candy.form.input.class.invalid
        formElement
          .querySelectorAll(`select.${invalidClass},input.${invalidClass},textarea.${invalidClass}`)
          .forEach(el => el.classList.remove(invalidClass))
      }

      if (obj.messages !== false) {
        if (obj.messages == undefined || obj.messages == true || obj.messages.includes('error')) {
          formElement.querySelectorAll('*[candy-form-error]').forEach(el => (el.style.display = 'none'))
        }
        if (obj.messages == undefined || obj.messages == true || obj.messages.includes('success')) {
          formElement.querySelectorAll('*[candy-form-success]').forEach(el => (el.style.display = 'none'))
        }
      }

      let datastring, cache, contentType, processData
      if (formElement.querySelector('input[type=file]')) {
        datastring = new FormData(formElement)
        datastring.append('token', this.token())
        cache = false
        contentType = false
        processData = false
      } else {
        datastring = this.#serialize(formElement) + '&_token=' + this.token()
        cache = true
        contentType = 'application/x-www-form-urlencoded; charset=UTF-8'
        processData = true
      }

      this.#ajax({
        type: formElement.getAttribute('method'),
        url: formElement.getAttribute('action'),
        data: datastring,
        dataType: 'json',
        contentType: contentType,
        processData: processData,
        cache: cache,
        success: data => {
          if (!data.result) return false
          if (obj.messages == undefined || obj.messages) {
            if (data.result.success && (obj.messages == undefined || obj.messages.includes('success') || obj.messages == true)) {
              const successEl = formElement.querySelector('*[candy-form-success]')
              if (successEl) {
                successEl.innerHTML = data.result.message
                this.#fadeIn(successEl)
              } else {
                formElement.insertAdjacentHTML('beforeend', `<span candy-form-success="${obj.form}">${data.result.message}</span>`)
              }
            } else {
              var invalid_input_class = '_candy_error'
              var invalid_span_class = '_candy_form_info'
              var invalid_span_style = ''

              Object.entries(data.errors).forEach(([name, message]) => {
                if (message) {
                  const errorEl = formElement.querySelector(`[candy-form-error="${name}"]`)
                  if (errorEl) {
                    errorEl.innerHTML = message
                    this.#fadeIn(errorEl)
                  } else {
                    const inputEl = formElement.querySelector(`*[name="${name}"]`)
                    if (inputEl)
                      inputEl.insertAdjacentHTML(
                        'afterend',
                        `<span candy-form-error="${name}" class="${invalid_span_class}" style="${invalid_span_style}">${message}</span>`
                      )
                  }
                }
                const inputEl = formElement.querySelector(`*[name="${name}"]`)
                if (inputEl) {
                  inputEl.classList.add(invalid_input_class)
                  inputEl.addEventListener(
                    'focus',
                    function handler() {
                      inputEl.classList.remove(invalid_input_class)
                      const errorEl = formElement.querySelector(`[candy-form-error="${name}"]`)
                      if (errorEl) this.#fadeOut(errorEl)
                      inputEl.removeEventListener('focus', handler)
                    }.bind(this),
                    {once: true}
                  )
                }
              })
            }
          }
          if (callback !== undefined) {
            if (typeof callback === 'function') callback(data)
            else if (data.result.success) window.location.replace(callback)
          }
        },
        xhr: () => {
          var xhr = new window.XMLHttpRequest()
          xhr.upload.addEventListener(
            'progress',
            function (evt) {
              if (evt.lengthComputable) {
                var percent = parseInt((100 / evt.total) * evt.loaded)
                if (obj.loading) obj.loading(percent)
              }
            },
            false
          )
          return xhr
        },
        error: () => {
          console.error('CandyJS:', 'Somethings went wrong...', '\nForm: ' + obj.form + '\nRequest: ' + formElement.getAttribute('action'))
        },
        complete: () => {
          formElement.querySelectorAll('button, input[type="button"], input[type="submit"]').forEach(el => (el.disabled = false))
        }
      })
    }

    document.addEventListener('submit', handler)
    this.#formSubmitHandlers.set(formSelector, handler)
  }

  get(url, callback) {
    url = url + '?_token=' + this.token()
    this.#ajax({url: url, success: callback})
  }

  page() {
    if (!this.#page) {
      let data = this.data()
      if (data !== null) this.#page = data.page
      else this.token(true)
    }
    return this.#page
  }

  storage(key, value) {
    if (value === undefined) return localStorage.getItem(key)
    else if (value === null) return localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  }

  token() {
    let data = this.data()
    if (!this.#token.listener) {
      document.addEventListener('candy:ajaxSuccess', event => {
        const {detail} = event
        const {xhr, requestUrl} = detail
        if (requestUrl.substr(0, 4) == 'http') return false
        try {
          const token = xhr.getResponseHeader('X-Candy-Token')
          if (token) this.#token.hash.push(token)
          if (this.#token.hash.length > 2) this.#token.hash.shift()
        } catch (e) {
          console.error('Error in ajaxSuccess token handler:', e)
        }
      })
      this.#token.listener = true // Mark as listener attached
    }
    if (!this.#token.hash.length) {
      if (!this.#token.data && data) {
        this.#page = data.page
        this.#token.hash.push(data.token)
        this.#token.data = true
      } else {
        var req = new XMLHttpRequest()
        req.open('GET', '/', false)
        req.setRequestHeader('X-Candy', 'token')
        req.setRequestHeader('X-Candy-Client', this.client())
        req.send(null)
        var req_data = JSON.parse(req.response)
        if (req_data.token) this.#token.hash.push(req_data.token)
      }
    }
    this.#token.hash.filter(n => n)
    var return_token = this.#token.hash.shift()
    if (!this.#token.hash.length)
      this.#ajax({
        url: '/',
        type: 'GET',
        headers: {'X-Candy': 'token', 'X-Candy-Client': this.client()},
        success: data => {
          var result = JSON.parse(JSON.stringify(data))
          if (result.token) this.#token.hash.push(result.token)
        }
      })
    return return_token
  }
}

window.Candy = new candy()
