class Validator {
    #error   = false;
    #message = {};
    #method  = [];
    #name    = '';
    #type    = 'post';

    check(rules){
        if(typeof rules === 'boolean'){
            this.#error = rules === false;
        } else {
            for(const rule of rules.split('|')){
                let vars = rule.split(':');
                let inverse = vars[0].startsWith('!');
                if(!this.#error && !this.#message[this.#name]){
                    switch(inverse ? vars[0].substr(1) : vars[0]){
                        case 'required':
                            this.#error = !this.#method[this.#name] || this.#method[this.#name] === '' || this.#method[this.#name] === null;
                            break;
                        case 'accepted':
                            this.#error = !this.#method[this.#name] || (this.#method[this.#name] !== 1 && this.#method[this.#name] !== 'on' && this.#method[this.#name] !== 'yes' && this.#method[this.#name] !== true);
                            break;
                        case 'numeric':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && !Candy.var(this.#method[this.#name]).is('numeric');
                            break;
                        case 'alpha':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && !Candy.var(this.#method[this.#name]).is('alpha');
                            break;
                        case 'alphaspace':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && !Candy.var(this.#method[this.#name]).is('alphaspace');
                            break;
                        case 'alphanumeric':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && !Candy.var(this.#method[this.#name]).is('alphanumeric');
                            break;
                        case 'alphanumericspace':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && !Candy.var(this.#method[this.#name]).is('alphanumericspace');
                            break;
                        case 'email':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && !Candy.var(this.#method[this.#name]).is('email');
                            break;
                        case 'ip':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && !Candy.var(this.#method[this.#name]).is('ip');
                            break;
                        case 'float':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && !Candy.var(this.#method[this.#name]).is('float');
                            break;
                        case 'mac':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && !Candy.var(this.#method[this.#name]).is('mac');
                            break;
                        case 'domain':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && !Candy.var(this.#method[this.#name]).is('domain');
                            break;
                        case 'url':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && !Candy.var(this.#method[this.#name]).is('url');
                            break;
                        case 'username':
                            this.#error = this.#method[this.#name] && !(ctype_alnum(this.#method[this.#name]));
                            break;
                        case 'xss':
                            this.#error = this.#method[this.#name] && (strip_tags(this.#method[this.#name]) !== this.#method[this.#name]);
                            break;
                        case 'usercheck':
                            this.#error = this.#method[this.#name] && !Auth.check();
                            break;
                        case 'array':
                            this.#error = this.#method[this.#name] && !Array.isArray(this.#method[this.#name]);
                            break;
                        case 'date':
                            this.#error = this.#method[this.#name] && (strtotime(this.#method[this.#name]) === false || !(strtotime(this.#method[this.#name]) > strtotime(0)));
                            break;
                        case 'min':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && vars[1] && this.#method[this.#name] < vars[1];
                            break;
                        case 'max':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && vars[1] && this.#method[this.#name] > vars[1];
                            break;
                        case 'len':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && vars[1] && strlen(this.#method[this.#name]) !== vars[1];
                            break;
                        case 'minlen':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && vars[1] && strlen(this.#method[this.#name]) < vars[1];
                            break;
                        case 'maxlen':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && vars[1] && strlen(this.#method[this.#name]) > vars[1];
                            break;
                        case 'mindate':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && vars[1] && strtotime(this.#method[this.#name]) < strtotime(vars[1]);
                            break;
                        case 'maxdate':
                            this.#error = this.#method[this.#name] && this.#method[this.#name] !== '' && vars[1] && strtotime(this.#method[this.#name]) > strtotime(vars[1]);
                            break;
                        case 'same':
                            this.#error = this.#method[this.#name] && this.#method[vars[1]] && this.#method[this.#name] !== this.#method[vars[1]];
                            break;
                        case 'different':
                            this.#error = this.#method[this.#name] && this.#method[vars[1]] && this.#method[this.#name] === this.#method[vars[1]];
                            break;
                        case 'equal':
                            this.#error = this.#method[this.#name] && vars[1] && this.#method[this.#name] !== vars[1];
                            break;
                        case 'notin':
                            this.#error = this.#method[this.#name] && vars[1] && (strpos(this.#method[this.#name], vars[1]) !== false);
                            break;
                        case 'in':
                            this.#error = this.#method[this.#name] && vars[1] && (!(strpos(this.#method[this.#name], vars[1]) !== false));
                            break;
                        case 'not':
                            this.#error = this.#method[this.#name] && vars[1] && this.#method[this.#name] === vars[1];
                            break;
                        case 'regex':
                            this.#error = this.#method[this.#name] && vars[1] && empty(preg_match("/" + vars[1] + "/", this.#method[this.#name]));
                            break;
                        case 'user':
                            let user_data = Auth.user(vars[1]);
                            if(Candy.string(user_data).is('bcrypt')) this.#error = this.#method[this.#name] && (!Auth.check() || !Candy.hash(this.#method[this.#name], user_data));
                            else if(Candy.string(user_data).is('md5')) this.#error = this.#method[this.#name] && (!Auth.check() || !md5(this.#method[this.#name]) === user_data);
                            else this.#error = this.#method[this.#name] && (!Auth.check() || this.#method[this.#name] !== Auth.user(vars[1]));
                            break;
                    }
                    if(inverse) this.#error = !this.#error;
                }
            }
        }
        return this;
    }

    error(callback){
        callback();
        return this;
    }

    get(key){
        this.#method = 'GET';
        this.#name   = key;
        this.#error  = false;
        this.#type   = 'GET';
        return this;
    }

    message(value){
        if(this.#error && !this.#message[this.#name]){
            this.#message[this.#name] = value ?? '';
            this.#error = false;
        }
        return this;
    }


    post(key){
        this.#method = 'POST';
        this.#name   = key;
        this.#error  = false;
        this.#type   = 'POST';
        return this;
    }

    result(message, data){
        let result = {
            success: { result : Object.keys(this.#message).length === 0,
                       message: Object.keys(this.#message).length === 0 ? message : '' },
            errors : this.#message['_candy_form'] ? { _candy_form: this.#message['_candy_form'] } : this.#message,
            data   : Object.keys(this.#message).length === 0 ? (data ?? null) : null
        };
        return result;
    }

    success(callback){
        if(this.#error) return this.result();
        callback = callback();
        if(typeof callback === 'string') return this.result(callback);
        else return this.result(null, callback);
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

};

module.exports = Validator;