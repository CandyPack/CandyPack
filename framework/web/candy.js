class candy {
  actions = {}
  #data = null
  fn = {}
  #page = null
  #token = {hash: [], data: false}
  #formSubmitHandlers = new Map()
  #loader = {elements: {}, callback: null}
  #isNavigating = false

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

    // Handle navigate configuration
    if (obj.navigate !== undefined && obj.navigate !== false) {
      let selector, elements, callback

      // Minimal: navigate: 'main'
      if (typeof obj.navigate === 'string') {
        selector = 'a[href^="/"]:not([data-navigate="false"]):not(.no-navigate)'
        elements = {content: obj.navigate}
        callback = null
      }
      // Medium/Advanced: navigate: {...}
      else if (typeof obj.navigate === 'object') {
        // Determine base selector
        let baseSelector
        if (obj.navigate.links) {
          baseSelector = obj.navigate.links
        } else if (obj.navigate.selector) {
          baseSelector = obj.navigate.selector
        } else {
          baseSelector = 'a[href^="/"]' // Default: all internal links
        }

        // Add exclusions to selector
        selector = `${baseSelector}:not([data-navigate="false"]):not(.no-navigate)`

        // Determine elements to update
        if (obj.navigate.update) {
          if (typeof obj.navigate.update === 'string') {
            elements = {content: obj.navigate.update}
          } else {
            elements = obj.navigate.update
          }
        } else if (obj.navigate.elements) {
          elements = obj.navigate.elements
        } else {
          elements = {content: 'main'} // Default
        }

        // Determine callback
        callback = obj.navigate.on || obj.navigate.callback || null
      }
      // Boolean: navigate: true
      else if (obj.navigate === true) {
        selector = 'a[href^="/"]:not([data-navigate="false"]):not(.no-navigate)'
        elements = {content: 'main'}
        callback = null
      }

      // Initialize loader after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.loader(selector, elements, callback)
        })
      } else {
        this.loader(selector, elements, callback)
      }
    }

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
      if (['function', 'start', 'load', 'page', 'interval', 'navigate'].includes(key)) continue
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
        if (requestUrl.includes('://')) return false
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

  load(url, callback, push = true) {
    if (this.#isNavigating) return false

    const currentUrl = window.location.href

    // Normalize URL to be absolute
    url = new URL(url, currentUrl).href

    if (url === '' || url.startsWith('javascript:') || url.includes('#')) return false

    this.#isNavigating = true

    this.#ajax({
      url: url,
      type: 'GET',
      headers: {
        'X-Candy': 'ajaxload',
        'X-Candy-Load': Object.keys(this.#loader.elements).join(',')
      },
      dataType: 'json',
      success: (data, status, xhr) => {
        if (url !== currentUrl && push) {
          window.history.pushState(null, document.title, url)
        }

        const newPage = xhr.getResponseHeader('X-Candy-Page')
        if (newPage) this.#page = newPage

        // Update elements with fade effect
        const elements = Object.entries(this.#loader.elements)
        let completed = 0

        if (elements.length === 0) {
          this.#handleLoadComplete(data, callback)
          return
        }

        elements.forEach(([key, selector]) => {
          const element = document.querySelector(selector)
          if (!element) {
            completed++
            if (completed === elements.length) {
              this.#handleLoadComplete(data, callback)
            }
            return
          }

          this.#fadeOut(element, 400, () => {
            if (data.output && data.output[key]) {
              element.innerHTML = data.output[key]
            }
            this.#fadeIn(element, 400, () => {
              completed++
              if (completed === elements.length) {
                this.#handleLoadComplete(data, callback)
              }
            })
          })
        })
      },
      error: () => {
        this.#isNavigating = false
        window.location.replace(url)
      }
    })
  }

  #handleLoadComplete(data, callback) {
    // Call load actions
    if (this.actions.load) {
      if (Array.isArray(this.actions.load)) {
        this.actions.load.forEach(fn => fn(this.page(), data.variables))
      } else if (typeof this.actions.load === 'function') {
        this.actions.load(this.page(), data.variables)
      }
    }

    // Call page-specific actions
    if (this.actions.page && this.actions.page[this.page()]) {
      const pageActions = this.actions.page[this.page()]
      if (Array.isArray(pageActions)) {
        pageActions.forEach(fn => fn(data.variables))
      } else if (typeof pageActions === 'function') {
        pageActions(data.variables)
      }
    }

    // Call custom callback
    if (callback && typeof callback === 'function') {
      callback(this.page(), data.variables)
    }

    // Scroll to top
    window.scrollTo({top: 0, behavior: 'smooth'})

    this.#isNavigating = false
  }

  loader(selector, elements, callback) {
    this.#loader.elements = elements
    this.#loader.callback = callback

    // Handle link clicks
    this.#on(document, 'click', selector, e => {
      if (e.ctrlKey || e.metaKey) return

      // Get the matched anchor element (passed as 'this' from #on method)
      const anchor = e.currentTarget || e.target.closest(selector)
      if (!anchor) return

      const url = anchor.getAttribute('href')
      const target = anchor.getAttribute('target')

      if (!url || url === '' || url.startsWith('javascript:') || url.startsWith('#')) return

      const currentHost = window.location.host
      const isExternal = url.includes('://') && !url.includes(currentHost)

      if ((target === null || target === '_self') && !isExternal) {
        e.preventDefault()
        this.load(url, callback)
      }
    })

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.load(window.location.href, callback, false)
    })
  }
}

window.Candy = new candy()

document.addEventListener('DOMContentLoaded', () => {
  const registerForms = document.querySelectorAll('form.candy-register-form[data-candy-register]')
  registerForms.forEach(form => {
    window.Candy.form({form: 'form[data-candy-register="' + form.dataset.candyRegister + '"]'})
  })
})
