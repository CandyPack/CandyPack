'use strict';
const mysql = require('mysql2');

class Raw {
  constructor(query){
    this.query = query;
  }
  raw(){
    return this.query;
  }
}

class Table {
  conn;
  table;
  arr = {};
  result = {};
  statements = ['=','>','>=','<','<=','!=','LIKE','NOT LIKE','IN','NOT IN','BETWEEN','NOT BETWEEN','IS','IS NOT'];
  val_statements = ['IS NULL','IS NOT NULL'];

  constructor(table, conn){
    this.conn  = conn;
    this.arr.table = table;
    if(!this.table) this.table = [];
    this.define(table);
  }

  run(type = null){
    const arr_q = ['inner join', 'right join', 'left join', 'where','group by','having','order by','limit'];
    let query = "";
    for(let key of arr_q) {
      if(this.arr[key]){
        if(Array.isArray(this.arr[key])){
          query += " " + key.toUpperCase() + " " + this.arr[key].join(" " + strtoupper(key) + " ");
        }else{
          query += " " + key.toUpperCase() + " ";
          query += this.arr[key];
        }
      }
    }
    switch(type){
      case 'get':    query = `SELECT ${this.arr.select ? this.arr.select : '*'} FROM ${this.escape(this.arr.table,'table')} ${query}`; break;
      case 'set':    query = `UPDATE ${this.escape(this.arr['table'],'table')} SET ${this.arr['set']} ${query}`; break;
      case 'insert': query = `INSERT ${this.arr.ignore ? 'IGNORE' : ''} INTO ${this.escape(this.arr.table,'table')} ${this.arr.into} VALUES ${this.arr.values}`; break;
      case 'delete': query = `DELETE FROM ${this.escape(this.arr.table,'table')} ${query}`; break;
      // if($type == 'replace')  return $this->query = "REPLACE INTO ".$this->escape($this->arr['table'],'table').' '.$this->arr['into'].' VALUES '.$this->arr['values'].'';
    }
    return new Promise((resolve, reject) => {
      if(!query) return false;
      this.conn.query(query, (err, result) => {
        if(err){
          console.error(err);
          return reject(false);
        }
        return resolve(result);
      });
    });
    return this;
  }

