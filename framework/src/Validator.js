class Validator {
  #check = ''
  #checklist = {}
  #completed = false
  #message = {}
  #method = 'POST'
  #name = ''
  #request

  constructor(Request) {
    this.#request = Request
  }

  check(rules) {
    if (!this.#checklist[this.#method]) this.#checklist[this.#method] = {}
    this.#checklist[this.#method][this.#name] = {rules: rules, message: null}
    this.#check = rules
    return this
  }

  async error() {
    return new Promise(async (resolve, reject) => {
      if (!this.#completed) await this.#validate()
      return resolve(Object.keys(this.#message).length > 0)
    })
  }

  get(key) {
    if (this.#completed) this.#completed = false
    this.#method = 'GET'
    this.#name = key
    return this
  }

  message(value) {
    this.#checklist[this.#method][this.#name].message = value
    return this
  }

  post(key) {
    if (this.#completed) this.#completed = false
    this.#method = 'POST'
    this.#name = key
    return this
  }

  async result(message, data) {
    return new Promise(async (resolve, reject) => {
      if (!this.#completed) await this.#validate()
      let result = {}
      result.result = {}
      result.result.success = Object.keys(this.#message).length === 0
      if (result.result.success) {
        result.result.message = message ?? ''
        result.data = data ?? null
      } else {
        result.errors = this.#message['_candy_form']
          ? {_candy_form: this.#message['_candy_form']}
          : this.#message
      }
      return resolve(result)
    })
  }

  success(callback) {
    if (typeof callback === 'string') return this.result(callback)
    else return this.result(null, callback)
  }

  async #validate() {
    return new Promise(async (resolve, reject) => {
      for (const method of Object.keys(this.#checklist)) {
        for (const key of Object.keys(this.#checklist[method])) {
          let error = false
          let rules = this.#checklist[method][key].rules
          let value = await this.#request.request(key, method)
          if (typeof rules === 'boolean') {
            error = rules === false
          } else {
            for (const rule of rules.includes('|') ? rules.split('|') : [rules]) {
              let vars = rule.split(':')
              let inverse = vars[0].startsWith('!')
              if (!error && !this.#message[this.#name]) {
                switch (inverse ? vars[0].substr(1) : vars[0]) {
                  case 'required':
                    error = value === undefined || value === '' || value === null
                    break
                  case 'accepted':
                    error =
                      !value || (value !== 1 && value !== 'on' && value !== 'yes' && value !== true)
                    break
                  case 'numeric':
                    error = value && value !== '' && !Candy.Var(value).is('numeric')
                    break
                  case 'alpha':
                    error = value && value !== '' && !Candy.Var(value).is('alpha')
                    break
                  case 'alphaspace':
                    error = value && value !== '' && !Candy.Var(value).is('alphaspace')
                    break
                  case 'alphanumeric':
                    error = value && value !== '' && !Candy.Var(value).is('alphanumeric')
                    break
                  case 'alphanumericspace':
                    error = value && value !== '' && !Candy.Var(value).is('alphanumericspace')
                    break
                  case 'email':
                    error = value && value !== '' && !Candy.Var(value).is('email')
                    break
                  case 'ip':
                    error = value && value !== '' && !Candy.Var(value).is('ip')
                    break
                  case 'float':
                    error = value && value !== '' && !Candy.Var(value).is('float')
                    break
                  case 'mac':
                    error = value && value !== '' && !Candy.Var(value).is('mac')
                    break
                  case 'domain':
                    error = value && value !== '' && !Candy.Var(value).is('domain')
                    break
                  case 'url':
                    error = value && value !== '' && !Candy.Var(value).is('url')
                    break
                  case 'username':
                    error = value && !ctype_alnum(value)
                    break
                  case 'xss':
                    error = value && strip_tags(value) !== value
                    break
                  case 'usercheck':
                    error = value && !Auth.check()
                    break
                  case 'array':
                    error = value && !Array.isArray(value)
                    break
                  case 'date':
                    error =
                      value && (strtotime(value) === false || !(strtotime(value) > strtotime(0)))
                    break
                  case 'min':
                    error = value && value !== '' && vars[1] && value < vars[1]
                    break
                  case 'max':
                    error = value && value !== '' && vars[1] && value > vars[1]
                    break
                  case 'len':
                    error = value && value !== '' && vars[1] && strlen(value) !== vars[1]
                    break
                  case 'minlen':
                    error = value && value !== '' && vars[1] && strlen(value) < vars[1]
                    break
                  case 'maxlen':
                    error = value && value !== '' && vars[1] && strlen(value) > vars[1]
                    break
                  case 'mindate':
                    error =
                      value && value !== '' && vars[1] && strtotime(value) < strtotime(vars[1])
                    break
                  case 'maxdate':
                    error =
                      value && value !== '' && vars[1] && strtotime(value) > strtotime(vars[1])
                    break
                  case 'same':
                    error = value && this.#method[vars[1]] && value !== this.#method[vars[1]]
                    break
                  case 'different':
                    error = value && this.#method[vars[1]] && value === this.#method[vars[1]]
                    break
                  case 'equal':
                    error = value && vars[1] && value !== vars[1]
                    break
                  case 'notin':
                    error = value && vars[1] && strpos(value, vars[1]) !== false
                    break
                  case 'in':
                    error = value && vars[1] && !(strpos(value, vars[1]) !== false)
                    break
                  case 'not':
                    error = value && vars[1] && value === vars[1]
                    break
                  case 'regex':
                    error = value && vars[1] && empty(preg_match('/' + vars[1] + '/', value))
                    break
                  case 'user':
                    let user_data = Auth.user(vars[1])
                    if (Candy.string(user_data).is('bcrypt'))
                      error = value && (!Auth.check() || !Candy.hash(value, user_data))
                    else if (Candy.string(user_data).is('md5'))
                      error = value && (!Auth.check() || !md5(value) === user_data)
                    else error = value && (!Auth.check() || value !== Auth.user(vars[1]))
                    break
                }
                if (inverse) error = !error
              }
            }
          }
          if (error) this.#message[key] = this.#checklist[method][key].message
        }
      }
      this.#completed = true
      return resolve()
    })
  }

  // function var($n,$v=null){
  //     $this->_method = [$n => ($v === null ? $n : $v)];
  //     $this->_name = $n;
  //     $this->_error = false;
  //     $this->_type = $n;
  //     return new static($this->_name,$this->_request,$this->_error,$this->_message,$this->_method,$this->_type);
  // }

  // function file($n){
  //     $this->_method=$_FILES;
  //     $this->_name=$n;
  //     $this->_error = false;
  //     $this->_type = 'FILES';
  //     return new static($this->_name,$this->_request,$this->_error,$this->_message,$this->_method,$this->_type);
  // }

  // function brute($try=5){
  //     $ip = $_SERVER['REMOTE_ADDR'];
  //     $now = substr(date('YmdHi'),0,-1);
  //     $page = PAGE;
  //     $storage = Candy::storage('sys')->get('validation');
  //     $this->_name='_candy_form';
  //     if(count($this->_message) > 0){
  //     $storage->brute                   = isset($storage->brute)                   ? $storage->brute : new \stdClass;
  //     $storage->brute->$now             = isset($storage->brute->$now)             ? $storage->brute->$now : new \stdClass;
  //     $storage->brute->$now->$page      = isset($storage->brute->$now->$page)      ? $storage->brute->$now->$page : new \stdClass;
  //     $storage->brute->$now->$page->$ip = isset($storage->brute->$now->$page->$ip) ? ($storage->brute->$now->$page->$ip + 1) : 1;
  //     $this->_error = $storage->brute->$now->$page->$ip >= $try;
  //     }else{
  //     $this->_error = isset($storage->$now->$ip) ? $storage->$now->$ip >= $try : false;
  //     }

  //     Candy::storage('sys')->set('validation',$storage);
  //     return new static($this->_name,$this->_request,$this->_error,$this->_message,$this->_method,$this->_type);
  // }
}

module.exports = Validator
