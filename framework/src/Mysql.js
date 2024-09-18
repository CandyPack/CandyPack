'use strict';
const mysql = require('mysql2');

class Raw {
    constructor(value){
        this.value = value;
    }
}

class Mysql {
    #conn;
    #database;
    #table          = [];
    #arr            = {};
    #stack          = [];
    #statements     = ['=','>','>=','<','<=','!=','LIKE','NOT LIKE','IN','NOT IN','BETWEEN','NOT BETWEEN','IS','IS NOT'];

    constructor(table, conn){
        this.#conn  = conn;
        this.#stack = new Error().stack.split('\n').splice(3);
        if(table){
            this.#arr.table = table;
            this.#define(table);
        }
    }

    //     function having(){
    //       if(count(func_get_args()) == 1 && !is_array(func_get_args()[0])){
    //         $this->arr['having'] = is_numeric(func_get_args()[0]) ? "id='".func_get_args()[0]."'" : "";
    //       }elseif(count(func_get_args()) > 0){
    //         $this->arr['having'] = isset($this->arr['having']) && trim($this->arr['having'])!='' ? $this->arr['having'].' AND '.$this->whereExtract(func_get_args()) : $this->whereExtract(func_get_args());
    //       }
    //       return new static($this->table,$this->arr);
    //     }

    //     function whereJson($col,$val){
    //       //return 'JSON_SEARCH('.$col.', "one", "'.$val.'") IS NOT NULL';
    //       return new static($this->table,$this->arr);
    //     }
    //     function cache($t=3600){
    //       if(!is_numeric($t)){
    //         $exp = explode(' ',str_replace('  ',' ',$t));
    //         if($exp[1] == 'second') $t = intval(trim($exp[0]));
    //         if($exp[1] == 'minute') $t = intval(trim($exp[0])) * 60;
    //         if($exp[1] == 'hour')   $t = intval(trim($exp[0])) * 60 * 60;
    //         if($exp[1] == 'day')    $t = intval(trim($exp[0])) * 60 * 60 * 24;
    //         if($exp[1] == 'week')   $t = intval(trim($exp[0])) * 60 * 60 * 24 * 7;
    //         if($exp[1] == 'month')  $t = intval(trim($exp[0])) * 60 * 60 * 24 * 30;
    //         if($exp[1] == 'year')   $t = intval(trim($exp[0])) * 60 * 60 * 24 * 365;
    //       }
    //       $this->arr['cache'] = $t;
    //       return new static($this->table,$this->arr);
    //     }