  where(...args){
    if(args.length == 1 && !['array','object'].includes(typeof args[0])){
      this.arr.where = this.whereExtract([this.table[this.arr.table].primary, args[0]]);
    }else if(args.length > 0){
      this.arr.where = this.arr.where && this.arr.where.trim() != '' ? `${this.arr.where} AND ${this.whereExtract(args)}` : this.whereExtract(args);
    }
    return this;
  }
//     function having(){
//       if(count(func_get_args()) == 1 && !is_array(func_get_args()[0])){
//         $this->arr['having'] = is_numeric(func_get_args()[0]) ? "id='".func_get_args()[0]."'" : "";
//       }elseif(count(func_get_args()) > 0){
//         $this->arr['having'] = isset($this->arr['having']) && trim($this->arr['having'])!='' ? $this->arr['having'].' AND '.$this->whereExtract(func_get_args()) : $this->whereExtract(func_get_args());
//       }
//       return new static($this->table,$this->arr);
//     }
//     function orWhere(){
//       if(count(func_get_args()) > 0){
//         $this->arr['where'] = isset($this->arr['where']) && trim($this->arr['where'])!='' ? $this->arr['where'].' OR '.$this->whereExtract(func_get_args()) : $this->whereExtract(func_get_args());
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
      let sql = await this.run('get');
    //   console.log(sql);
      if(sql === false) return resolve(this.error());
      for(let row of sql){
        for(let [key, value] of Object.entries(row)) row[key] = this.type(key, value);
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
  async delete(b){
    return new Promise(async (resolve, reject) => {
      let query = this.run('delete');
//       $sql = mysqli_query(Mysql::$conn, $query);
//       $this->affected = mysqli_affected_rows(Mysql::$conn);
//       if($this->affected > 0) self::clearcache();
//       return new static($this->table,$this->arr, ['affected' => $this->affected]);
      return this;
    });
  }
//     function rows($b=false){
//       $query = $this->query('get');
//       if(isset($this->arr['cache'])){
//         $md5_query = md5($query);
//         $md5_table = md5($this->arr['table']);
//         $file = "cache/mysql/".md5(Mysql::$name)."/$md5_table"."_$md5_query"."_r";
//         $cache = Candy::storage($file)->get('cache');
//         if(isset($cache->date) && ($cache->date >= (time() - $this->arr['cache']))) return $cache->data;
//       }
//       $sql = mysqli_query(Mysql::$conn, $query);
//       if($sql === false) return $this->error();
//       $rows = mysqli_num_rows($sql);
//       if(isset($cache)){
//         $cache->data = $rows;
//         $cache->date = time();
//         Candy::storage($file)->set('cache', $cache);
//       }
//       return $sql===false ? false : $rows;
//     }
  async set(arr, val){
    let vars = '';
    if(!['array','object'].includes(typeof arr) && val !== undefined) vars += this.escape(arr,'col') + ' = ' + this.escape(this.type(arr, val, 'encode')) + ',';
    else for(let [key, value] of Object.entries(arr)) vars += this.escape(key,'col') + ' = ' + this.escape(this.type(key, value, 'encode')) + ',';
    this.arr.set = vars.substring(0, vars.length - 1);
    let query = this.run('set');
//       if($sql === false) return $this->error();
//       $this->affected = mysqli_affected_rows(Mysql::$conn);
//       if($this->affected > 0) self::clearcache();
//       return new static($this->table,$this->arr, ['affected' => $this->affected]);
  }

  async insert(arr){
    return new Promise((resolve, reject) => {
      this.id = 1;
      let ext = this.valuesExtract(arr);
      this.arr['into'] = ext['into'];
      this.arr['values'] = ext['values'];
      let query = this.run('insert');
      //   if($sql === false) return $this->error();
      //   $this->success = $sql;
      //   $this->id = mysqli_insert_id(Mysql::$conn);
      // $this->affected = mysqli_affected_rows(Mysql::$conn);
      // if(this.affected > 0) this.clearcache();
      return this;
    });
  }

  insertIgnore(arr){
    this.arr.ignore = true;
    return this.insert(arr);
  }

//     function replace($arr){
//       $this->id = 1;
//       $ext = $this->valuesExtract($arr);
//       $this->arr['into'] = $ext['into'];
//       $this->arr['values'] = $ext['values'];
//       $query = $this->query('replace');
//       $sql = mysqli_query(Mysql::$conn, $query);
//       if($sql === false) return $this->error();
//       $this->success = $sql;
//       $this->id = mysqli_insert_id(Mysql::$conn);
//       self::clearcache();
//       return new static($this->table,$this->arr, ['id' => $this->id]);
//     }

  first(b = false) {
    return new Promise(async (resolve, reject) => {
      this.arr.limit = 1;
      this.get(b)
        .then(sql => {
          if (sql === false || !sql[0]) return resolve(false);
          return resolve(sql[0]);
        })
        .catch(reject);
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

  whereExtract(arr){
    let q = "";
    let loop = 1;
    let in_arr = false;
    let state = '=';
    let last = 0;
    for (const key of arr) {
      if(typeof key == 'array' && (state != 'IN' && state != 'NOT IN') && !typeof key.raw !== 'function'){
        q += last == 1 ? ' AND ' + this.whereExtract(key) : this.whereExtract(key);
        in_arr = true;
        last = 1;
      }else if(arr.length == 2 && loop == 2){
        if(!['object','array'].includes(typeof key) && this.statements.includes(key.toString().toUpperCase())){
          q += " " + key.toString().toUpperCase();
        }else{
          q += " =" + this.escape(key);
        }
      }else if(in_arr){
        $q += key.toUpperCase() == 'OR' ? " OR " : " AND ";
        last = 2;
      }else if(arr.length == 3 && loop == 2){
        state = this.statements.includes(key.toUpperCase()) ? key.toUpperCase() : "=";
        q += " " + state;
        last = 1;
      }else if(key === null){
        q += " NULL ";
      }else{
        q += ' '+this.escape(key,(loop==1 ? 'table' : 'value'))+' ';
        last = 1;
      }
        loop++;
    }
    return `(${q})`;
  }

  valuesExtract(arr){
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
        query_val.push(this.escape(this.type(key,val,'encode')));
      }
    }
    return {
      'into'  : !multiple ? `(${query_key.join(',')})` : query_key,
      'values': !multiple ? `(${query_val.join(',')})` : query_val.join(',')
    };
  }

  escape(v, type){
    if(!type) type = 'value';
    if(v && v.raw && typeof v.raw == 'function') return ' ' + v.raw() + ' ';
    if(type == 'value'){
      if(v === null) return 'NULL';
  //     if(is_array($v)) return ' ("'.implode('","',array_map(function($val){return(Mysql::escape($val));},$v)).'") ';
      return ` ${mysql.escape(v)} `;
    }else if(type == 'table'){
      let as = "";
  //     if(is_array($v)){
  //       $as = array_values($v)[0];
  //       $v = array_keys($v)[0];
  //       $as = " `$as` ";
  //     }
  //     if(strpos($v,'.') !== false) return ' `'.implode('`.`',array_map(function($val){return(Mysql::escape($val));},explode('.',$v))).'` '.$as;
      return ' `' + mysql.escape(v).replace(/'/g, "") + '` ' + as;
    }else if(type == 'col'){
      let as = "";
      if(Array.isArray(v)){
  //       $as = array_values($v)[0];
  //       $v = array_keys($v)[0];
  //       $as = "AS \"$as\" ";
      }
  //     if(strpos($v,'.') !== false) return ' `'.implode('`.`',array_map(function($val){return(Mysql::escape($val));},explode('.',$v))).'` '.$as;
      return ' `' + mysql.escape(v).replace(/'/g, "") + '` ' + as;
    }else if(type == 'statement' || type == 'st'){
      return this.statements.includes(v.toUpperCase()) ? v.toUpperCase() : "=";
    }
  }

//     private function clearcache(){
//       if(!isset($this->arr['table'])) return false;
//       $md5_table = md5($this->arr['table']);
//       $file = "storage/cache/mysql/".md5(Mysql::$name)."/$md5_table*";
//       foreach(glob($file) as $key) unlink($key);
//       return true;
//     }

    error($sql){
//       $bt = debug_backtrace();
//       $caller = $bt[1];
//       if(Candy::isDev() && defined('DEV_ERRORS')) printf("Candy Mysql Error: %s\n<br />".$caller['file'].' : '.$caller['line'], mysqli_error(Mysql::$conn));
//       else Config::errorReport('MYSQL',mysqli_error(Mysql::$conn),$caller['file'],$caller['line'],$this->query);
      return false;
    }

  define(table){
    if(!Candy.Config.mysql.db) Candy.Config.mysql.db = {};
    if(!Candy.Config.mysql.db['default']) Candy.Config.mysql.db['default'] = {};
    this.table[table] = Candy.Config.mysql.db['default'][table];
    if(this.table[table]) return;
    let columns = [];
    this.conn.query(`SHOW COLUMNS FROM ${this.escape(table,'table')}`, (err, result) => {
      if(err) return;
      for(let get of result){
        columns[get.Field] = get;
        if(get.Key == 'PRI'){
          if(!this.table[table]) this.table[table] = {};
          this.table[table].primary = get.Field;
        }
      }
      this.table[table].columns = columns;
      Candy.Config.mysql.db['default'][table] = this.table[table];
    });
  }

  type(col, value, action = 'decode'){
    if(!this.types) this.types = {};
    if(!this.types[col]) {
      this.types[col] = 'string';
      for (const key of Object.keys(this.table)) {
        if(!this.table[key]) this.define(key);
        if(!this.table[key]) throw new Error(`Table ${key} not found`);
        if(!this.arr.select && this.table[key].columns[col].Type){
          this.types[col] = this.table[key].columns[col].Type ?? this.types[col];
          break;
        } else if(!this.arr.select){
          continue;
        } else if(Candy.var(this.arr.select).contains(" AS \"" + col + "\"")){
          // $exp = explode(' ,',explode(" AS \"$col\"",$this->arr['select'])[0]);
    //       $real_col = explode('.',Candy::var(trim(end($exp)))->clear('`'));
    //       $real_table = trim($real_col[0]);
    //       $real_col = trim($real_col[1]);
    //       $this->types[$col] = $this->types[$col] = $this->table[$real_table]['columns'][$real_col]['Type'] ?? $this->types[$col];
          break;
        } else if(Candy.var(this.arr.select).containsAny(" `" + col + "`", " `" + key + "`.`" + col + "`")){
          this.types[col] = table.columns[col].Type ?? this.types[col];
        }
      }
    }
    if(action == 'decode'){
             if(Candy.var(this.types[col]).isBegin('tinyint(1)')) value = value ? true : false;
        else if(Candy.var(this.types[col]).isBegin('int'))        value = parseInt(value);
        else if(Candy.var(this.types[col]).isBegin('double'))     value = parseFloat(value);
        else if(Candy.var(this.types[col]).isBegin('float'))      value = parseFloat(value);
        else if(Candy.var(this.types[col]).isBegin('boolean'))    value = parseInt(value);
        else if(Candy.var(this.types[col]).isBegin('json'))       value = JSON.parse(value);
    } else /* if(!is_string($value) && (!is_array($value) || ($value['ct'] ?? 0) != $GLOBALS['candy_token_mysql']))*/ {
           if(Candy.var(this.types[col]).isBegin('tinyint(1)')) value = parseInt(value);
      else if(Candy.var(this.types[col]).isBegin('int'))        value = parseInt(value);
      else if(Candy.var(this.types[col]).isBegin('double'))     value = parseFloat(value);
      else if(Candy.var(this.types[col]).isBegin('float'))      value = parseFloat(value);
      else if(Candy.var(this.types[col]).isBegin('boolean'))    value = parseInt(value);
      else if(Candy.var(this.types[col]).isBegin('json'))       value = JSON.stringify(value);
      else if(Candy.var(this.types[col]).isBegin('date', 'datetime', 'timestamp')) value = Candy.var(value).date('Y-m-d H:i:s');
    }
    return value;
  }
}


module.exports = {
  conn: {},
  init: function(){
    if(!Candy.Config?.mysql) return;
    if(!Candy.Config.mysql.db) Candy.Config.mysql.db = {};
    if(!Candy.Config.mysql.db['default']) Candy.Config.mysql.db['default'] = {};
    let db = Candy.Config.mysql;
    Candy.Mysql.conn['default'] = mysql.createConnection({
        host: db.host ?? "127.0.0.1",
        user: db.username,
        password: db.password,
        database: db.database
    });
    Candy.Mysql.conn['default'].connect();
    Candy.Mysql.conn['default'].query('SHOW TABLES', (err, result) => {
      if(err){
        console.error('Mysql Connection Error', err);
        return;
      }
      for(let table of result) for(let key of Object.keys(table)){
        let t = new Table(table[key], Candy.Mysql.conn['default']);
      }
    });
  },
  table: function(name){
    return new Table(name, Candy.Mysql.conn['default']);
  },
  raw: function(query){
    return new Raw(query);
  }
};
