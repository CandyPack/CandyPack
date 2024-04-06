class Validator {
    // private $_name = '';
    // private $_request = null;
    // private $_error = false;
    // private $_message = [];
    // private $_method = [];
    // private $_type = 'post';

    // function __construct($name='',$request=null,$error=false,$message=[],$method=[]){
    //     $this->_name = $name;
    //     $this->_request = $request;
    //     $this->_error = $error;
    //     $this->_message = $message;
    //     $this->_method = $method;
    // }


    check(rules){
    //     if(is_bool($c) || is_a($c,'Mysql_Table')){
    //     $this->_error = $c === false;
    //     }else{
    //     foreach(explode('|',$c) as $key){
    //         $vars = explode(':',$key);
    //         $else = substr($vars[0],0,1) === '!';
    //         if(!$this->_error && !isset($this->_message[$this->_name])){
    //         switch($else ? substr($vars[0],1) : $vars[0]){
    //             case 'required':
    //             $this->_error = !isset($this->_method[$this->_name]) || $this->_method[$this->_name]=='' || $this->_method[$this->_name]==null;
    //             break;
    //             case 'accepted':
    //             $this->_error = !isset($this->_method[$this->_name]) || ($this->_method[$this->_name]!=1 && $this->_method[$this->_name]!='on' && $this->_method[$this->_name]!='yes' && $this->_method[$this->_name]!=true);
    //             break;
    //             case 'numeric':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && !Candy::var($this->_method[$this->_name])->is('numeric');
    //             break;
    //             case 'alpha':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && !Candy::var($this->_method[$this->_name])->is('alpha');
    //             break;
    //             case 'alphaspace':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && !Candy::var($this->_method[$this->_name])->is('alphaspace');
    //             break;
    //             case 'alphanumeric':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && !Candy::var($this->_method[$this->_name])->is('alphanumeric');
    //             break;
    //             case 'alphanumericspace':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && !Candy::var($this->_method[$this->_name])->is('alphanumericspace');
    //             break;
    //             case 'email':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && !Candy::var($this->_method[$this->_name])->is('email');
    //             break;
    //             case 'ip':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && !Candy::var($this->_method[$this->_name])->is('ip');
    //             break;
    //             case 'float':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && !Candy::var($this->_method[$this->_name])->is('float');
    //             break;
    //             case 'mac':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && !Candy::var($this->_method[$this->_name])->is('mac');
    //             break;
    //             case 'domain':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && !Candy::var($this->_method[$this->_name])->is('domain');
    //             break;
    //             case 'url':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && !Candy::var($this->_method[$this->_name])->is('url');
    //             break;
    //             case 'username':
    //             $this->_error = isset($this->_method[$this->_name]) && !(ctype_alnum($this->_method[$this->_name]));
    //             break;
    //             case 'xss':
    //             $this->_error = isset($this->_method[$this->_name]) && (strip_tags($this->_method[$this->_name]) != $this->_method[$this->_name]);
    //             break;
    //             case 'usercheck':
    //             $this->_error = isset($this->_method[$this->_name]) && !Auth::check();
    //             break;
    //             case 'array':
    //             $this->_error = isset($this->_method[$this->_name]) && !is_array($this->_method[$this->_name]);
    //             break;
    //             case 'date':
    //             $this->_error = isset($this->_method[$this->_name]) && (strtotime($this->_method[$this->_name]) === false || !(strtotime($this->_method[$this->_name])>strtotime(0)));
    //             break;
    //             case 'min':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && isset($vars[1]) && $this->_method[$this->_name]<$vars[1];
    //             break;
    //             case 'max':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && isset($vars[1]) && $this->_method[$this->_name]>$vars[1];
    //             break;
    //             case 'len':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && isset($vars[1]) && strlen($this->_method[$this->_name])!=$vars[1];
    //             break;
    //             case 'minlen':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && isset($vars[1]) && strlen($this->_method[$this->_name])<$vars[1];
    //             break;
    //             case 'maxlen':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && isset($vars[1]) && strlen($this->_method[$this->_name])>$vars[1];
    //             break;
    //             case 'mindate':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && isset($vars[1]) && strtotime($this->_method[$this->_name])<strtotime($vars[1]);
    //             break;
    //             case 'maxdate':
    //             $this->_error = isset($this->_method[$this->_name]) && $this->_method[$this->_name]!='' && isset($vars[1]) && strtotime($this->_method[$this->_name])>strtotime($vars[1]);
    //             break;
    //             case 'same':
    //             $this->_error = isset($this->_method[$this->_name]) && isset($this->_method[$vars[1]]) && $this->_method[$this->_name]!==$this->_method[$vars[1]];
    //             break;
    //             case 'different':
    //             $this->_error = isset($this->_method[$this->_name]) && isset($this->_method[$vars[1]]) && $this->_method[$this->_name]==$this->_method[$vars[1]];
    //             break;
    //             case 'equal':
    //             $this->_error = isset($this->_method[$this->_name]) && isset($vars[1]) && $this->_method[$this->_name]!==$vars[1];
    //             break;
    //             case 'notin':
    //             $this->_error = isset($this->_method[$this->_name]) && isset($vars[1]) && (strpos($this->_method[$this->_name], $vars[1])!==false);
    //             break;
    //             case 'in':
    //             $this->_error = isset($this->_method[$this->_name]) && isset($vars[1]) && (!(strpos($this->_method[$this->_name], $vars[1])!==false));
    //             break;
    //             case 'not':
    //             $this->_error = isset($this->_method[$this->_name]) && isset($vars[1]) && $this->_method[$this->_name]==$vars[1];
    //             break;
    //             case 'regex':
    //             $this->_error = isset($this->_method[$this->_name]) && isset($vars[1]) && empty(preg_match("/".$vars[1]."/", $this->_method[$this->_name]));
    //             break;
    //             case 'user':
    //             $user_data = Auth::user($vars[1]);
    //             if(Candy::string($user_data)->is('bcrypt')) $this->_error = isset($this->_method[$this->_name]) && (!Auth::check() || !Candy::hash($this->_method[$this->_name], $user_data));
    //             else if(Candy::string($user_data)->is('md5'))    $this->_error = isset($this->_method[$this->_name]) && (!Auth::check() || !md5($this->_method[$this->_name]) == $user_data);
    //             else $this->_error = isset($this->_method[$this->_name]) && (!Auth::check() || $this->_method[$this->_name] != Auth::user($vars[1]));
    //             break;
    //         }
    //         if($else) $this->_error = !$this->_error;
    //         }
    //     }
    //     }
    //     return new static($this->_name,$this->_request,$this->_error,$this->_message,$this->_method,$this->_type);
        return this;
    }

    // function validator($m){
    //     $this->_request = $m;
    //     return new static($this->_name,$this->_request,$this->_error,$this->_message,$this->_method,$this->_type);
    // }

    // function var($n,$v=null){
    //     $this->_method = [$n => ($v === null ? $n : $v)];
    //     $this->_name = $n;
    //     $this->_error = false;
    //     $this->_type = $n;
    //     return new static($this->_name,$this->_request,$this->_error,$this->_message,$this->_method,$this->_type);
    // }

    post(key){
    //     $this->_method=$_POST;
    //     $this->_name=$n;
    //     $this->_error = false;
    //     $this->_type = 'POST';
    //     return new static($this->_name,$this->_request,$this->_error,$this->_message,$this->_method,$this->_type);
        return this;
    }

    // function get($n){
    //     $this->_method=$_GET;
    //     $this->_name=$n;
    //     $this->_error = false;
    //     $this->_type = 'GET';
    //     return new static($this->_name,$this->_request,$this->_error,$this->_message,$this->_method,$this->_type);
    // }

    // function file($n){
    //     $this->_method=$_FILES;
    //     $this->_name=$n;
    //     $this->_error = false;
    //     $this->_type = 'FILES';
    //     return new static($this->_name,$this->_request,$this->_error,$this->_message,$this->_method,$this->_type);
    // }

    message(value){
    //     if($this->_error && !isset($this->_message[$this->_name])){
    //     $this->_message[$this->_name] = $m;
    //     $this->_error = false;
    //     }
        return this;
    }

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

    // function validate($m=null,$data = []){
    //     switch($this->_request){
    //     case 'ajax':
    //         if(!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest'){
    //         Candy::abort(404);
    //         }else{
    //         $result['success']['result'] = count($this->_message)==0;
    //         $result['success']['message'] = count($this->_message)==0 ? $m : '';
    //         $result['data'] = count($this->_message)==0 ? $data : [];
    //         $result['errors'] = isset($this->_message['_candy_form']) ? ['_candy_form' => $this->_message['_candy_form']] : $this->_message;
    //         if(!$result['success']['result']){
    //             Candy::return($result);
    //             die();
    //         }elseif($result['success']['message']!==null){
    //             Candy::return($result);
    //         }
    //         }
    //         break;
    //     default:
    //     }
    //     $GLOBALS['_candy']['oneshot']['_validation'] = $this->_message;
    //     return $this->_message;
    // }
    
    result(v){
    //     return isset($_SESSION['_candy']['oneshot']['_validation'][$v]) ? $_SESSION['_candy']['oneshot']['_validation'][$v] : false;
    }
};

module.exports = Validator;