class Auth {
    #table = null;
    #user  = null;

    async check(where) {
        return new Promise(async (resolve, reject) => {
            if(Candy.Config.auth.table) this.#table = Candy.Config.auth.table;
            if(!this.#table) return resolve(false);
            if(where) {
                let sql = Candy.Mysql.table(this.#table);
                for(let key in where) sql = sql.where(key, (where[key] instanceof Promise ? await where[key] : where[key]));
                if(!sql.rows()) return resolve(false);
                let get = await sql.get();
                for(let user of get) {
                    let equal = Object.keys(where).length > 0;
                    for(let key in Object.keys(where)) {
                        if(!user[key]) equal = false;
                        if(user[key] === where[key]) equal = equal && true;
                        else if(Candy.String(user[key]).is('bcrypt')) equal = equal && Candy.Hash(where[key], user[key]);
                        else if(Candy.String(user[key]).is('md5')) equal = equal && md5(where[key]) === user[key];
                    }
                    if(equal) break;
                }
                if(!equal) return resolve(false);
                return resolve(user);
            } else if(this.#user) {
                return resolve(true);
            } else {
                let check_table = Candy.Mysql.query('SHOW TABLES LIKE "' + this.#table + '"', true);
                if(check_table.rows == 0) return resolve(false);
                if(!this.request.cookies.token1 || !this.request.cookies.token2 || !this.request.headers['user-agent']) return false;
                let token1 = this.request.cookies('token1');
                let token2 = this.request.cookies('token2');
                let browser = this.request.header('user-agent');
                let sql_token = Candy.Mysql.table(Candy.Config.auth.token).where(['token1', token1], ['token2', token2], ['browser', browser]);
                if(sql_token.rows() != 1) return resolve(false);
                let get_token = sql_token.first();
                let ip_update = get_token.date && (Candy.dateFormatter(get_token.date, 'YmdH') + 1 < date('YmdH')) ? sql_token.set({'ip': this.request.ip}) : false;
                this.#user = Candy.Mysql.table(this.#table).where(Candy.Config.auth.key, get_token.userid).first();
                return resolve(true);
            }
        });
    }
    
    async login(where) {
        return new Promise(async (resolve, reject) => {
            this.#user = null;
            let user = await this.check(where);
            if(!user) return resolve(false);
            let key = Candy.Config.auth.key;
            let token = Candy.Config.auth.token;
            let table = Candy.Config.auth.table;
            let check_table = Candy.Mysql.query('SHOW TABLES LIKE "' + token + '"', true);
            if(check_table.rows == 0) var sql_create = Candy.Mysql.query('CREATE TABLE ' + token + ' (id INT NOT NULL AUTO_INCREMENT, userid INT NOT NULL, token1 VARCHAR(255) NOT NULL, token2 VARCHAR(255) NOT NULL, browser VARCHAR(255) NOT NULL, ip VARCHAR(255) NOT NULL, `date` TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id))', false);
            let cookie = {
                user   : user[key],
                token1 : Candy.String().uniqid().rand(10000, 99999) + (time() * 100),
                token2 : md5(this.request.ip),
                browser: this.request.header('user-agent'),
                ip     : this.request.ip
            };
            this.request.cookie('token1', cookie.token1, {expires: 60 * 60 * 24 * 365, httpOnly: true, secure: true, sameSite: 'Strict'});
            this.request.cookie('token2', cookie.token2, {expires: 60 * 60 * 24 * 365, httpOnly: true, secure: true, sameSite: 'Strict'});
            check_table = Candy.Mysql.query('SHOW TABLES LIKE "' + token + '"', true);
            if(check_table.rows == 0) Candy.Mysql.query('CREATE TABLE ' + token + ' (id INT NOT NULL AUTO_INCREMENT, userid INT NOT NULL, token1 VARCHAR(255) NOT NULL, token2 VARCHAR(255) NOT NULL, browser VARCHAR(255) NOT NULL, ip VARCHAR(255) NOT NULL, `date` TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id))', false);
            let sql = Candy.Mysql.table(token).add(cookie);
            return resolve(sql !== false);
        });
    }
    
    //   public static function register($vars){
    //     self::$user = false;
    //     switch ($GLOBALS['_candy']['auth']['storage']) {
    //       case 'mysql':
    //         if($GLOBALS['_candy']['auth']['db']) Mysql::connect($GLOBALS['_candy']['auth']['db']);
    //         else Mysql::connect();
    //         $add = Mysql::table($GLOBALS['_candy']['auth']['table'])
    //                     ->add($vars);
    //         if($add === false) return false;
    //         $primary = $GLOBALS['_candy']['auth']['key'];
    //         self::login([$primary => $add->$primary]);
    //         return true;
    //         break;
    
    //       default:
    //         return false;
    //         break;
    //     }
    //   }
    
    //   public static function logout(){
    //     self::$user = false;
    //     Mysql::table($GLOBALS['_candy']['auth']['token'])->where(
    //       ['token1',  $_COOKIE['token1']],
    //       ['token2',  $_COOKIE['token2']],
    //       ['browser', $_SERVER['HTTP_USER_AGENT']]
    //     )->delete();
    //     setcookie("token1", "", time() - 3600);
    //     setcookie("token2", "", time() - 3600);
    //   }
    
    //   public static function user($col = null){
    //     if(empty(self::$user)) self::check();
    //     if(empty(self::$user)) return false;
    //     if($col === null) return self::$user;
    //     else return self::$user->$col;
    //   }    
    
}

module.exports = Auth;