    async #define(table){
        return new Promise(async (resolve, reject) => {
            if(!Candy.Mysql.db[this.#database]) Candy.Mysql.db[this.#database] = {};
            this.#table[table] = Candy.Mysql.db[this.#database][table];
            if(this.#table[table]) return resolve(true);
            let columns = [];
            this.#conn.query(`SHOW COLUMNS FROM ${this.escape(table,'table')}`, (err, result) => {
                if(err) return reject(err);
                for(let get of result){
                    columns[get.Field] = get;
                    if(get.Key == 'PRI'){
                    if(!this.#table[table]) this.#table[table] = {};
                    this.#table[table].primary = get.Field;
                    }
                }
                this.#table[table].columns = columns;
                Candy.Mysql.db[this.#database][table] = this.#table[table];
                return resolve(true);
            });
        });    
    }

    async delete(b){
        return new Promise(async (resolve, reject) => {
            let query = this.query('delete');
            let run = this.run(query);
            //       $sql = mysqli_query(Mysql::$conn, $query);
            //       $this->affected = mysqli_affected_rows(Mysql::$conn);
            //       if($this->affected > 0) self::clearcache();
            //       return new static($this->table,$this->arr, ['affected' => $this->affected]);
            return this;
        });
    }

    #error(err, query){
        err = 'CandyPack Mysql Error: ' + (err?.message ?? 'Unknown error').trim() + '\n';
        if(query) err += 'Query: ' + query + '\n';
        while(this.#stack.length > 0){
            let line = this.#stack.shift().replace('at','');
            if(line.includes('/node_modules/candypack/framework/src/')) break;
            else if(!line.includes('(node:')) err += line + '\n';
        }
        console.error(err);
        return false;
    }

    first(b = false) {
        return new Promise(async (resolve, reject) => {
        this.#arr.limit = 1;
        this.get(b)
            .then(sql => {
                if (sql === false || !sql[0]) return resolve(false);
                return resolve(sql[0]);
            })
            .catch(reject);
        });
    }

    escape(v, type){
        if(!type) type = 'value';
        if(v && v instanceof Raw) return ' ' + v.value + ' ';
        if(type == 'value'){
            if(v === null) return 'NULL';
            //     if(is_array($v)) return ' ("'.implode('","',array_map(function($val){return(Mysql::escape($val));},$v)).'") ';
            return `${mysql.escape(v)}`;
        } else if(type == 'table'){
            let as = "";
            //     if(is_array($v)){
            //       $as = array_values($v)[0];
            //       $v = array_keys($v)[0];
            //       $as = " `$as` ";
            //     }
            //     if(strpos($v,'.') !== false) return ' `'.implode('`.`',array_map(function($val){return(Mysql::escape($val));},explode('.',$v))).'` '.$as;
            return '`' + mysql.escape(v).replace(/'/g, "") + '`' + as;
        } else if(type == 'col'){
            let as = "";
            if(Array.isArray(v)){
                //       $as = array_values($v)[0];
                //       $v = array_keys($v)[0];
                //       $as = "AS \"$as\" ";
            }
            //     if(strpos($v,'.') !== false) return ' `'.implode('`.`',array_map(function($val){return(Mysql::escape($val));},explode('.',$v))).'` '.$as;
            return '`' + mysql.escape(v).replace(/'/g, "") + '`' + as;
        } else if(type == 'statement' || type == 'st'){
            return this.#statements.includes(v.toUpperCase()) ? v.toUpperCase() : "=";
        }
    }

    async get(b){
        return new Promise(async (resolve,reject)=>{
            if(!b) b = false;
            let data = [];
            // if(isset($this->arr['cache'])){
            //   $md5_query = md5($query);
            //   $md5_table = md5($this->arr['table']);
            //   $file = "cache/mysql/".md5(Mysql::$name)."/$md5_table"."_$md5_query";
            //   $cache = Candy::storage($file)->get('cache');
            //   if(isset($cache->date) && ($cache->date >= (time() - $this->arr['cache']))) return $cache->data;
            // }
            let query = this.query('get');
            let sql = await this.run(query);
            //   console.log(sql);
            if(sql === false) return resolve(this.#error());
            for(let row of sql){
                for(let [key, value] of Object.entries(row)) row[key] = await this.type(key, value);
                data.push(row);
            }
            // while($row = mysqli_fetch_assoc($sql)){
            //   foreach($row as $key => $value) $row[$key] = $this->type($key, $value);
            //   $data[] = $b ? $row : (object)$row;
            // }
            // mysqli_free_result($sql);
            // if(isset($cache)){
            //   $cache->data = $data;
            //   $cache->date = time();
            //   Candy::storage($file)->set('cache', $cache);
            // }
            return resolve(data);
        });
    }

    async insert(arr){
        return new Promise(async(resolve, reject) => {
            this.id = 1;
            let ext = await this.#valuesExtract(arr);
            this.#arr['into'] = ext['into'];
            this.#arr['values'] = ext['values'];
            let query = this.query('insert');
            let run = this.run(query);
            //   if($sql === false) return $this->error();
            //   $this->success = $sql;
            //   $this->id = mysqli_insert_id(Mysql::$conn);
            // $this->affected = mysqli_affected_rows(Mysql::$conn);
            // if(this.affected > 0) this.clearcache();
            return resolve(this);
        });
    }

    insertIgnore(arr){
        this.#arr.ignore = true;
        return this.insert(arr);
    }

    order(v1,v2='asc'){
      // if(is_array($v1) && (!isset($v1['ct']) || $v1['ct'] != $GLOBALS['candy_token_mysql'])){
      //   $order = [];
      //   foreach($v1 as $key => $val)
      //   if(!is_int($key)) $order[] = $this->escape($key,'col').(strtolower($val) == 'desc' ? ' DESC' : ' ASC');
      //   else $order[] = $this->escape($val,'col').' ASC';
      //   $this->arr['order by'] = implode(',',$order);
      // }else $this->arr['order by'] = $this->escape($v1,'col').(strtolower($v2) == 'desc' ? ' DESC' : ' ASC');
      return this;
    }

    orWhere(...args){
        this.#arr.where = this.#arr.where && this.#arr.where.trim() != '' ? `${this.#arr.where} OR ${this.#whereExtract(args)}` : this.#whereExtract(args);
        return this;
    }


    async replace(arr){
        return new Promise(async (resolve, reject) => {
            //       $this->id = 1;
            let ext = await this.#valuesExtract(arr);
            this.#arr['into'] = ext['into'];
            this.#arr['values'] = ext['values'];
            let query = this.query('replace');
            let run = await this.run(query);
            //       if($sql === false) return $this->error();
            //       $this->success = $sql;
            //       $this->id = mysqli_insert_id(Mysql::$conn);
            //       self::clearcache();
            return resolve(this);
        });
    }

    async rows(b){
        return new Promise(async (resolve, reject) => {
            //       if(isset($this->arr['cache'])){
            //         $md5_query = md5($query);
            //         $md5_table = md5($this->arr['table']);
            //         $file = "cache/mysql/".md5(Mysql::$name)."/$md5_table"."_$md5_query"."_r";
            //         $cache = Candy::storage($file)->get('cache');
            //         if(isset($cache->date) && ($cache->date >= (time() - $this->arr['cache']))) return $cache->data;
            //       }
            let query = this.query('get');
            let sql = await this.run(query);
            if(sql === false) return resolve(this.#error());
            let rows = sql.length;
            //       if(isset($cache)){
            //         $cache->data = $rows;
            //         $cache->date = time();
            //         Candy::storage($file)->set('cache', $cache);
            //       }
            return resolve(rows);
        });
    }

    run(query){
        return new Promise((resolve, reject) => {
            if(!query) return false;
            if(this.#conn.state == 'disconnected') Candy.Mysql.init();
            this.#conn.query(query, (err, result) => {
                if(err) return resolve(this.#error(err, query));
                return resolve(result);
            });
        });
    }

    async set(arr, val){
        return new Promise(async (resolve, reject) => {
            let vars = '';
            if(!['array','object'].includes(typeof arr) && val !== undefined) vars += this.escape(arr,'col') + ' = ' + this.escape(await this.type(arr, val, 'encode')) + ',';
            else for(let [key, value] of Object.entries(arr)) vars += this.escape(key,'col') + ' = ' + this.escape(await this.type(key, value, 'encode')) + ',';
            this.#arr.set = vars.substring(0, vars.length - 1);
            let query = this.query('set');
            let run = await this.run(query);
            if(run === false) return resolve(this.#error());
            this.affected = run.affectedRows;
            if(this.affected > 0) this.#clearcache();
            return resolve(this);
        });
    }


    //     function select(){
    //       $this->arr['select'] = isset($this->arr['select']) ? $this->arr['select'] : '';
    //       $select = array_filter(explode(',',$this->arr['select']));
    //       if(count(func_get_args())==1 && is_array(func_get_args()[0])){
    //         if(isset(func_get_args()[0]['ct']) && isset(func_get_args()[0]['v']) && func_get_args()[0]['ct'] == $GLOBALS['candy_token_mysql']){
    //           $select[] = func_get_args()[0]['v'];
    //         }else{
    //           foreach(func_get_args()[0] as $key => $value){
    //             if(!is_int($key)) $select[] = $this->escape($key,'col').' AS '.$this->escape($value);
    //             else $select[] = $this->escape($value,'col');
    //           }
    //         }
    //       }else{
    //         foreach(func_get_args() as $key){
    //           $select[] = $this->escape($key,'col');
    //         }
    //       }
    //       $this->arr['select'] = implode(', ',$select);
    //       return new static($this->table,$this->arr);
    //     }

    //     function groupBy(){
    //       $this->arr['group by'] = isset($this->arr['group by']) ? $this->arr['group by'] : '';
    //       $select = array_filter(explode(',',$this->arr['group by']));
    //       if(count(func_get_args())==1 && is_array(func_get_args()[0])){
    //         if(isset(func_get_args()[0]['ct']) && isset(func_get_args()[0]['v']) && func_get_args()[0]['ct'] == $GLOBALS['candy_token_mysql']){
    //           $select[] = func_get_args()[0]['v'];
    //         }else{
    //           foreach(func_get_args()[0] as $key => $value){
    //             $select[] = $this->escape($value,'col');
    //           }
    //         }
    //       }else foreach(func_get_args() as $key) $select[] = $this->escape($key,'col');
    //       $this->arr['group by'] = implode(', ',$select);
    //       return new static($this->table,$this->arr);
    //     }
    //     function limit($v1,$v2=null){
    //       $this->arr['limit'] = $v2===null ? $v1 : "$v1, $v2";
    //       return new static($this->table,$this->arr);
    //     }
    //     function leftJoin($tb,$col1,$st=null,$col2=null){
    //       return $this->join($tb,$col1,$st,$col2,'left join');
    //     }
    //     function rightJoin($tb,$col1,$st=null,$col2=null){
    //       return $this->join($tb,$col1,$st,$col2,'right join');
    //     }
    //     function join($tb,$col1,$st=null,$col2=null,$type='inner join'){
    //       $this->arr[$type] = isset($this->arr[$type]) ? $this->arr[$type] : [];
    //       $this->define(is_array($tb) ? array_keys($tb)[0] : $tb);
    //       $tb = $this->escape($tb,'table');
    //       if($st===null && $col2===null){
    //         $col1 = self::whereExtract($col1);
    //         $col2 = '';
    //         $state = '';
    //       }else{
    //         $col1 = $this->escape($col1,'col');
    //         $col2 = $this->escape(($col2 !== null ? $col2 : $st),'col');
    //         $state = $this->escape(($col2 !== null ? $st : '='),'st');
    //       }
    //       $this->arr[$type][] = $tb . ' ON ' . $col1 . $state . $col2;
    //       return new static($this->table,$this->arr);
    //     }
    //     function login($tb_token = 'candy_token', $key = 'id'){
    //       $sql = $this->first();
    //       if($sql === false) return false;
    //       return new static($this->table,$this->arr);
    //     }

    #clearcache(){
    //       if(!isset($this->arr['table'])) return false;
    //       $md5_table = md5($this->arr['table']);
    //       $file = "storage/cache/mysql/".md5(Mysql::$name)."/$md5_table*";
    //       foreach(glob($file) as $key) unlink($key);
        return true;
    }

    query(type = 'get'){
        const arr_q = ['inner join', 'right join', 'left join', 'where','group by','having','order by','limit'];
        let query = "";
        for(let key of arr_q) {
        if(this.#arr[key]){
            if(Array.isArray(this.#arr[key])){
                query += " " + key.toUpperCase() + " " + this.#arr[key].join(" " + strtoupper(key) + " ");
            }else{
                query += key.toUpperCase() + " ";
                query += this.#arr[key];
            }
        }
        }
        switch(type){
            case 'get'    : query = `SELECT ${this.#arr.select ? this.#arr.select : '*'} FROM ${this.escape(this.#arr.table,'table')} ${query}`; break;
            case 'set'    : query = `UPDATE ${this.escape(this.#arr['table'],'table')} SET ${this.#arr['set']} ${query}`; break;
            case 'insert' : query = `INSERT ${this.#arr.ignore ? 'IGNORE' : ''} INTO ${this.escape(this.#arr.table,'table')} ${this.#arr.into} VALUES ${this.#arr.values}`; break;
            case 'delete' : query = `DELETE FROM ${this.escape(this.#arr.table,'table')} ${query}`; break;
            case 'replace': query = `REPLACE INTO ${this.escape(this.#arr.table,'table')} ${this.#arr.into} VALUES ${this.#arr.values}`; break;
        }
        return query;
    }

    async type(col, value, action = 'decode'){
        return new Promise(async (resolve, reject) => {
            if(!this.types) this.types = {};
            if(!this.types[col]) {
                this.types[col] = 'string';
                for (const key of Object.keys(this.#table)) {
                    if(!this.#table[key]) await this.#define(key);
                    if(!this.#table[key]) throw new Error(`Table ${key} not found`);
                    if(!this.#arr.select && this.#table[key].columns[col].Type){
                        this.types[col] = this.#table[key].columns[col].Type ?? this.types[col];
                        break;
                    } else if(!this.#arr.select){
                        continue;
                    } else if(Candy.Var(this.#arr.select).contains(" AS \"" + col + "\"")){
                        // $exp = explode(' ,',explode(" AS \"$col\"",$this->arr['select'])[0]);
                        //       $real_col = explode('.',Candy::var(trim(end($exp)))->clear('`'));
                        //       $real_table = trim($real_col[0]);
                        //       $real_col = trim($real_col[1]);
                        //       $this->types[$col] = $this->types[$col] = $this->table[$real_table]['columns'][$real_col]['Type'] ?? $this->types[$col];
                        break;
                    } else if(Candy.Var(this.#arr.select).containsAny(" `" + col + "`", " `" + key + "`.`" + col + "`")){
                        this.types[col] = table.columns[col].Type ?? this.types[col];
                    }
                }
            }
            if(action == 'decode'){
                    if(Candy.Var(this.types[col]).isBegin('tinyint(1)')) value = value ? true : false;
                else if(Candy.Var(this.types[col]).isBegin('int'))        value = parseInt(value);
                else if(Candy.Var(this.types[col]).isBegin('double'))     value = parseFloat(value);
                else if(Candy.Var(this.types[col]).isBegin('float'))      value = parseFloat(value);
                else if(Candy.Var(this.types[col]).isBegin('boolean'))    value = parseInt(value);
                else if(Candy.Var(this.types[col]).isBegin('json'))       value = JSON.parse(value);
            } else if(!(value instanceof Raw)){
                    if(Candy.Var(this.types[col]).isBegin('tinyint(1)'))  value = parseInt(value);
                else if(Candy.Var(this.types[col]).isBegin('int'))        value = parseInt(value);
                else if(Candy.Var(this.types[col]).isBegin('double'))     value = parseFloat(value);
                else if(Candy.Var(this.types[col]).isBegin('float'))      value = parseFloat(value);
                else if(Candy.Var(this.types[col]).isBegin('boolean'))    value = parseInt(value);
                else if(Candy.Var(this.types[col]).isBegin('json'))       value = JSON.stringify(value);
                else if(Candy.Var(this.types[col]).isBegin('date', 'datetime', 'timestamp')) value = Candy.Var(value).date('Y-m-d H:i:s');
            }
            return resolve(value);
        });
    }

    async #valuesExtract(arr){
        return new Promise(async (resolve, reject) => {
            let query_key = [];
            let query_val = [];
            let multiple = false;
            let keys = Object.keys(arr);
            for(let i=0;i<keys.length;i++){
                let key = keys[i];
                let val = arr[key];
                //     if(is_object($val)) $val = (array)$val;
                //     if(is_array($val) && !isset($this->table[$this->arr['table']]['columns'][$key]) && (!isset($val['ct']) || $val['ct']!=$GLOBALS['candy_token_mysql'])){
                //       $multiple = true;
                //       $ex = $this->valuesExtract($val);
                //       $query_key = $ex['into'];
                //       $query_val[] = $ex['values'];
                /*     }else */if(val === null){
                    query_key.push(this.escape(key,'col'));
                    query_val.push('NULL');
                }else{
                    query_key.push(this.escape(key,'col'));
                    query_val.push(this.escape(await this.type(key,val,'encode')));
                }
            }
            return resolve({
                'into'  : !multiple ? `(${query_key.join(',')})` : query_key,
                'values': !multiple ? `(${query_val.join(',')})` : query_val.join(',')
            });
        });
    }

    where(...args){
        if(args.length == 1 && !['array','object'].includes(typeof args[0]) && !(args[0] instanceof Raw)){
            this.#arr.where = this.#whereExtract([this.#table[this.#arr.table].primary, args[0]]);
        }else if(args.length > 0){
            this.#arr.where = this.#arr.where && this.#arr.where.trim() != '' ? `${this.#arr.where} AND ${this.#whereExtract(args)}` : this.#whereExtract(args);
        }
        return this;
    }

    #whereExtract(arr){
        let q = "";
        let loop = 1;
        let in_arr = false;
        let state = '=';
        let last = 0;
        for (const key of arr) {
            if(key && ['array','object'].includes(typeof key) && (state != 'IN' && state != 'NOT IN') && !(key instanceof Raw)){
                q += last == 1 ? ' AND ' + this.#whereExtract(key) : this.#whereExtract(key);
                in_arr = true;
                last = 1;
            }else if(arr.length == 2 && loop == 2){
                if(!['object','array'].includes(typeof key) && this.#statements.includes(key.toString().toUpperCase())){
                    q += " " + key.toString().toUpperCase();
                }else{
                    q += " = " + this.escape(key);
                }
            }else if(in_arr){
                $q += key.toUpperCase() == 'OR' ? " OR " : " AND ";
                last = 2;
            }else if(arr.length == 3 && loop == 2){
                state = this.#statements.includes(key.toUpperCase()) ? key.toUpperCase() : "=";
                q += " " + state;
                last = 1;
            }else if(key === null){
                q += " NULL ";
            }else{
                q += this.escape(key,(loop==1 ? 'table' : 'value'));
                last = 1;
            }
            loop++;
        }
        return `(${q})`;
    }
}


module.exports = {
    conn: {},
    db  : {},
    init: function(){
        if(!Candy.Config.database) return;
        let multiple = typeof Candy.Config.database[Object.keys(Candy.Config.database)[0]] === 'object';
        let dbs = multiple ? Candy.Config.database : {'default': Candy.Config.database};
        for(let key of Object.keys(dbs)){
            let db = dbs[key];
            if(db.type && db.type != 'mysql') continue;
            Candy.Mysql.conn[key] = mysql.createConnection({
                host    : db.host ?? "127.0.0.1",
                user    : db.user,
                password: db.password,
                database: db.database
            });
            Candy.Mysql.conn[key].connect();
            Candy.Mysql.conn[key].query('SHOW TABLES', (err, result) => {
                if(err){
                    console.error('Mysql Connection Error', err);
                    return;
                }
                for(let table of result) for(let key of Object.keys(table)){
                    let t = new Mysql(table[key], Candy.Mysql.conn['default']);
                }
            });
        }
    },
    database: function(name){
        return new Mysql(name, Candy.Mysql.conn[name]);
    },
    run: function(query){
        return new Mysql(null, Candy.Mysql.conn['default']).run(query);
    },
    table: function(name){
        return new Mysql(name, Candy.Mysql.conn['default']);
    },
    raw: function(query){
        return new Raw(query);
    }
};
