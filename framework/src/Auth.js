class Auth {
    #request = null;
    #table   = null;
    #user    = null;

    constructor(request){
        this.#request = request;
    }

    async check(where) {
        return new Promise(async (resolve, reject) => {
            if(Candy.Config.auth.table) this.#table = Candy.Config.auth.table;
            if(!this.#table) return resolve(false);
            if(where) {
                let sql = Candy.Mysql.table(this.#table);
                for(let key in where) sql = sql.orWhere(key, (where[key] instanceof Promise ? await where[key] : where[key]));
                if(!sql.rows()) return resolve(false);
                let get = await sql.get();
                let equal = false;
                for(var user of get) {
                    equal = Object.keys(where).length > 0;
                    for(let key of Object.keys(where)) {
                        if(where[key] instanceof Promise) where[key] = await where[key];
                        if(!user[key]) equal = false;
                        if(user[key] === where[key]) equal = equal && true;
                        else if(Candy.Var(user[key]).is('bcrypt')) equal = equal && Candy.Var(user[key]).hashCheck(where[key]);
                        else if(Candy.Var(user[key]).is('md5'))    equal = equal && md5(where[key]) === user[key];
                    }
                    if(equal) break;
                }
                if(!equal) return resolve(false);
                return resolve(user);
            } else if(this.#user) {
                return resolve(true);
            } else {
                let check_table = await Candy.Mysql.run('SHOW TABLES LIKE "' + this.#table + '"', true);
                if(check_table.length == 0) return resolve(false);
                let candy_x = this.#request.cookie('candy_x');
                let candy_y = this.#request.cookie('candy_y');
                let browser = this.#request.header('user-agent');
                if(!candy_x || !candy_y || !browser) return resolve(false);
                let sql_token = await Candy.Mysql.table(Candy.Config.auth.token).where(['token_x', candy_x], ['browser', browser]).get();
                if(sql_token.length !== 1) return resolve(false);
                if(!Candy.Var(sql_token[0].token_y).hashCheck(candy_y)) return resolve(false);
                this.#user = await Candy.Mysql.table(this.#table).where(Candy.Config.auth.key, sql_token[0].user).first();
                // Candy.Mysql.table(Candy.Config.auth.token).where(sql_token[0].id).set({'ip': this.#request.ip,'active': Date.now()});
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
            let check_table = await Candy.Mysql.run('SHOW TABLES LIKE "' + token + '"');
            if(check_table.length == 0) await Candy.Mysql.run('CREATE TABLE ' + token + ' (id INT NOT NULL AUTO_INCREMENT, user INT NOT NULL, token_x VARCHAR(255) NOT NULL, token_y VARCHAR(255) NOT NULL, browser VARCHAR(255) NOT NULL, ip VARCHAR(255) NOT NULL, `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `active` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id))');
            let token_y = Candy.Var(this.#request.id + this.#request.ip).md5();
            let cookie = {
                user    : user[key],
                token_x : Candy.Var(Math.random().toString() + Date.now().toString()).md5(),
                token_y : Candy.Var(token_y).hash(),
                browser : this.#request.header('user-agent'),
                ip      : this.#request.ip
            };
            this.#request.cookie('candy_x', cookie.token_x, {httpOnly: true, secure: true, sameSite: 'Strict'});
            this.#request.cookie('candy_y', token_y,        {httpOnly: true, secure: true, sameSite: 'Strict'});
            let sql = Candy.Mysql.table(token).insert(cookie);
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
    
    user(col) {
        if(!this.#user) return false;
        if(col === null) return this.#user;
        else return this.#user[col];
    }
}

module.exports = Auth;