const crypto = require('crypto');

module.exports = {
    
    init: function(value){
        this._value = value;
        return this;
    },

    // public function clear($arr){
    //     $replace = [];
    //     $arr = is_array($arr) ? $arr : func_get_args();
    //     if(is_array($this->str)) {
    //       foreach ($arr as $val) if(($key = array_search($val, $this->str)) !== false) unset($this->str[$key]);
    //       return $this->str;
    //     } else {
    //       foreach ($arr as $key) $replace[$key] = '';
    //       return self::replace($replace);
    //     }
    //   }
    
    //   public function contains($val){
    //     $any = $this->any;
    //     $this->any = false;
    //     if(!is_array($val)) $val = func_get_args();
    //     $result = !$any;
    //     foreach($val as $key){
    //       if($any) $result = $result || (strpos($this->str, $key) !== false);
    //       else     $result = $result && (strpos($this->str, $key) !== false);
    //     }
    //     return $result;
    //   }
    
    date(format){
        if(!format) format = 'Y-m-d H:i:s';
        let date = new Date(this._value);
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hour = date.getHours();
        let minute = date.getMinutes();
        let second = date.getSeconds();
        return Candy.var(format).replace({'Y': year,
                                          'm': month < 10 ? `0${month}` : month,
                                          'd': day < 10 ? `0${day}` : day,
                                          'H': hour < 10 ? `0${hour}` : hour,
                                          'i': minute < 10 ? `0${minute}` : minute,
                                          's': second < 10 ? `0${second}` : second,
                                          'y': year.toString().substr(2,2)});
    },

    decrypt: function(key){
        if(!key) key = Candy.Config.encrypt.key;
        const iv = '2dea8a25e5e8f004';
        try{
            const encryptedText = Buffer.from(this._value, 'base64');
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch(e){
            console.log(e);
            return null;
        }
    },

    encrypt: function(key){
        if(!key) key = Candy.Config.encrypt.key;
        const iv = '2dea8a25e5e8f004';
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(this._value);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('base64');
    },
    
    //   public function containsAny($val){
    //     $this->any = true;
    //     return $this->contains(count(func_get_args()) > 0 ? func_get_args() : $val);
    //   }
    
    //   public function is($val){
    //     $any = $this->any;
    //     $this->any = false;
    //     $val = is_array($val) ? $val : func_get_args();
    //     $result = !$any;
    //     if(\Candy::config('locale')->get() == 'tr') $this->str = \Candy::var($this->str)->clear('Ç','ç','Ğ','ğ','İ','ı','Ö','ö','Ş','ş','Ü','ü');
    //     if(in_array('alpha',            $val)) $result = (($result || $any) && (($any && $result) || ctype_alpha($this->str) ));
    //     if(in_array('alphaspace',       $val)) $result = (($result || $any) && (($any && $result) || ctype_alpha(\Candy::var($this->str)->clear(' ')) ));
    //     if(in_array('alphanumeric',     $val)) $result = (($result || $any) && (($any && $result) || ctype_alnum($this->str) ));
    //     if(in_array('alphanumericspace',$val)) $result = (($result || $any) && (($any && $result) || ctype_alnum(\Candy::var($this->str)->clear(' ')) ));
    //     if(in_array('date',             $val)) $result = (($result || $any) && (($any && $result) || !empty(strtotime($this->str)) ));
    //     if(in_array('domain',           $val)) $result = (($result || $any) && (($any && $result) || preg_match('/([a-z0-9\-]+\.){1,2}[a-z]{2,6}/i', $this->str) ));
    //     if(in_array('email',            $val)) $result = (($result || $any) && (($any && $result) || filter_var($this->str, FILTER_VALIDATE_EMAIL) ));
    //     if(in_array('float',            $val)) $result = (($result || $any) && (($any && $result) || filter_var($this->str, FILTER_VALIDATE_FLOAT) ));
    //     if(in_array('host',             $val)) $result = (($result || $any) && (($any && $result) || filter_var((\Candy::string($this->str)->is('ip') ? $this->str : gethostbyname($this->str)), FILTER_VALIDATE_IP) ));
    //     if(in_array('ip',               $val)) $result = (($result || $any) && (($any && $result) || filter_var($this->str, FILTER_VALIDATE_IP) ));
    //     if(in_array('json',             $val)) $result = (($result || $any) && (($any && $result) || (json_decode($this->str) && json_last_error() === JSON_ERROR_NONE) ));
    //     if(in_array('mac',              $val)) $result = (($result || $any) && (($any && $result) || filter_var($this->str, FILTER_VALIDATE_MAC) ));
    //     if(in_array('md5',              $val)) $result = (($result || $any) && (($any && $result) || (bool)preg_match('/^[a-f0-9A-F]{32}$/', $this->str) ));
    //     if(in_array('numeric',          $val)) $result = (($result || $any) && (($any && $result) || is_numeric($this->str) ));
    //     if(in_array('url',            $val)) $result = (($result || $any) && (($any && $result) || filter_var($this->str, FILTER_VALIDATE_URL) ));
    //     if(in_array('emoji',            $val)) $result = (($result || $any) && (($any && $result) || preg_match('/([0-9#][\x{20E3}])|[\x{00ae}\x{00a9}\x{203C}\x{2047}\x{2048}\x{2049}\x{3030}\x{303D}\x{2139}\x{2122}\x{3297}\x{3299}][\x{FE00}-\x{FEFF}]?|[\x{2190}-\x{21FF}][\x{FE00}-\x{FEFF}]?|[\x{2300}-\x{23FF}][\x{FE00}-\x{FEFF}]?|[\x{2460}-\x{24FF}][\x{FE00}-\x{FEFF}]?|[\x{25A0}-\x{25FF}][\x{FE00}-\x{FEFF}]?|[\x{2600}-\x{27BF}][\x{FE00}-\x{FEFF}]?|[\x{2900}-\x{297F}][\x{FE00}-\x{FEFF}]?|[\x{2B00}-\x{2BF0}][\x{FE00}-\x{FEFF}]?|[\x{1F000}-\x{1F6FF}][\x{FE00}-\x{FEFF}]?/u',$this->str) ));
    //     if(in_array('xss',              $val)) $result = (($result || $any) && (($any && $result) || strip_tags($this->str) == $this->str ));
    //     return $result;
    //   }
    
    //   public function isAny($val){
    //     $this->any = true;
    //     return $this->is(is_array($val) ? $val : func_get_args());
    //   }

    isBegin: function(...args){
        for(const arg of args) if(this._value.startsWith(arg)) return true;
    },

    // public function isEnd($var){
    //     $str = $this->str;
    //     return substr($str,0 - strlen($var)) == $var;
    //   }
    
    replace(...args){
        if(args.length == 1) args = args[0];
        if(['array','object'].includes(typeof this._value)){
            let new_value = {};
            for(const key of Object.keys(this._value)) new_value[key] = Candy.var(this._value[key]).replace(args);
            return new_value;
        }
        for(const arg of Object.keys(args)) this._value = this._value.replace(arg, args[arg]);
        return this._value;
    }
    
    //   public function save($path){
    //     if(\Candy::var($path)->contains('/')){
    //       $exp = explode('/',$path);
    //       unset($exp[count($exp) - 1]);
    //       $dir = '';
    //       foreach($exp as $key){
    //         $dir .= ($dir === '' ? '' : '/').$key;
    //         if(!file_exists($dir) || !is_dir($dir)) mkdir($dir);
    //       }
    //     }
    //     return file_put_contents($path,$this->str);
    //   }
    
    //   public function slug($separator = '-'){
    //     $str = $this->str;
    //     $str = preg_replace('~[^\pL\d]+~u', $separator, $str);
    //     $str = iconv('utf-8', 'us-ascii//TRANSLIT', $str);
    //     $str = preg_replace('~[^-\w]+~', '', $str);
    //     $str = trim($str, $separator);
    //     $str = preg_replace('~-+~', $separator, $str);
    //     $str = strtolower($str);
    //     if(empty($str)) return '';
    //     return $str;
    //   }
    
    //   public function format($format){
    //     $str = $this->str;
    //     $result = '';
    //     $letter = 0;
    //     for ($i=0; $i < strlen($format); $i++) {
    //       if(substr($format,$i,1)=='?'){
    //         $result .= substr($str,$letter,1);
    //         $letter = $letter + 1;
    //       }elseif(substr($format,$i,1)=='*'){
    //         $result .= substr($str,$letter);
    //         $letter = $letter + strlen(substr($str,$letter));
    //       }else{
    //         $result .= substr($format,$i,1);
    //       }
    //     }
    //     return $result;
    //   }
};